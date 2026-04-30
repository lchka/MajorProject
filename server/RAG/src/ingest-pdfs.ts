import "dotenv/config";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";
import { ragEmbeddingService } from "./embedding.service.js";

type PineconeVector = {
	id: string;
	values: number[];
	metadata: {
		source: string;
		title: string;
		author: string;
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
const DEFAULT_HTTP_TIMEOUT_MS = 30_000;

const fetchWithTimeout = async (
	url: string,
	init: RequestInit,
	timeoutMs: number,
	timeoutLabel: string,
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
			throw new Error(`${timeoutLabel} timed out after ${timeoutMs}ms.`);
		}

		throw error;
	} finally {
		clearTimeout(timeoutId);
	}
};

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

const normalizeMetadataField = (value: unknown): string | null => {
	if (typeof value !== "string") {
		return null;
	}

	const clean = value.trim();
	return clean.length > 0 ? clean : null;
};

const titleFromFileName = (fileName: string): string =>
	fileName
		.replace(/\.pdf$/i, "")
		.replace(/[_-]+/g, " ")
		.replace(/\s+/g, " ")
		.trim();

const isLikelyNoiseLine = (line: string): boolean => {
	const lower = line.toLowerCase();
	return (
		lower.startsWith("doi") ||
		lower.includes("journal") ||
		lower.includes("copyright") ||
		lower.includes("all rights reserved") ||
		lower.includes("university") ||
		lower.includes("department") ||
		lower.includes("received") ||
		lower.includes("accepted") ||
		lower.includes("published") ||
		lower.includes("www.") ||
		lower.includes("http")
	);
};

const inferFromFirstPageText = (firstPageText: string): { title: string | null; author: string | null } => {
	const rawLines = firstPageText
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
		.slice(0, 60);

	const lines = rawLines.filter((line) => !isLikelyNoiseLine(line));
	if (lines.length === 0) {
		return { title: null, author: null };
	}

	const titleLines: string[] = [];
	for (const line of lines) {
		const lower = line.toLowerCase();
		if (lower === "abstract" || lower.startsWith("abstract ")) {
			break;
		}

		// Stop title capture when the line looks like author list.
		if (/^[a-zA-Z][a-zA-Z\s.,-]{2,120}$/.test(line) && (line.includes(",") || line.includes(" and "))) {
			break;
		}

		if (line.length >= 8 && line.length <= 180) {
			titleLines.push(line);
		}

		if (titleLines.join(" ").length > 140) {
			break;
		}
	}

	const title = titleLines.length > 0 ? titleLines.join(" ").replace(/\s+/g, " ").trim() : null;

	let author: string | null = null;
	const afterTitleIndex = Math.max(titleLines.length, 1);
	for (let i = afterTitleIndex; i < Math.min(lines.length, afterTitleIndex + 8); i += 1) {
		const line = lines[i];
		if (line.length < 3 || line.length > 140) {
			continue;
		}

		const lower = line.toLowerCase();
		if (lower === "abstract" || lower.startsWith("abstract ")) {
			break;
		}

		if (/\d/.test(line)) {
			continue;
		}

		if (/(^|\s)(dr\.?|prof\.?|md|phd)(\s|$)/i.test(line) || line.includes(",") || line.includes(" and ")) {
			author = line.replace(/\s+/g, " ").trim();
			break;
		}
	}

	return { title, author };
};

const upsertVectors = async (params: {
	host: string;
	apiKey: string;
	vectors: PineconeVector[];
	namespace: string;
	httpTimeoutMs: number;
}): Promise<void> => {
	const response = await fetchWithTimeout(
		`${params.host}/vectors/upsert`,
		{
		method: "POST",
		headers: {
			"Api-Key": params.apiKey,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			vectors: params.vectors,
			namespace: params.namespace,
		}),
		},
		params.httpTimeoutMs,
		"Pinecone upsert request",
	);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Pinecone upsert failed (${response.status}): ${errorText || response.statusText}`);
	}
};

const fetchExistingVectorIds = async (params: {
	host: string;
	apiKey: string;
	namespace: string;
	ids: string[];
	httpTimeoutMs: number;
}): Promise<Set<string>> => {
	if (params.ids.length === 0) {
		return new Set<string>();
	}

	const response = await fetchWithTimeout(
		`${params.host}/vectors/fetch`,
		{
		method: "POST",
		headers: {
			"Api-Key": params.apiKey,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			ids: params.ids,
			namespace: params.namespace,
		}),
		},
		params.httpTimeoutMs,
		"Pinecone fetch request",
	);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Pinecone fetch failed (${response.status}): ${errorText || response.statusText}`);
	}

	const rawBody = await response.text();
	if (!rawBody.trim()) {
		return new Set<string>();
	}

	let data: { vectors?: Record<string, unknown> };
	try {
		data = JSON.parse(rawBody) as { vectors?: Record<string, unknown> };
	} catch {
		return new Set<string>();
	}

	return new Set(Object.keys(data.vectors ?? {}));
};

const ingestSinglePdf = async (params: {
	pdfDir: string;
	fileName: string;
	namespace: string;
	pineconeHost: string;
	pineconeApiKey: string;
	httpTimeoutMs: number;
}): Promise<number> => {
	const filePath = path.join(params.pdfDir, params.fileName);
	console.log(`Reading ${params.fileName}...`);
	const buffer = await readFile(filePath);
	console.log(`Parsing ${params.fileName}...`);
	const parser = new PDFParse({ data: buffer });
	const infoResult = await parser.getInfo();
	const textResult = await parser.getText();
	await parser.destroy();
	const chunks = chunkText(textResult.text);
	const firstPageText = textResult.pages?.[0]?.text ?? "";
	const inferred = inferFromFirstPageText(firstPageText);
	const parsedTitle =
		normalizeMetadataField(infoResult.info?.Title) ??
		inferred.title ??
		titleFromFileName(params.fileName);
	const parsedAuthor = normalizeMetadataField(infoResult.info?.Author) ?? inferred.author ?? "Unknown author";

	if (chunks.length === 0) {
		console.warn(`Skipped ${params.fileName}: no text extracted.`);
		return 0;
	}

	console.log(`${params.fileName}: extracted ${chunks.length} chunks.`);

	const chunkItems = chunks.map((chunk, index) => ({
		id: createChunkId(params.fileName, index),
		chunk,
		index,
	}));

	const existingIds = new Set<string>();
	for (let i = 0; i < chunkItems.length; i += UPSERT_BATCH_SIZE) {
		const idBatch = chunkItems.slice(i, i + UPSERT_BATCH_SIZE).map((item) => item.id);
		const batchExisting = await fetchExistingVectorIds({
			host: params.pineconeHost,
			apiKey: params.pineconeApiKey,
			namespace: params.namespace,
			ids: idBatch,
			httpTimeoutMs: params.httpTimeoutMs,
		});

		for (const id of batchExisting) {
			existingIds.add(id);
		}
	}

	const missingItems = chunkItems.filter((item) => !existingIds.has(item.id));
	if (missingItems.length === 0) {
		console.log(`Skipped ${params.fileName}: all ${chunks.length} chunks already indexed.`);
		return 0;
	}

	let indexedNow = 0;
	let vectorBuffer: PineconeVector[] = [];

	for (const item of missingItems) {
		if (indexedNow === 0 && vectorBuffer.length === 0) {
			console.log(`${params.fileName}: generating embeddings for ${missingItems.length} new chunks...`);
		}
		const preparedCount = indexedNow + vectorBuffer.length;
		if (preparedCount % 5 === 0) {
			console.log(
				`${params.fileName}: preparing chunk ${preparedCount + 1}/${missingItems.length} for embedding...`,
			);
		}

		const embedding = await ragEmbeddingService.embedText(item.chunk);
		vectorBuffer.push({
			id: item.id,
			values: embedding,
			metadata: {
				source: params.fileName,
				title: parsedTitle,
				author: parsedAuthor,
				chunkIndex: item.index,
				totalChunks: chunks.length,
				text: item.chunk,
			},
		});

		if (vectorBuffer.length >= UPSERT_BATCH_SIZE) {
			await upsertVectors({
				host: params.pineconeHost,
				apiKey: params.pineconeApiKey,
				vectors: vectorBuffer,
				namespace: params.namespace,
				httpTimeoutMs: params.httpTimeoutMs,
			});
			indexedNow += vectorBuffer.length;
			console.log(`${params.fileName}: upserted ${indexedNow}/${missingItems.length} new chunks.`);
			vectorBuffer = [];
		}
	}

	if (vectorBuffer.length > 0) {
		await upsertVectors({
			host: params.pineconeHost,
			apiKey: params.pineconeApiKey,
			vectors: vectorBuffer,
			namespace: params.namespace,
			httpTimeoutMs: params.httpTimeoutMs,
		});
		indexedNow += vectorBuffer.length;
	}

	console.log(
		`Indexed ${params.fileName}: ${indexedNow} new chunks (${chunks.length - indexedNow} already existed).`,
	);
	return indexedNow;
};

export const ingestPdfsToPinecone = async (options?: {
	pdfDirectory?: string;
	namespace?: string;
}): Promise<void> => {
	const pineconeApiKey = process.env.PINECONE_API_KEY;
	const pineconeHost = process.env.PINECONE_HOST;
	const namespace = options?.namespace ?? process.env.PINECONE_NAMESPACE ?? DEFAULT_NAMESPACE;
	const pdfDirectory = options?.pdfDirectory ?? DEFAULT_PDF_DIR;
	const httpTimeoutMs = Number(process.env.RAG_HTTP_TIMEOUT_MS ?? DEFAULT_HTTP_TIMEOUT_MS);

	if (!pineconeApiKey) {
		throw new Error("PINECONE_API_KEY is missing in environment variables.");
	}
	if (!pineconeHost) {
		throw new Error("PINECONE_HOST is missing in environment variables.");
	}
	if (!Number.isInteger(httpTimeoutMs) || httpTimeoutMs <= 0) {
		throw new Error("RAG_HTTP_TIMEOUT_MS must be a positive integer.");
	}

	console.log(`Starting ingestion from '${pdfDirectory}' into namespace '${namespace}'...`);

	const files = await readdir(pdfDirectory);
	const pdfFiles = files.filter((file) => file.toLowerCase().endsWith(".pdf"));

	if (pdfFiles.length === 0) {
		console.warn(`No PDF files found in ${pdfDirectory}`);
		return;
	}
	console.log(`Found ${pdfFiles.length} PDF file(s).`);

	let totalChunks = 0;
	for (let fileIndex = 0; fileIndex < pdfFiles.length; fileIndex += 1) {
		const fileName = pdfFiles[fileIndex];
		console.log(`[${fileIndex + 1}/${pdfFiles.length}] Processing ${fileName}`);
		totalChunks += await ingestSinglePdf({
			pdfDir: pdfDirectory,
			fileName,
			namespace,
			pineconeHost: toPineconeHost(pineconeHost),
			pineconeApiKey,
			httpTimeoutMs,
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
