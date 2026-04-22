/**
 * Central export point for all API services
 */
export { authService } from './authService';
export { userService } from './userService';
export { profileService } from './profileService';
export { evaluationContextService } from './evaluationContextService';
export { productService } from './productService';
export { weatherService } from './weatherService';
export {
  getLocalEvaluations,
  setLocalEvaluations,
  saveEvaluation,
  removeLocalEvaluationById,
} from './localEvaluationStorage';

// Re-export types
export type { RegisterInput, LoginInput, GoogleAuthInput, AuthResponse } from './authService';
export type { User } from './userService';
export type {
  Profile,
  Condition,
  Allergen,
  Preference,
  CreateProfileInput,
  UpdateProfileInput,
} from './profileService';
export type {
  EvaluationContext,
  EvaluationResultJson,
  EvaluateProductInput,
  PersistEvaluationInput,
  EvaluationStatus,
  DangerousIngredient,
  CitationSource,
} from '../types/evaluationContext.type';
export type { Product, ProductImageUploadFile } from './productService';
export type { CurrentUvSnapshot } from './weatherService';
export type { LocalEvaluation } from './localEvaluationStorage';
