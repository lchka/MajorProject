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
    const query = `${primary} product white background`.trim();
    const finalQuery = query.replace(/\s+/g, " ");
    console.log(`[SerpAPI] Query built - name: "${name}", brand: "${brand}" → "${finalQuery}"`);
    return finalQuery;
  }

  // CHANGE: Added comprehensive logging for debugging SerpAPI requests and responses
  private async requestSerpImageUrl(apiKey: string, query: string): Promise<string | null> {
    try {
      console.log(`[SerpAPI] Requesting SerpAPI with query: "${query}"`);
      const response = await axios.get<SerpApiResponse>(this.serpApiBaseUrl, {
        params: {
          engine: "google_images",
          q: query,
          api_key: apiKey,
        },
        timeout: this.serpApiTimeoutMs,
      });

      const resultsCount = response.data.images_results?.length ?? 0;
      console.log(`[SerpAPI] Response received - ${resultsCount} images found`);

      const firstResult = response.data.images_results?.[0];
      const imageUrl = firstResult?.original ?? firstResult?.thumbnail ?? null;
      
      if (imageUrl) {
        console.log(`[SerpAPI] Image URL found: ${imageUrl}`);
      } else {
        console.log(`[SerpAPI] No image URL in first result`);
      }
      
      return imageUrl;
    } catch (error) {
      console.error(`[SerpAPI] Request failed for query "${query}":`, error instanceof Error ? error.message : error);
      throw error;
    }
  }

  private async getFirstImageUrl(name: string, brand: string): Promise<string> {
    console.log(`[SerpAPI] getFirstImageUrl called - name: "${name}", brand: "${brand}"`);
    const primaryQuery = this.buildQuery(name, brand);
    const fallbackQuery = `${this.compactWords(name)} product white background`.trim();

    if (!primaryQuery) {
      console.error(`[SerpAPI] Empty primary query - name: "${name}", brand: "${brand}"`);
      throw new HttpError(BAD_REQUEST, "Product name and brand are required for official image lookup.");
    }

    const apiKey = this.getApiKey();

    for (const query of [primaryQuery, fallbackQuery]) {
      if (!query) {
        console.log(`[SerpAPI] Skipping empty query`);
        continue;
      }

      try {
        const imageUrl = await this.requestSerpImageUrl(apiKey, query);
        if (imageUrl) {
          console.log(`[SerpAPI] Image URL resolved successfully`);
          return imageUrl;
        }
      } catch (error) {
        if (axios.isAxiosError(error) && (error.code === "ECONNABORTED" || !error.response)) {
          console.log(`[SerpAPI] Request timeout/aborted, trying fallback query`);
          continue;
        }

        console.error(`[SerpAPI] Error in getFirstImageUrl:`, error instanceof Error ? error.message : error);
        throw error;
      }
    }

    console.error(`[SerpAPI] No image found after trying primary and fallback queries`);
    throw new HttpError(NOT_FOUND, "No official image found for this product.");
  }

  // CHANGE: Main fix - handles CDN responses with generic binary/octet-stream content-type
  // Infers actual image type from URL extension and accepts the image instead of rejecting it
  async fetchOfficialImageAsset(params: { name: string; brand: string }): Promise<OfficialImageAsset> {
    console.log(`[SerpAPI] fetchOfficialImageAsset called - name: "${params.name}", brand: "${params.brand}"`);
    
    try {
      const sourceUrl = await this.getFirstImageUrl(params.name, params.brand);
      console.log(`[SerpAPI] Downloading image from: ${sourceUrl}`);

      const imageResponse = await axios.get<ArrayBuffer>(sourceUrl, {
        responseType: "arraybuffer",
        timeout: 20000,
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400,
      });

      // FIX: Changed from 'const' to 'let' to allow reassignment when CDN returns generic binary type
      let contentType = String(imageResponse.headers["content-type"] || "image/jpeg").split(";")[0] || "image/jpeg";      
      
      // FIX: Handle CDN responses that return binary/octet-stream instead of proper image MIME type
      // This occurs when CDN (e.g., DigitalOcean Spaces) serves images without proper content-type headers
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

      if (!contentType.startsWith("image/")) {
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
      throw error;
    }
  }
}

export default new SerpApiImageService();
