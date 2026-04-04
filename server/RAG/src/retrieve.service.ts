import { BAD_REQUEST, HttpError, INTERNAL_SERVER_ERROR } from "../../utils/HttpError";
import { ragEmbeddingService } from "./embedding.service";

export type RagChunkMatch = {
	id: string;
	score: number;
	source: string;
	chunkIndex: number;
	totalChunks: number;
	text: string;
};

type PineconeQueryMatch = {
	id?: string;
	score?: number;
	metadata?: {
		source?: string;
		chunkIndex?: number;
		totalChunks?: number;
		text?: string;
	};
};

type PineconeQueryResponse = {
	matches?: PineconeQueryMatch[];
};

const DEFAULT_TOP_K = 8;
const DEFAULT_NAMESPACE = "research-pdfs";

const toPineconeHost = (host: string): string => {
	const normalized = host.trim();
	if (!normalized) {
		throw new HttpError(INTERNAL_SERVER_ERROR, "PINECONE_HOST is required.");
	}

	if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
		return normalized;
	}

	return `https://${normalized}`;
};

export const retrieveRelevantChunks = async (params: {
	question: string;
	topK?: number;
	namespace?: string;
}): Promise<RagChunkMatch[]> => {
	const question = params.question.trim();
	if (!question) {
		throw new HttpError(BAD_REQUEST, "Question cannot be empty.");
	}

	const pineconeApiKey = process.env.PINECONE_API_KEY;
	const pineconeHost = process.env.PINECONE_HOST;
	if (!pineconeApiKey || !pineconeHost) {
		throw new HttpError(
			INTERNAL_SERVER_ERROR,
			"PINECONE_API_KEY or PINECONE_HOST is missing from server environment.",
		);
	}

	const topK = params.topK ?? Number(process.env.RAG_TOP_K ?? DEFAULT_TOP_K);
	const namespace = params.namespace ?? process.env.PINECONE_NAMESPACE ?? DEFAULT_NAMESPACE;

	const queryVector = await ragEmbeddingService.embedText(question);
	const response = await fetch(`${toPineconeHost(pineconeHost)}/query`, {
		method: "POST",
		headers: {
			"Api-Key": pineconeApiKey,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			vector: queryVector,
			topK,
			namespace,
			includeValues: false,
			includeMetadata: true,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new HttpError(
			INTERNAL_SERVER_ERROR,
			`Pinecone query failed (${response.status}): ${errorText || response.statusText}`,
		);
	}

	const data = (await response.json()) as PineconeQueryResponse;
	const matches = data.matches ?? [];

	return matches
		.filter((match) => match.id && typeof match.metadata?.text === "string")
		.map((match) => ({
			id: match.id as string,
			score: typeof match.score === "number" ? match.score : 0,
			source: match.metadata?.source ?? "unknown",
			chunkIndex: typeof match.metadata?.chunkIndex === "number" ? match.metadata.chunkIndex : -1,
			totalChunks: typeof match.metadata?.totalChunks === "number" ? match.metadata.totalChunks : -1,
			text: match.metadata?.text as string,
		}));
};

export const formatChunksForPrompt = (matches: RagChunkMatch[]): string => {
	if (matches.length === 0) {
		return "No supporting context was retrieved.";
	}

	return matches
		.map(
			(match, index) =>
				`[${index + 1}] source=${match.source}; chunk=${match.chunkIndex}/${match.totalChunks}; score=${match.score.toFixed(4)}\n${match.text}`,
		)
		.join("\n\n");
};
