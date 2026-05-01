import api from '../config/api';

export interface ProfileImageUploadFile {
  uri: string;
  name?: string;
  type?: string;
}
// The profileService module provides functions for managing user profiles, including fetching profiles, creating and updating profiles, deleting profiles, and retrieving related data such as conditions, allergens, and preferences. It also includes a subscription mechanism to listen for profile changes and a banner system to display messages related to profile operations. Each function interacts with the backend API to perform the necessary operations and returns the relevant data or handles errors as needed.
export interface Profile {
  id: string;
  userId: string;
  first_name: string;
  last_name: string;
  isComplete?: boolean;
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
  last_name?: string;
  age?: string;
  profile_image?: string | ProfileImageUploadFile;
  main_profile?: boolean;
  conditionIds?: string[];
  allergenIds?: string[];
  preferenceIds?: string[];
}

export interface UpdateProfileInput {
  first_name?: string;
  last_name?: string;
  age?: string;
  profile_image?: string | ProfileImageUploadFile;
  main_profile?: boolean;
  isComplete?: boolean;
  conditionIds?: string[];
  allergenIds?: string[];
  preferenceIds?: string[];
}

type ProfileChangeListener = () => void;
type PendingProfileBanner = {
  type: "success" | "error" | "info" | "warning";
  message: string;
};

const profileChangeListeners = new Set<ProfileChangeListener>();
let pendingProfileBanner: PendingProfileBanner | null = null;

const emitProfileChanged = () => {
  profileChangeListeners.forEach((listener) => {
    listener();
  });
};

export const subscribeProfileChanges = (
  listener: ProfileChangeListener,
): (() => void) => {
  profileChangeListeners.add(listener);
  return () => {
    profileChangeListeners.delete(listener);
  };
};

export const setPendingProfileBanner = (banner: PendingProfileBanner): void => {
  pendingProfileBanner = banner;
};

export const consumePendingProfileBanner = (): PendingProfileBanner | null => {
  const nextBanner = pendingProfileBanner;
  pendingProfileBanner = null;
  return nextBanner;
};

const isProfileImageUploadFile = (
  value: UpdateProfileInput['profile_image'] | CreateProfileInput['profile_image'],
): value is ProfileImageUploadFile => {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'uri' in value &&
      typeof (value as { uri?: unknown }).uri === 'string',
  );
};

const toProfileFormData = (data: CreateProfileInput | UpdateProfileInput): FormData => {
  const formData = new FormData();

  if (data.first_name !== undefined) {
    formData.append('first_name', data.first_name);
  }
  if (data.last_name !== undefined) {
    formData.append('last_name', data.last_name);
  }
  if (data.age !== undefined) {
    formData.append('age', data.age);
  }

  const profileImage = data.profile_image;
  if (typeof profileImage === 'string' && profileImage.trim().length > 0) {
    formData.append('profile_image', profileImage);
  } else if (isProfileImageUploadFile(profileImage)) {
    formData.append('profile_image', {
      uri: profileImage.uri,
      name: profileImage.name ?? `profile-${Date.now()}.jpg`,
      type: profileImage.type ?? 'image/jpeg',
    } as unknown as { uri: string; name: string; type: string });
  }

  data.conditionIds?.forEach((id) => formData.append('conditionIds[]', id));
  data.allergenIds?.forEach((id) => formData.append('allergenIds[]', id));
  data.preferenceIds?.forEach((id) => formData.append('preferenceIds[]', id));

  return formData;
};

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
   * Get current authenticated user's profiles
   */
  getMyProfile: async (): Promise<Profile[]> => {
    const response = await api.get('/profiles/me');
    return response.data;
  },

  /**
   * Get profile by profile id
   */
  getProfileById: async (id: string): Promise<Profile> => {
    const response = await api.get(`/profiles/${id}`);
    return response.data;
  },

  /**
   * Create profile
   */
  createProfile: async (data: CreateProfileInput): Promise<Profile> => {
    const hasFile = isProfileImageUploadFile(data.profile_image);
    const response = hasFile
      ? await api.post('/profiles', toProfileFormData(data), {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      : await api.post('/profiles', data);
    emitProfileChanged();
    return response.data;
  },

  /**
   * Update profile
   */
  updateProfile: async (id: string, data: UpdateProfileInput): Promise<Profile> => {
    const hasFile = isProfileImageUploadFile(data.profile_image);
    const response = hasFile
      ? await api.patch(`/profiles/${id}`, toProfileFormData(data), {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      : await api.patch(`/profiles/${id}`, data);
    emitProfileChanged();
    return response.data;
  },

  /**
   * Delete profile
   */
  deleteProfile: async (id: string): Promise<void> => {
    await api.delete(`/profiles/${id}`);
    emitProfileChanged();
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
