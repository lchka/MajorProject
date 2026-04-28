import axios from "axios";
import { BAD_REQUEST, HttpError, INTERNAL_SERVER_ERROR, NOT_FOUND } from "../utils/HttpError.js";

type SerpImageResult = {
  original?: string;
  thumbnail?: string;
};

type SerpApiResponse = {
  images_results?: SerpImageResult[];
};

export type OfficialImageAsset = {
  sourceUrl: string;
  contentType: string;
  buffer: Buffer;
};

export class SerpApiImageService {
  private readonly serpApiBaseUrl = "https://serpapi.com/search.json";
  private readonly serpApiTimeoutMs = 12000;

  private compactWords(value: string): string {
    return Array.from(
      new Set(
        value
          .split(/\s+/)
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
          .map((item) => item.toLowerCase()),
      ),
    ).join(" ");
  }

  private sanitizeQuery(value: string): string {
    // Remove special characters that can break SerpAPI queries
    return value
      .replace(/['"{}[\]|\\^`]/g, "") // Remove quotes and special chars
      .replace(/[&]/g, "and") // Convert & to "and"
      .trim();
  }

  private getApiKey(): string {
    const apiKey = process.env.SERPAPI_API_KEY?.trim();

    if (!apiKey) {
      throw new HttpError(
        INTERNAL_SERVER_ERROR,
        "SERPAPI_API_KEY is missing. Add it to your server environment.",
      );
    }

    return apiKey;
  }

  private buildQuery(name: string, brand: string): string {
    // CHANGE: Added logging to trace query construction
    const primary = this.compactWords(`${brand} ${name}`);
    const sanitized = this.sanitizeQuery(primary);
    //search query PROMPT
    const query = `${sanitized} product white background`.trim();
    const finalQuery = query.replace(/\s+/g, " ");
    console.log(`[SerpAPI] Query built - name: "${name}", brand: "${brand}" → "${finalQuery}"`);
    return finalQuery;
  }

  // Extract and validate image URLs from SerpAPI results
  private extractValidImage(results: SerpImageResult[]): string | null {
    const blockedDomains = [
      "fbsbx.com",
      "lookaside",
      "facebook",
      "pinterest",
      "instagram",
      "tiktok",
      "media_id=",
      "tracker",
      "redirect",
    ];

    for (const result of results) {
      const url = result.original ?? result.thumbnail;
      if (!url) continue;

      // 🚫 skip bad domains
      if (blockedDomains.some(domain => url.includes(domain))) {
        console.log(`[SerpAPI] Skipping blocked domain: ${url}`);
        continue;
      }

      // 🚫 skip obvious non-image URLs
      if (!url.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i)) {
        console.log(`[SerpAPI] Skipping non-direct image URL: ${url}`);
        continue;
      }

      // 🚫 Additional check: skip URLs with suspicious patterns (CDN redirects, trackers)
      if (url.includes("?") && !url.match(/\.(jpg|jpeg|png|webp|gif)\?/i)) {
        // URL has query params but no direct image extension before them - likely a redirect
        console.log(`[SerpAPI] Skipping redirect/query-only URL: ${url}`);
        continue;
      }

      console.log(`[SerpAPI] Valid candidate found: ${url}`);
      return url;
    }

    return null;
  }

  // CHANGE: Added retry logic with exponential backoff for transient SerpAPI errors
  private async requestSerpImageUrl(apiKey: string, query: string, timeoutMs?: number): Promise<string | null> {
    const MAX_RETRIES = 2;
    const timeout = timeoutMs || this.serpApiTimeoutMs;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[SerpAPI] Requesting SerpAPI with query: "${query}"${attempt > 1 ? ` (attempt ${attempt}/${MAX_RETRIES})` : ""}`);

        const response = await axios.get<SerpApiResponse>(this.serpApiBaseUrl, {
          params: {
            engine: "google_images",
            q: query,
            api_key: apiKey,
          },
          timeout: timeout,
        });

        const results = response.data.images_results ?? [];
        console.log(`[SerpAPI] Response received - ${results.length} images found`);

        const imageUrl = this.extractValidImage(results);
        if (imageUrl) {
          return imageUrl;
        }

        console.log(`[SerpAPI] No valid image URL found after filtering`);
        return null;

      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const statusText = error.response?.statusText;
          const errorData = error.response?.data;

          // Retry on transient server errors
          if ((status === 503 || status === 429) && attempt < MAX_RETRIES) {
            const backoffMs = 1000 * attempt;
            console.log(`[SerpAPI] Transient error (${status} ${statusText}), retrying in ${backoffMs}ms (attempt ${attempt}/${MAX_RETRIES})...`);
            await new Promise(res => setTimeout(res, backoffMs));
            continue;
          }

          console.error(
            `[SerpAPI] Request failed for query "${query}": status ${status} ${statusText}`,
            errorData ? JSON.stringify(errorData).substring(0, 200) : error.message
          );
        } else {
          console.error(
            `[SerpAPI] Request failed for query "${query}":`,
            error instanceof Error ? error.message : error
          );
        }
        throw error;
      }
    }

    throw new Error(`[SerpAPI] Max retries (${MAX_RETRIES}) exceeded for query "${query}"`);
  }

  private async getFirstImageUrl(name: string, brand: string): Promise<string> {
    console.log(`[SerpAPI] getFirstImageUrl called - name: "${name}", brand: "${brand}"`);
    const primaryQuery = this.buildQuery(name, brand);

    if (!primaryQuery) {
      console.error(`[SerpAPI] Empty primary query - name: "${name}", brand: "${brand}"`);
      throw new HttpError(BAD_REQUEST, "Product name and brand are required for official image lookup.");
    }

    const apiKey = this.getApiKey();

    // Build a list of progressively simpler queries to try
    const queries = [
      primaryQuery, // Full: "brand name product white background"
      this.sanitizeQuery(`${this.compactWords(brand)} ${this.compactWords(name)}`).trim(), // Just brand + name
      this.sanitizeQuery(`${this.compactWords(name)} product`).trim(), // Name + product
      this.sanitizeQuery(this.compactWords(name)).trim(), // Just product name
    ];

    for (const query of queries) {
      if (!query) {
        console.log(`[SerpAPI] Skipping empty query`);
        continue;
      }

      try {
        // Use progressively longer timeouts for fallback queries
        // Query 1: 12s, Query 2: 15s, Query 3+: 18s
        const timeoutMs = Math.min(12000 + (queries.indexOf(query) * 3000), 18000);
        const imageUrl = await this.requestSerpImageUrl(apiKey, query, timeoutMs);
        if (imageUrl) {
          console.log(`[SerpAPI] Image URL resolved successfully with query: "${query}"`);
          return imageUrl;
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          if (status === 500 || status === 429 || error.code === "ECONNABORTED") {
            // Server error, rate limit, or timeout - try next query
            console.log(`[SerpAPI] Server error (${status || error.code}), trying next query...`);
            continue;
          }
          if (!error.response) {
            // Network error, timeout, or ECONNABORTED - try next query
            console.log(`[SerpAPI] Network/timeout error, trying next query...`);
            continue;
          }
        }

        console.error(`[SerpAPI] Error in getFirstImageUrl:`, error instanceof Error ? error.message : error);
        throw error;
      }
    }

    console.error(`[SerpAPI] No image found after trying all query variations`);
    throw new HttpError(NOT_FOUND, "No official image found for this product after trying multiple search queries.");
  }

  // CHANGE: Main fix - handles CDN responses with generic binary/octet-stream content-type
  // Infers actual image type from URL extension and accepts the image instead of rejecting it
  async fetchOfficialImageAsset(params: { name: string; brand: string }): Promise<OfficialImageAsset> {
    console.log(`[SerpAPI] fetchOfficialImageAsset called - name: "${params.name}", brand: "${params.brand}"`);
    
    try {
      const sourceUrl = await this.getFirstImageUrl(params.name, params.brand);
      console.log(`[SerpAPI] Downloading image from: ${sourceUrl}`);

      let imageResponse;
      try {
        imageResponse = await axios.get<ArrayBuffer>(sourceUrl, {
          responseType: "arraybuffer",
          timeout: 20000,
          maxRedirects: 5,
          validateStatus: (status) => status >= 200 && status < 400,
        });
      } catch (axiosError) {
        if (axios.isAxiosError(axiosError)) {
          console.error(`[SerpAPI] Image download failed - status: ${axiosError.response?.status}, message: ${axiosError.message}`);
          throw new HttpError(INTERNAL_SERVER_ERROR, `Failed to download image from SerpAPI result: ${axiosError.message}`);
        }
        throw axiosError;
      }

      // FIX: Changed from 'const' to 'let' to allow reassignment when CDN returns generic binary type
      let contentType = String(imageResponse.headers["content-type"] || "image/jpeg").split(";")[0] || "image/jpeg";      
      
      // FIX: Handle CDN responses that return binary/octet-stream instead of proper image MIME type
      // This occurs when CDN serves images without proper content-type headers
      if (contentType === "binary/octet-stream" || contentType === "application/octet-stream") {
        console.log(`[SerpAPI] CDN returned generic binary type, inferring from URL...`);
        // Try to infer proper image type from URL file extension
        const urlPath = new URL(sourceUrl).pathname;
        if (urlPath.includes(".png")) {
          contentType = "image/png";
        } else if (urlPath.includes(".webp")) {
          contentType = "image/webp";
        } else if (urlPath.includes(".gif")) {
          contentType = "image/gif";
        } else {
          // Default to jpeg for unknown binary images (most common case)
          contentType = "image/jpeg";
        }
        console.log(`[SerpAPI] Inferred content type: ${contentType}`);
      }
      
      console.log(`[SerpAPI] Image downloaded successfully - contentType: ${contentType}, size: ${imageResponse.data.byteLength} bytes`);

      // Strict validation: reject any HTML, JSON, or text responses
      if (contentType.includes("text/") || contentType.includes("application/json")) {
        console.error(`[SerpAPI] Invalid content type detected: ${contentType} - likely a redirect or error page`);
        throw new HttpError(BAD_REQUEST, "SerpAPI result returned non-image content (likely redirect/error page).");
      }

      if (!contentType.startsWith("image/") && contentType !== "binary/octet-stream" && contentType !== "application/octet-stream") {
        console.error(`[SerpAPI] Invalid content type: ${contentType}`);
        throw new HttpError(BAD_REQUEST, "SerpAPI result did not return a valid image content type.");
      }

      return {
        sourceUrl,
        contentType,
        buffer: Buffer.from(imageResponse.data),
      };
    } catch (error) {
      console.error(`[SerpAPI] fetchOfficialImageAsset failed:`, error instanceof Error ? error.message : error);
      // Re-throw HttpErrors as-is, wrap others as 500
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(INTERNAL_SERVER_ERROR, `Image fetch failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export default new SerpApiImageService();
