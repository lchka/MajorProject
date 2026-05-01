import "dotenv/config";
import { answerWithRag } from "./rag-analyzer.service.js";

const question = process.argv.slice(2).join(" ").trim();
// Simple command-line interface to ask a question to the RAG system, allowing users to input a query and receive an answer along with relevant citations from the knowledge base, demonstrating the capabilities of the RAG implementation in a straightforward manner.
if (!question) {
	console.error("Usage: tsx RAG/src/ask-rag.ts \"your question\"");
	process.exit(1);
}

answerWithRag(question)
	.then((result) => {
		console.log("\nAnswer:\n");
		console.log(result.answer || "No answer returned.");

		console.log("\nCitations:\n");
		for (const [index, citation] of result.citations.entries()) {
			console.log(
				`${index + 1}. source=${citation.source}, chunk=${citation.chunkIndex}, score=${citation.score.toFixed(4)}`,
			);
		}
	})
	.catch((error) => {
		console.error("RAG query failed:", error);
		process.exitCode = 1;
	});
