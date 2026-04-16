import api from "../config/api";

export type EvaluationStatus = "safe" | "caution" | "avoid";

export interface DangerousIngredient {
  ingredient: string;
  danger_level: number;
  reason?: string;
}

export interface CitationSource {
  title: string;
  lead_author: string;
  year: number | null;
  url: string;
}

export interface EvaluationResultJson {
  status?: EvaluationStatus;
  score?: number;
  summary?: string;
  reasons?: string[];
  matched_allergens?: string[];
  matched_conditions?: string[];
  matched_preferences?: string[];
  profile_allergens?: string[];
  profile_conditions?: string[];
  profile_preferences?: string[];
  all_ingredients?: string[];
  dangerous_ingredients?: DangerousIngredient[];
  citations?: string[];
  citation_links?: string[];
  citation_sources?: CitationSource[];
  [key: string]: unknown;
}

export interface EvaluationContext {
  id: string;
  profileId: string;
  productId: string;
  promptId?: string | null;
  resultJson: EvaluationResultJson;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluateProductInput {
  productId: string;
  profileId: string;
  promptId?: string;
}

export interface PersistEvaluationInput {
  evaluationContextId?: string;
  productId: string;
  profileId: string;
  promptId?: string;
  resultJson: EvaluationResultJson;
}

export const evaluationContextService = {
  getMyContexts: async (): Promise<EvaluationContext[]> => {
    const response = await api.get(`/evaluation-contexts/me`);
    return response.data;
  },
  getByProfileId: async (profileId: string): Promise<EvaluationContext[]> => {
    const response = await api.get(`/evaluation-contexts/profile/${profileId}`);
    return response.data;
  },
  evaluateProduct: async (data: EvaluateProductInput): Promise<EvaluationContext> => {
    const response = await api.post(`/evaluation-contexts/evaluate`, data);
    return response.data;
  },
  sendToServer: async (data: PersistEvaluationInput): Promise<EvaluationContext> => {
    const response = await api.post(`/evaluations`, data);
    return response.data;
  },
  getById: async (id: string): Promise<EvaluationContext> => {
    const response = await api.get(`/evaluation-contexts/${id}`);
    return response.data;
  },
  deleteById: async (id: string): Promise<void> => {
    await api.delete(`/evaluation-contexts/${id}`);
  },
};

export default evaluationContextService;
