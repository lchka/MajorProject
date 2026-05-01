import { BAD_REQUEST, HttpError, INTERNAL_SERVER_ERROR } from "../../utils/HttpError.js";
// Service class for generating text embeddings using Google's Gemini API, with support for configurable models, output dimensions, rate limit handling, and request timeouts, designed to be used in a Retrieval-Augmented Generation (RAG) system for embedding text data before storing it in a vector database or using it for similarity search.
type GeminiEmbedResponse = {
	embedding?: {
		values?: number[];
	};
	error?: {
		code?: number;
		message?: string;
	};
};
// Default configuration values for the embedding service, which can be overridden by environment variables or constructor options, providing sensible defaults for model selection, output dimensionality, rate limit handling, and request timeouts to ensure robust operation of the embedding generation process.
const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001";
const DEFAULT_OUTPUT_DIMENSION = 768;
const DEFAULT_MIN_INTERVAL_MS = 700;
const DEFAULT_MAX_RATE_LIMIT_RETRIES = 30;
const DEFAULT_RATE_LIMIT_WAIT_MS = 60_000;
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
// Utility function to pause execution for a specified number of milliseconds, used to implement delays between embedding requests when handling rate limits or spacing out batch requests to the Gemini API.
const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
// Utility function to perform a fetch request with a timeout, using the AbortController API to abort the request if it exceeds the specified timeout duration, and throwing an appropriate HttpError if a timeout occurs or if other errors are encountered during the fetch operation.
const fetchWithTimeout = async (
	url: string,
	init: RequestInit,
	timeoutMs: number,
): Promise<Response> => {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => {
		controller.abort();
	}, timeoutMs);

	try {
		return await fetch(url, {
			...init,
			signal: controller.signal,
		});
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new HttpError(
				INTERNAL_SERVER_ERROR,
				`Gemini embedding request timed out after ${timeoutMs}ms.`,
			);
		}

		throw error;
	} finally {
		clearTimeout(timeoutId);
	}
};
// Utility function to parse the retry delay from a Gemini API error response, which may include a retry delay in the error details when a rate limit is hit, allowing the embedding service to respect the recommended wait time before retrying the request.
const parseRetryDelayMs = (errorText: string): number | null => {
	try {
		const parsed = JSON.parse(errorText) as {
			error?: {
				details?: Array<{ "@type"?: string; retryDelay?: string }>;
			};
		};

		const details = parsed.error?.details;
		if (!Array.isArray(details)) {
			return null;
		}

		const retryInfo = details.find((detail) => detail["@type"]?.includes("RetryInfo"));
		const retryDelay = retryInfo?.retryDelay;
		if (!retryDelay) {
			return null;
		}

		const seconds = Number.parseFloat(retryDelay.replace("s", ""));
		if (!Number.isFinite(seconds) || seconds <= 0) {
			return null;
		}

		return Math.ceil(seconds * 1000);
	} catch {
		return null;
	}
};
// Main service class for generating text embeddings using the Gemini API, with methods for embedding single texts and batches of texts, and handling various edge cases such as empty input, API errors, rate limits, and model compatibility issues, while providing informative error messages and configurable behavior through environment variables and constructor options.
export class RagEmbeddingService {
	private readonly apiKey: string;
	private readonly modelCandidates: string[];
	private readonly outputDimension: number;
	private readonly minIntervalMs: number;
	private readonly maxRateLimitRetries: number;
	private readonly rateLimitWaitMs: number;
	private readonly requestTimeoutMs: number;

	constructor(options?: { model?: string; outputDimension?: number }) {
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			throw new HttpError(
				INTERNAL_SERVER_ERROR,
				"GEMINI_API_KEY is missing. Add it to your server environment.",
			);
		}

		this.apiKey = apiKey;
		const preferredModel =
			options?.model ?? process.env.GEMINI_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL;
		// Keep candidate list focused on models that support embedContent in current Gemini API.
		this.modelCandidates = [...new Set([preferredModel, "gemini-embedding-001"])]
			.map((modelName) => modelName.trim())
			.filter((modelName) => modelName.length > 0);

		if (this.modelCandidates.length === 0) {
			throw new HttpError(BAD_REQUEST, "No embedding model candidates configured.");
		}

		this.outputDimension =
			options?.outputDimension ??
			Number(process.env.GEMINI_EMBEDDING_DIMENSION ?? DEFAULT_OUTPUT_DIMENSION);
		this.minIntervalMs = Number(
			process.env.GEMINI_EMBEDDING_MIN_INTERVAL_MS ?? DEFAULT_MIN_INTERVAL_MS,
		);
		this.maxRateLimitRetries = Number(
			process.env.GEMINI_EMBEDDING_MAX_RETRIES ?? DEFAULT_MAX_RATE_LIMIT_RETRIES,
		);
		this.rateLimitWaitMs = Number(
			process.env.GEMINI_EMBEDDING_RATE_LIMIT_WAIT_MS ?? DEFAULT_RATE_LIMIT_WAIT_MS,
		);
		this.requestTimeoutMs = Number(
			process.env.GEMINI_EMBEDDING_TIMEOUT_MS ?? DEFAULT_REQUEST_TIMEOUT_MS,
		);

		if (!Number.isInteger(this.outputDimension) || this.outputDimension <= 0) {
			throw new HttpError(BAD_REQUEST, "GEMINI_EMBEDDING_DIMENSION must be a positive integer.");
		}

		if (!Number.isInteger(this.minIntervalMs) || this.minIntervalMs < 0) {
			throw new HttpError(
				BAD_REQUEST,
				"GEMINI_EMBEDDING_MIN_INTERVAL_MS must be a non-negative integer.",
			);
		}

		if (!Number.isInteger(this.maxRateLimitRetries) || this.maxRateLimitRetries <= 0) {
			throw new HttpError(
				BAD_REQUEST,
				"GEMINI_EMBEDDING_MAX_RETRIES must be a positive integer.",
			);
		}

		if (!Number.isInteger(this.rateLimitWaitMs) || this.rateLimitWaitMs <= 0) {
			throw new HttpError(
				BAD_REQUEST,
				"GEMINI_EMBEDDING_RATE_LIMIT_WAIT_MS must be a positive integer.",
			);
		}

		if (!Number.isInteger(this.requestTimeoutMs) || this.requestTimeoutMs <= 0) {
			throw new HttpError(
				BAD_REQUEST,
				"GEMINI_EMBEDDING_TIMEOUT_MS must be a positive integer.",
			);
		}
	}
// Method to embed a single text string, which includes validation for empty input, iterating through candidate models with retry logic for rate limits, and error handling for various failure scenarios, ultimately returning the embedding vector or throwing an appropriate HttpError.
	async embedText(text: string): Promise<number[]> {
		const cleanText = text.trim();
		if (!cleanText) {
			throw new HttpError(BAD_REQUEST, "Text cannot be empty when creating embeddings.");
		}

		const requestBody = {
			content: {
				parts: [{ text: cleanText }],
			},
			outputDimensionality: this.outputDimension,
		};

		let lastErrorMessage = "Gemini embedding request failed.";
		let sawCompatibilityError = false;

		for (const modelName of this.modelCandidates) {
			for (let attempt = 1; attempt <= this.maxRateLimitRetries; attempt += 1) {
				const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${this.apiKey}`;
				const response = await fetchWithTimeout(
					url,
					{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(requestBody),
					},
					this.requestTimeoutMs,
				);

				if (response.ok) {
					const data = (await response.json()) as GeminiEmbedResponse;
					const values = data.embedding?.values;

					if (Array.isArray(values) && values.length > 0) {
						return values;
					}

					lastErrorMessage = `Gemini model '${modelName}' returned no embedding values.`;
					break;
				}

				const errorText = await response.text();
				lastErrorMessage = `Gemini embedding request failed for model '${modelName}' (${response.status}): ${errorText || response.statusText}`;

				if (response.status === 429) {
					const retryMs = parseRetryDelayMs(errorText) ?? this.rateLimitWaitMs;
					console.warn(
						`Gemini embedding rate-limited for model '${modelName}' (attempt ${attempt}/${this.maxRateLimitRetries}). Retrying in ${retryMs}ms...`,
					);
					await sleep(retryMs);
					lastErrorMessage = `Gemini embedding request hit rate limit for model '${modelName}'. Retried ${this.maxRateLimitRetries} times.`;
					continue;
				}

				// Try the next candidate when model name or endpoint support differs.
				if (response.status === 404 || response.status === 400) {
					sawCompatibilityError = true;
					break;
				}

				throw new HttpError(INTERNAL_SERVER_ERROR, lastErrorMessage);
			}
		}

		if (sawCompatibilityError && lastErrorMessage === "Gemini embedding request failed.") {
			lastErrorMessage =
				"No configured Gemini embedding model supports embedContent. Set GEMINI_EMBEDDING_MODEL=gemini-embedding-001.";
		}

		throw new HttpError(INTERNAL_SERVER_ERROR, lastErrorMessage);
	}
// Method to embed an array of text strings in batch, which validates the input array, iterates through the texts while embedding them individually with spacing between requests to respect rate limits, and collects the resulting embeddings into an array, ultimately returning the array of embedding vectors or throwing an appropriate HttpError if validation fails.
	async embedTexts(texts: string[]): Promise<number[][]> {
		if (!Array.isArray(texts) || texts.length === 0) {
			throw new HttpError(BAD_REQUEST, "At least one text is required for batch embeddings.");
		}

		const embeddings: number[][] = [];
		for (let index = 0; index < texts.length; index += 1) {
			const embedding = await this.embedText(texts[index]);
			embeddings.push(embedding);

			if (index < texts.length - 1 && this.minIntervalMs > 0) {
				await sleep(this.minIntervalMs);
			}
		}

		return embeddings;
	}
}

export const ragEmbeddingService = new RagEmbeddingService();
