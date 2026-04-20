import { profileService, Preference, Profile } from './profileService';

/**
 * Preference Service - Handles all preference-related operations
 */
export const preferenceService = {
  /**
   * Get all available preferences
   */
  getAllPreferences: async (): Promise<Preference[]> => {
    return profileService.getAllPreferences();
  },

  /**
   * Remove a preference from a profile
   * Filters out the preference ID and deduplicates remaining IDs
   */
  removePreference: async (
    profileId: string,
    preferenceId: string,
    currentPreferences?: Preference[],
  ): Promise<Profile> => {
    // Filter out the preference and deduplicate IDs
    const nextPreferenceIds =
      currentPreferences
        ?.filter((item) => item.id !== preferenceId)
        .map((item) => item.id) ?? [];
    const dedupedPreferenceIds = Array.from(new Set(nextPreferenceIds));

    // Update profile with new preference list
    return profileService.updateProfile(profileId, {
      preferenceIds: dedupedPreferenceIds,
    });
  },

  /**
   * Save preferences to a profile
   * Takes an array of preference IDs and deduplicates them before saving
   */
  savePreferences: async (
    profileId: string,
    preferenceIds: string[],
  ): Promise<Profile> => {
    // Deduplicate preference IDs before saving
    const dedupedPreferenceIds = Array.from(new Set(preferenceIds));

    // Update profile with new preference list
    return profileService.updateProfile(profileId, {
      preferenceIds: dedupedPreferenceIds,
    });
  },
};

export default preferenceService;
