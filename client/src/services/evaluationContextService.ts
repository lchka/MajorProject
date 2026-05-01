import api from "../config/api";
import {
  EvaluationContextSchema,
  EvaluateProductInputSchema,
  PersistEvaluationInputSchema,
  type EvaluationContext,
  type EvaluateProductInput,
  type PersistEvaluationInput,
} from "../types/evaluationContext.type";
// The evaluationContextService module provides functions for managing evaluation contexts, which are used to evaluate products based on user profiles and preferences. It includes methods for fetching the user's evaluation contexts, evaluating a product, sending evaluation data to the server, retrieving a specific evaluation context by ID, deleting an evaluation context, and re-evaluating an existing context. Each function interacts with the backend API and uses Zod schemas to validate and parse the data returned from the server, ensuring that the application works with well-defined data structures.
const EvaluationContextListSchema = EvaluationContextSchema.array();

export const evaluationContextService = {
  getMyContexts: async (): Promise<EvaluationContext[]> => {
    const response = await api.get(`/evaluation-contexts/me`);
    return EvaluationContextListSchema.parse(response.data);
  },
  getByProfileId: async (profileId: string): Promise<EvaluationContext[]> => {
    const response = await api.get(`/evaluation-contexts/profile/${profileId}`);
    return EvaluationContextListSchema.parse(response.data);
  },
  evaluateProduct: async (data: EvaluateProductInput): Promise<EvaluationContext> => {
    const payload = EvaluateProductInputSchema.parse(data);
    const response = await api.post(`/evaluation-contexts/evaluate`, payload);
    return EvaluationContextSchema.parse(response.data);
  },
  sendToServer: async (data: PersistEvaluationInput): Promise<EvaluationContext> => {
    const payload = PersistEvaluationInputSchema.parse(data);
    const response = await api.post(`/evaluations`, payload);
    return EvaluationContextSchema.parse(response.data);
  },
  getById: async (id: string): Promise<EvaluationContext> => {
    const response = await api.get(`/evaluation-contexts/${id}`);
    return EvaluationContextSchema.parse(response.data);
  },
  deleteById: async (id: string): Promise<void> => {
    await api.delete(`/evaluation-contexts/${id}`);
  },
  reevaluate: async (id: string): Promise<EvaluationContext> => {
    const response = await api.post(`/evaluation-contexts/${id}/reevaluate`);
    return EvaluationContextSchema.parse(response.data);
  },
};

export default evaluationContextService;
