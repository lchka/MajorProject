import { GoogleGenerativeAI } from "@google/generative-ai";
import { INTERNAL_SERVER_ERROR, HttpError } from "../../utils/HttpError";
import { formatChunksForPrompt, retrieveRelevantChunks, type RagChunkMatch } from "./retrieve.service";

export type RagAnswer = {
	answer: string;
	citations: Array<{
		source: string;
		chunkIndex: number;
		score: number;
	}>;
	matches: RagChunkMatch[];
};

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
