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
  private readonly serpApiTimeoutMs = 8000;

  private readonly forbiddenPatterns = [
    "facebook.com", "fbcdn.net", "lookaside.fbsbx.com", 
    "instagram.com", "pinterest.com", "tiktok.com"
  ];

  private compactWords(value: string): string {
    return Array.from(new Set(value.split(/\s+/).map(item => item.trim().toLowerCase()).filter(item => item.length > 0))).join(" ");
  }

  private getApiKey(): string {
    const apiKey = process.env.SERPAPI_API_KEY?.trim();
    if (!apiKey) throw new HttpError(INTERNAL_SERVER_ERROR, "SERPAPI_API_KEY missing.");
    return apiKey;
  }

  private buildQuery(name: string, brand: string, containerType?: string): string {
    const primary = this.compactWords(`${brand} ${name}`);
    const typeSuffix = containerType ? ` ${containerType}` : "";
    const exclusions = this.forbiddenPatterns.map(p => `-site:${p}`).join(" ");
    return `${primary}${typeSuffix} official product shot white background ${exclusions}`.replace(/\s+/g, " ").trim();
  }

  private isValidImageUrl(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    return !this.forbiddenPatterns.some(pattern => lowerUrl.includes(pattern));
  }

  private async requestSerpImageUrl(apiKey: string, query: string): Promise<string | null> {
    try {
      const response = await axios.get<SerpApiResponse>(this.serpApiBaseUrl, {
        params: { engine: "google_images", q: query, api_key: apiKey },
        timeout: this.serpApiTimeoutMs,
      });

      const results = response.data.images_results || [];
      for (const result of results) {
        const candidateUrl = result.original || result.thumbnail;
        if (candidateUrl && this.isValidImageUrl(candidateUrl)) return candidateUrl;
      }
      return null;
    } catch {
      // Logic: Removed (error) to satisfy the "defined but not used" linter
      return null;
    }
  }

  private async getFirstImageUrl(name: string, brand: string, containerType?: string): Promise<string> {
    const apiKey = this.getApiKey();
    const primaryQuery = this.buildQuery(name, brand, containerType);
    const cleanName = name.replace(/leave-on|strengthening|pro-v/gi, "").trim();
    const secondaryQuery = `${brand} ${cleanName} official product white background`.replace(/\s+/g, " ");
    const minimalQuery = `${brand} ${name.split(' ').slice(0, 3).join(' ')} product`.trim();

    const queries = [primaryQuery, secondaryQuery, minimalQuery];

    for (const query of queries) {
      try {
        const imageUrl = await this.requestSerpImageUrl(apiKey, query);
        if (imageUrl) return imageUrl;
      } catch {
        // Logic: Clean catch block without unused variables
        console.warn(`[SerpAPI] Query failed, trying next fallback...`);
        continue; 
      }
    }

    throw new HttpError(NOT_FOUND, "No valid official image found.");
  }

  async fetchOfficialImageAsset(params: { name: string; brand: string; containerType?: string }): Promise<OfficialImageAsset> {
    try {
      const sourceUrl = await this.getFirstImageUrl(params.name, params.brand, params.containerType);
      
      const imageResponse = await axios.get<ArrayBuffer>(sourceUrl, {
        responseType: "arraybuffer",
        timeout: 10000, 
        maxRedirects: 5,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });

      const contentType = String(imageResponse.headers["content-type"] || "image/jpeg").split(";")[0];
      if (!contentType.startsWith("image/")) throw new Error("Invalid content type");

      return { sourceUrl, contentType, buffer: Buffer.from(imageResponse.data) };
    } catch (e) {
      // Logic: Using the 'e' variable here prevents the unused variable error
      const message = e instanceof Error ? e.message : "Internal Error";
      console.error(`[SerpAPI] Final failure: ${message}`);
      throw new HttpError(BAD_REQUEST, `SerpAPI fetch failed: ${message}`);
    }
  }
}

export default new SerpApiImageService();