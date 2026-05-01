import { BAD_REQUEST, HttpError, INTERNAL_SERVER_ERROR } from "../../utils/HttpError.js";
import { ragEmbeddingService } from "./embedding.service.js";
// Type definition for a chunk match returned from the retrieval process, which includes metadata about the source document, the chunk's position within the document, and the relevance score, allowing for structured handling of retrieved context when generating answers in the RAG system.
export type RagChunkMatch = {
	id: string;
	score: number;
	source: string;
	title: string;
	author: string;
	chunkIndex: number;
	totalChunks: number;
	text: string;
};

type PineconeQueryMatch = {
	id?: string;
	score?: number;
	metadata?: {
		source?: string;
		title?: string;
		author?: string;
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
// Utility function to ensure that the Pinecone host URL is properly formatted with a protocol, which is necessary for making API requests to the Pinecone service, and provides a helpful error message if the host is not configured.
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
// Function to retrieve relevant chunks from the Pinecone vector database based on a question, which generates an embedding for the question, queries Pinecone for the most relevant chunks, and returns a structured list of matches with metadata, while handling errors related to missing configuration and invalid responses from the Pinecone API.
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
// Determine the number of top matches to retrieve and the Pinecone namespace to query, using function parameters or falling back to environment variables or defaults, which allows for flexible configuration of the retrieval process based on different use cases or environments.
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
// Filter and map the raw Pinecone matches to the structured RagChunkMatch format, ensuring that only valid matches with necessary metadata are included, and providing default values for any missing metadata fields to maintain consistency in the returned results.
	return matches
		.filter((match) => match.id && typeof match.metadata?.text === "string")
		.map((match) => ({
			id: match.id as string,
			score: typeof match.score === "number" ? match.score : 0,
			source: match.metadata?.source ?? "unknown",
			title: match.metadata?.title ?? "Untitled source",
			author: match.metadata?.author ?? "Unknown author",
			chunkIndex: typeof match.metadata?.chunkIndex === "number" ? match.metadata.chunkIndex : -1,
			totalChunks: typeof match.metadata?.totalChunks === "number" ? match.metadata.totalChunks : -1,
			text: match.metadata?.text as string,
		}));
};
// Utility function to format retrieved chunks into a string suitable for inclusion in the prompt to the generative model, which includes metadata about each chunk and the chunk text itself, and handles the case where no matches were retrieved by providing a default message, ensuring that the prompt is informative and well-structured for the model to generate an answer based on the provided context.
export const formatChunksForPrompt = (matches: RagChunkMatch[]): string => {
	if (matches.length === 0) {
		return "No supporting context was retrieved.";
	}

	return matches
		.map(
			(match, index) =>
				`[${index + 1}] source=${match.source}; title=${match.title}; author=${match.author}; chunk=${match.chunkIndex}/${match.totalChunks}; score=${match.score.toFixed(4)}\n${match.text}`,
		)
		.join("\n\n");
};
