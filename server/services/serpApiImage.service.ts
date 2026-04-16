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
    const primary = this.compactWords(`${brand} ${name}`);
    const query = `${primary} product white background`.trim();
    return query.replace(/\s+/g, " ");
  }

  private async requestSerpImageUrl(apiKey: string, query: string): Promise<string | null> {
    const response = await axios.get<SerpApiResponse>(this.serpApiBaseUrl, {
      params: {
        engine: "google_images",
        q: query,
        api_key: apiKey,
      },
      timeout: this.serpApiTimeoutMs,
    });

    const firstResult = response.data.images_results?.[0];
    return firstResult?.original ?? firstResult?.thumbnail ?? null;
  }

  private async getFirstImageUrl(name: string, brand: string): Promise<string> {
    const primaryQuery = this.buildQuery(name, brand);
    const fallbackQuery = `${this.compactWords(name)} product white background`.trim();

    if (!primaryQuery) {
      throw new HttpError(BAD_REQUEST, "Product name and brand are required for official image lookup.");
    }

    const apiKey = this.getApiKey();

    for (const query of [primaryQuery, fallbackQuery]) {
      if (!query) {
        continue;
      }

      try {
        const imageUrl = await this.requestSerpImageUrl(apiKey, query);
        if (imageUrl) {
          return imageUrl;
        }
      } catch (error) {
        if (axios.isAxiosError(error) && (error.code === "ECONNABORTED" || !error.response)) {
          continue;
        }

        throw error;
      }
    }

    throw new HttpError(NOT_FOUND, "No official image found for this product.");
  }

  async fetchOfficialImageAsset(params: { name: string; brand: string }): Promise<OfficialImageAsset> {
    const sourceUrl = await this.getFirstImageUrl(params.name, params.brand);

    const imageResponse = await axios.get<ArrayBuffer>(sourceUrl, {
      responseType: "arraybuffer",
      timeout: 20000,
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    const contentType = String(imageResponse.headers["content-type"] || "image/jpeg").split(";")[0] || "image/jpeg";

    if (!contentType.startsWith("image/")) {
      throw new HttpError(BAD_REQUEST, "SerpAPI result did not return a valid image content type.");
    }

    return {
      sourceUrl,
      contentType,
      buffer: Buffer.from(imageResponse.data),
    };
  }
}

export default new SerpApiImageService();
