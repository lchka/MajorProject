import api from "../config/api";

export interface EvaluationContext {
  id: string;
  profileId: string;
  productId: string;
  promptId?: string | null;
  resultJson: unknown;
  createdAt: string;
  updatedAt: string;
}

export const evaluationContextService = {
  getByProfileId: async (profileId: string): Promise<EvaluationContext[]> => {
    const response = await api.get(`/evaluation-contexts/profile/${profileId}`);
    return response.data;
  },
};

export default evaluationContextService;
