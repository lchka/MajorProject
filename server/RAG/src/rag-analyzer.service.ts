import { GoogleGenerativeAI } from "@google/generative-ai";
import { INTERNAL_SERVER_ERROR, HttpError } from "../../utils/HttpError.js";
import { formatChunksForPrompt, retrieveRelevantChunks, type RagChunkMatch } from "./retrieve.service.js";

export type RagAnswer = {
	answer: string;
	citations: Array<{
		source: string;
		chunkIndex: number;
		score: number;
	}>;
	matches: RagChunkMatch[];
};
// Instruction template for the RAG system that emphasizes strict evidence grounding, instructing the model to only use the provided context chunks to answer the question, and to explicitly state when the context is insufficient, while also including a requirement to list the sources used in the answer, which helps ensure that the model's responses are based on the indexed documents and that it does not fabricate information.
const groundedInstruction = `
You are a strict evidence-grounded skincare research assistant.
Use ONLY the provided context chunks to answer.
If context is insufficient, explicitly say: "I do not have enough evidence in the indexed documents."
Do not invent studies, sources, or claims.
At the end, include a short "Sources" list with [n] references used.
`;

export const answerWithRag = async (question: string): Promise<RagAnswer> => {
	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) {
		throw new HttpError(
			INTERNAL_SERVER_ERROR,
			"GEMINI_API_KEY is missing. Add it to your server environment.",
		);
	}
// Retrieve relevant chunks from the knowledge base based on the question, format them for inclusion in the prompt, and then use the Google Generative AI model to generate an answer based on the question and the retrieved context, while ensuring that the API key is properly configured and handling any potential errors that may arise during the process.
	const matches = await retrieveRelevantChunks({ question });
	const context = formatChunksForPrompt(matches);

	const client = new GoogleGenerativeAI(apiKey);
	const model = client.getGenerativeModel({
		model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
	});

	const prompt = `${groundedInstruction}\n\nQuestion:\n${question}\n\nRetrieved Context:\n${context}`;
	const result = await model.generateContent(prompt);
	const answer = result.response.text()?.trim() ?? "";

	return {
		answer,
		matches,
		citations: matches.map((match) => ({
			source: match.source,
			chunkIndex: match.chunkIndex,
			score: match.score,
		})),
	};
};
