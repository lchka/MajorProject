import { BAD_REQUEST, HttpError, INTERNAL_SERVER_ERROR } from "../../utils/HttpError";

type GeminiEmbedResponse = {
	embedding?: {
		values?: number[];
	};
	error?: {
		code?: number;
		message?: string;
	};
};

const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001";
const DEFAULT_OUTPUT_DIMENSION = 768;
const DEFAULT_MIN_INTERVAL_MS = 700;
const DEFAULT_MAX_RATE_LIMIT_RETRIES = 30;
const DEFAULT_RATE_LIMIT_WAIT_MS = 60_000;

const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

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

export class RagEmbeddingService {
	private readonly apiKey: string;
	private readonly modelCandidates: string[];
	private readonly outputDimension: number;
	private readonly minIntervalMs: number;
	private readonly maxRateLimitRetries: number;
	private readonly rateLimitWaitMs: number;

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
	}

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
				const response = await fetch(url, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(requestBody),
				});

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
