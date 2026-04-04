import "dotenv/config";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";
import { ragEmbeddingService } from "./embedding.service";

type PineconeVector = {
	id: string;
	values: number[];
	metadata: {
		source: string;
		chunkIndex: number;
		totalChunks: number;
		text: string;
	};
};

const DEFAULT_PDF_DIR = path.resolve(process.cwd(), "RAG", "pdfs");
const DEFAULT_NAMESPACE = "research-pdfs";
const DEFAULT_CHUNK_SIZE = 1200;
const DEFAULT_CHUNK_OVERLAP = 200;
const UPSERT_BATCH_SIZE = 50;

const toPineconeHost = (host: string): string => {
	const normalized = host.trim();
	if (!normalized) {
		throw new Error("PINECONE_HOST is required.");
	}

	if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
		return normalized;
	}

	return `https://${normalized}`;
};

const chunkText = (text: string, chunkSize = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_CHUNK_OVERLAP): string[] => {
	const cleanText = text.replace(/\s+/g, " ").trim();
	if (!cleanText) {
		return [];
	}

	if (overlap >= chunkSize) {
		throw new Error("Chunk overlap must be smaller than chunk size.");
	}

	const chunks: string[] = [];
	let start = 0;

	while (start < cleanText.length) {
		const end = Math.min(start + chunkSize, cleanText.length);
		chunks.push(cleanText.slice(start, end).trim());
		if (end === cleanText.length) {
			break;
		}
		start = end - overlap;
	}

	return chunks.filter(Boolean);
};

const createChunkId = (fileName: string, chunkIndex: number): string => {
	const stablePart = createHash("sha1").update(fileName).digest("hex").slice(0, 12);
	return `${stablePart}-chunk-${chunkIndex}`;
};

const upsertVectors = async (params: {
	host: string;
	apiKey: string;
	vectors: PineconeVector[];
	namespace: string;
}): Promise<void> => {
	const response = await fetch(`${params.host}/vectors/upsert`, {
		method: "POST",
		headers: {
			"Api-Key": params.apiKey,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			vectors: params.vectors,
			namespace: params.namespace,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Pinecone upsert failed (${response.status}): ${errorText || response.statusText}`);
	}
};

const ingestSinglePdf = async (params: {
	pdfDir: string;
	fileName: string;
	namespace: string;
	pineconeHost: string;
	pineconeApiKey: string;
}): Promise<number> => {
	const filePath = path.join(params.pdfDir, params.fileName);
	const buffer = await readFile(filePath);
	const parser = new PDFParse({ data: buffer });
	const textResult = await parser.getText();
	await parser.destroy();
	const chunks = chunkText(textResult.text);

	if (chunks.length === 0) {
		console.warn(`Skipped ${params.fileName}: no text extracted.`);
		return 0;
	}

	const embeddings = await ragEmbeddingService.embedTexts(chunks);
	const vectors: PineconeVector[] = chunks.map((chunk, index) => ({
		id: createChunkId(params.fileName, index),
		values: embeddings[index],
		metadata: {
			source: params.fileName,
			chunkIndex: index,
			totalChunks: chunks.length,
			text: chunk,
		},
	}));

	for (let i = 0; i < vectors.length; i += UPSERT_BATCH_SIZE) {
		const batch = vectors.slice(i, i + UPSERT_BATCH_SIZE);
		await upsertVectors({
			host: params.pineconeHost,
			apiKey: params.pineconeApiKey,
			vectors: batch,
			namespace: params.namespace,
		});
	}

	console.log(`Indexed ${params.fileName}: ${chunks.length} chunks.`);
	return chunks.length;
};

export const ingestPdfsToPinecone = async (options?: {
	pdfDirectory?: string;
	namespace?: string;
}): Promise<void> => {
	const pineconeApiKey = process.env.PINECONE_API_KEY;
	const pineconeHost = process.env.PINECONE_HOST;
	const namespace = options?.namespace ?? process.env.PINECONE_NAMESPACE ?? DEFAULT_NAMESPACE;
	const pdfDirectory = options?.pdfDirectory ?? DEFAULT_PDF_DIR;

	if (!pineconeApiKey) {
		throw new Error("PINECONE_API_KEY is missing in environment variables.");
	}
	if (!pineconeHost) {
		throw new Error("PINECONE_HOST is missing in environment variables.");
	}

	const files = await readdir(pdfDirectory);
	const pdfFiles = files.filter((file) => file.toLowerCase().endsWith(".pdf"));

	if (pdfFiles.length === 0) {
		console.warn(`No PDF files found in ${pdfDirectory}`);
		return;
	}

	let totalChunks = 0;
	for (const fileName of pdfFiles) {
		totalChunks += await ingestSinglePdf({
			pdfDir: pdfDirectory,
			fileName,
			namespace,
			pineconeHost: toPineconeHost(pineconeHost),
			pineconeApiKey,
		});
	}

	console.log(`Done. Indexed ${pdfFiles.length} PDFs and ${totalChunks} total chunks to namespace '${namespace}'.`);
};

if (process.argv[1]?.endsWith("ingest-pdfs.ts")) {
	ingestPdfsToPinecone().catch((error) => {
		console.error("RAG PDF ingestion failed:", error);
		process.exitCode = 1;
	});
}
