import { profileService, Allergen, Profile } from './profileService';

/**
 * Allergen Service - Handles all allergen-related operations
 */
export const allergenService = {
  /**
   * Get all available allergens
   */
  getAllAllergens: async (): Promise<Allergen[]> => {
    return profileService.getAllAllergens();
  },

  /**
   * Remove an allergen from a profile
   * Filters out the allergen ID and deduplicates remaining IDs
   */
  removeAllergen: async (
    profileId: string,
    allergenId: string,
    currentAllergens?: Allergen[],
  ): Promise<Profile> => {
    // Filter out the allergen and deduplicate IDs
    const nextAllergenIds =
      currentAllergens
        ?.filter((item) => item.id !== allergenId)
        .map((item) => item.id) ?? [];
    const dedupedAllergenIds = Array.from(new Set(nextAllergenIds));

    // Update profile with new allergen list
    return profileService.updateProfile(profileId, {
      allergenIds: dedupedAllergenIds,
    });
  },

  /**
   * Save allergens to a profile
   * Takes an array of allergen IDs and deduplicates them before saving
   */
  saveAllergens: async (
    profileId: string,
    allergenIds: string[],
  ): Promise<Profile> => {
    // Deduplicate allergen IDs before saving
    const dedupedAllergenIds = Array.from(new Set(allergenIds));

    // Update profile with new allergen list
    return profileService.updateProfile(profileId, {
      allergenIds: dedupedAllergenIds,
    });
  },
};

export default allergenService;
