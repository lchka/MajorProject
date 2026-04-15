/**
 * Central export point for all API services
 */
export { authService } from './authService';
export { userService } from './userService';
export { profileService } from './profileService';
export { evaluationContextService } from './evaluationContextService';
export { productService } from './productService';

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
} from './evaluationContextService';
export type { Product, ProductImageUploadFile } from './productService';
