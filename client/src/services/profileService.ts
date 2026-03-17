import api from '../config/api';

export interface Profile {
  id: string;
  userId: string;
  first_name: string;
  last_name: string;
  age?: string;
  profile_image?: string;
  main_profile: boolean;
  conditions?: Condition[];
  allergens?: Allergen[];
  preferences?: Preference[];
  createdAt: string;
  updatedAt: string;
}

export interface Condition {
  id: string;
  name: string;
  description: string;
}

export interface Allergen {
  id: string;
  name: string;
  description: string;
}

export interface Preference {
  id: string;
  name: string;
  description: string;
}

export interface CreateProfileInput {
  first_name: string;
  last_name: string;
  age?: string;
  profile_image?: string;
  main_profile?: boolean;
  conditionIds?: string[];
  allergenIds?: string[];
  preferenceIds?: string[];
}

export interface UpdateProfileInput {
  first_name?: string;
  last_name?: string;
  age?: string;
  profile_image?: string;
  main_profile?: boolean;
  conditionIds?: string[];
  allergenIds?: string[];
  preferenceIds?: string[];
}

/**
 * Profile Service - Handles all profile-related API calls
 */
export const profileService = {
  /**
   * Get user's profile
   */
  getProfile: async (userId: string): Promise<Profile> => {
    const response = await api.get(`/profiles/user/${userId}`);
    return response.data;
  },

  /**
   * Create profile
   */
  createProfile: async (data: CreateProfileInput): Promise<Profile> => {
    const response = await api.post('/profiles', data);
    return response.data;
  },

  /**
   * Update profile
   */
  updateProfile: async (id: string, data: UpdateProfileInput): Promise<Profile> => {
    const response = await api.put(`/profiles/${id}`, data);
    return response.data;
  },

  /**
   * Delete profile
   */
  deleteProfile: async (id: string): Promise<void> => {
    await api.delete(`/profiles/${id}`);
  },

  /**
   * Get all conditions
   */
  getAllConditions: async (): Promise<Condition[]> => {
    const response = await api.get('/conditions');
    return response.data;
  },

  /**
   * Get all allergens
   */
  getAllAllergens: async (): Promise<Allergen[]> => {
    const response = await api.get('/allergens');
    return response.data;
  },

  /**
   * Get all preferences
   */
  getAllPreferences: async (): Promise<Preference[]> => {
    const response = await api.get('/preferences');
    return response.data;
  },
};

export default profileService;
