import { profileService, Condition, Profile } from './profileService';

/**
 * Condition Service - Handles all condition-related operations
 */
export const conditionService = {
  /**
   * Get all available conditions
   */
  getAllConditions: async (): Promise<Condition[]> => {
    return profileService.getAllConditions();
  },

  /**
   * Remove a condition from a profile
   * Filters out the condition ID and deduplicates remaining IDs
   */
  removeCondition: async (
    profileId: string,
    conditionId: string,
    currentConditions?: Condition[],
  ): Promise<Profile> => {
    // Filter out the condition and deduplicate IDs
    const nextConditionIds =
      currentConditions
        ?.filter((item) => item.id !== conditionId)
        .map((item) => item.id) ?? [];
    const dedupedConditionIds = Array.from(new Set(nextConditionIds));

    // Update profile with new condition list
    return profileService.updateProfile(profileId, {
      conditionIds: dedupedConditionIds,
    });
  },

  /**
   * Save conditions to a profile
   * Takes an array of condition IDs and deduplicates them before saving
   */
  saveConditions: async (
    profileId: string,
    conditionIds: string[],
  ): Promise<Profile> => {
    // Deduplicate condition IDs before saving
    const dedupedConditionIds = Array.from(new Set(conditionIds));

    // Update profile with new condition list
    return profileService.updateProfile(profileId, {
      conditionIds: dedupedConditionIds,
    });
  },
};

export default conditionService;
