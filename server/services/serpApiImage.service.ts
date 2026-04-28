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
  
  // FIX: Reduced from 12000 to 5000 to prevent server hang and 503 errors
  private readonly serpApiTimeoutMs = 5000;

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

  /**
   * FIX: Added containerType to the query builder to differentiate 
   * between bottles, tubs, jars, etc.
   */
private buildQuery(name: string, brand: string, containerType?: string): string {
  // 1. Get the SPF number specifically to keep it strict
  const spfMatch = name.match(/\d+/);
 const spfValue = spfMatch ? spfMatch[0] : "";

  // 2. Simplify the name: Too many words (like "High Waterproof") confuse the search
  // We just want the core product identity
  const coreName = name.split(" ").slice(0, 4).join(" "); 

  const primary = this.compactWords(`${brand} ${coreName}`);
  const typeSuffix = containerType ? ` ${containerType}` : "";
  
  // 3. NEGATIVE FILTERS: We exclude sites that typically have bad/busy photos
  // and force "high res" which usually triggers official white-background PR shots.
  const negativeFilters = "-site:incibeauty.com -site:openfoodfacts.org -site:skinsafe.com";
  
  const query = `${primary}${typeSuffix} ${spfValue} official product white background ${negativeFilters}`.trim();
  
  const finalQuery = query.replace(/\s+/g, " ");
  console.log(`[SerpAPI] Strict White-BG Query: "${finalQuery}"`);
  return finalQuery;
}

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

      // const resultsCount = response.data.images_results?.length ?? 0;
      const firstResult = response.data.images_results?.[0];
      const imageUrl = firstResult?.original ?? firstResult?.thumbnail ?? null;
      
      return imageUrl;
    } catch (error) {
      console.error(`[SerpAPI] Request failed for query "${query}":`, error instanceof Error ? error.message : error);
      throw error;
    }
  }

  private async getFirstImageUrl(name: string, brand: string, containerType?: string): Promise<string> {
    console.log(`[SerpAPI] getFirstImageUrl called - name: "${name}", brand: "${brand}"`);
    
    // Primary query now includes the container hint
    const primaryQuery = this.buildQuery(name, brand, containerType);
    const fallbackQuery = `${brand} ${this.compactWords(name)} white background`.trim();

    if (!primaryQuery) {
      throw new HttpError(BAD_REQUEST, "Product name and brand are required for official image lookup.");
    }

    const apiKey = this.getApiKey();

    for (const query of [primaryQuery, fallbackQuery]) {
      if (!query) continue;

      try {
        const imageUrl = await this.requestSerpImageUrl(apiKey, query);
        if (imageUrl) {
          return imageUrl;
        }
      } catch (error) {
        if (axios.isAxiosError(error) && (error.code === "ECONNABORTED" || !error.response)) {
          console.log(`[SerpAPI] Request timeout/aborted, trying fallback query`);
          continue;
        }
        throw error;
      }
    }

    throw new HttpError(NOT_FOUND, "No official image found for this product.");
  }

  /**
   * Main method to fetch and process the image asset.
   * FIX: Added containerType to parameters.
   */
  async fetchOfficialImageAsset(params: { 
    name: string; 
    brand: string; 
    containerType?: string 
  }): Promise<OfficialImageAsset> {
    console.log(`[SerpAPI] fetchOfficialImageAsset called - name: "${params.name}", container: "${params.containerType}"`);
    
    try {
      // Pass the container type (bottle/tub) into the search logic
      const sourceUrl = await this.getFirstImageUrl(params.name, params.brand, params.containerType);
      console.log(`[SerpAPI] Downloading image from: ${sourceUrl}`);

      const imageResponse = await axios.get<ArrayBuffer>(sourceUrl, {
        responseType: "arraybuffer",
        timeout: 15000, // Slightly lower than before to keep request cycles tight
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400,
      });

      let contentType = String(imageResponse.headers["content-type"] || "image/jpeg").split(";")[0] || "image/jpeg";      
      
      // Handle CDN responses that return binary/octet-stream
      if (contentType === "binary/octet-stream" || contentType === "application/octet-stream") {
        console.log(`[SerpAPI] CDN returned generic binary type, inferring from URL...`);
        const urlPath = new URL(sourceUrl).pathname;
        if (urlPath.includes(".png")) {
          contentType = "image/png";
        } else if (urlPath.includes(".webp")) {
          contentType = "image/webp";
        } else if (urlPath.includes(".gif")) {
          contentType = "image/gif";
        } else {
          contentType = "image/jpeg";
        }
      }
      
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