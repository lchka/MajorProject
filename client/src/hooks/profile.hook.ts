import { useCallback, useState } from "react";
import {profileService,
	Allergen,
	Condition,
	CreateProfileInput,
	Preference,
	Profile,
	UpdateProfileInput,
} from "../services/profileService";
// Custom React hook for managing user profile data, including fetching, creating, updating, and deleting profiles, as well as handling related conditions, allergens, and preferences. The hook provides a structured way to manage profile-related state and operations, including loading and error states. It also includes utility functions for clearing errors and wrapping asynchronous operations with loading state management. This hook can be used across different components in the application to maintain a consistent approach to profile management and ensure that all profile-related logic is centralized in one place.
interface UseProfileReturn {
	profile: Profile | null;
	conditions: Condition[];
	allergens: Allergen[];
	preferences: Preference[];
	loading: boolean;
	error: string | null;
	clearError: () => void;
	setProfile: (profile: Profile | null) => void;
	fetchProfile: (userId: string) => Promise<Profile | null>;
	createProfile: (data: CreateProfileInput) => Promise<Profile | null>;
	updateProfile: (id: string, data: UpdateProfileInput) => Promise<Profile | null>;
	deleteProfile: (id: string) => Promise<boolean>;
	fetchConditions: () => Promise<Condition[]>;
	fetchAllergens: () => Promise<Allergen[]>;
	fetchPreferences: () => Promise<Preference[]>;
	fetchProfileOptions: () =>
		Promise<{ conditions: Condition[]; allergens: Allergen[]; preferences: Preference[] }>;
}

export const useProfile = (): UseProfileReturn => {
	const [profile, setProfile] = useState<Profile | null>(null);
	const [conditions, setConditions] = useState<Condition[]>([]);
	const [allergens, setAllergens] = useState<Allergen[]>([]);
	const [preferences, setPreferences] = useState<Preference[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const withLoading = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
		setLoading(true);
		setError(null);

		try {
			return await fn();
		} catch (err: unknown) {
			let message = "Something went wrong";

			if (typeof err === "object" && err !== null && "response" in err) {
				const maybeAxiosError = err as {
					response?: {
						data?: { message?: string };
						status?: number;
					};
					message?: string;
				};

				if (maybeAxiosError.response?.data?.message) {
					message = maybeAxiosError.response.data.message;
				} else if (typeof maybeAxiosError.message === "string") {
					message = maybeAxiosError.message;
				}
			} else if (err instanceof Error) {
				message = err.message;
			}

			setError(message);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);
// The fetchProfile function retrieves the profile data for a given user ID. It uses the withLoading utility to manage the loading state and error handling. If the profile is successfully fetched, it updates the profile state and returns the profile data. If there is an error during the fetch operation, it returns null. Similar patterns are followed for creating, updating, and deleting profiles, as well as fetching conditions, allergens, and preferences.
	const fetchProfile = useCallback(
		async (userId: string): Promise<Profile | null> => {
			try {
				const response = await withLoading(() => profileService.getProfile(userId));
				setProfile(response);
				return response;
			} catch {
				return null;
			}
		},
		[withLoading],
	);
// The createProfile function creates a new profile using the provided data. It also uses the withLoading utility for managing loading and error states. Upon successful creation, it updates the profile state with the new profile data and returns it. If there is an error during the creation process, it returns null. The updateProfile and deleteProfile functions follow a similar structure, handling their respective operations while managing state and errors effectively.
	const createProfile = useCallback(
		async (data: CreateProfileInput): Promise<Profile | null> => {
			try {
				const response = await withLoading(() => profileService.createProfile(data));
				setProfile(response);
				return response;
			} catch {
				return null;
			}
		},
		[withLoading],
	);
//	 The updateProfile function updates an existing profile identified by its ID with the provided data. It manages loading and error states using the withLoading utility. If the update is successful, it updates the profile state with the new profile data and returns it. If there is an error during the update process, it returns null. The deleteProfile function similarly handles the deletion of a profile, returning true if successful and false if there is an error.
	const updateProfile = useCallback(
		async (id: string, data: UpdateProfileInput): Promise<Profile | null> => {
			try {
				const response = await withLoading(() => profileService.updateProfile(id, data));
				setProfile(response);
				return response;
			} catch {
				return null;
			}
		},
		[withLoading],
	);
// The deleteProfile function deletes a profile based on its ID. It uses the withLoading utility to manage loading and error states. If the deletion is successful, it clears the profile state and returns true. If there is an error during the deletion process, it returns false. This function allows components using the hook to easily handle profile deletions while ensuring that the UI reflects the current state of the profile data.
	const deleteProfile = useCallback(
		async (id: string): Promise<boolean> => {
			try {
				await withLoading(() => profileService.deleteProfile(id));
				setProfile(null);
				return true;
			} catch {
				return false;
			}
		},
		[withLoading],
	);
// The fetchConditions, fetchAllergens, and fetchPreferences functions retrieve the respective lists of conditions, allergens, and preferences. Each function uses the withLoading utility for managing loading and error states. Upon successful retrieval, they update their respective state variables and return the data. If there is an error during any of these fetch operations, they return an empty array. The fetchProfileOptions function combines these three fetch operations into a single function that retrieves all profile-related options at once, handling errors gracefully and updating state accordingly.
	const fetchConditions = useCallback(async (): Promise<Condition[]> => {
		try {
			const response = await withLoading(() => profileService.getAllConditions());
			setConditions(response);
			return response;
		} catch {
			return [];
		}
	}, [withLoading]);
// The fetchProfileOptions function combines the fetching of conditions, allergens, and preferences into a single operation. It uses Promise.allSettled to handle all three fetch operations concurrently, allowing it to manage partial failures gracefully. If all three operations fail, it sets a general error message. Otherwise, it updates the state with whatever data was successfully retrieved and returns an object containing the conditions, allergens, and preferences.
	const fetchAllergens = useCallback(async (): Promise<Allergen[]> => {
		try {
			const response = await withLoading(() => profileService.getAllAllergens());
			setAllergens(response);
			return response;
		} catch {
			return [];
		}
	}, [withLoading]);
// The fetchAllergens function retrieves the list of allergens using the withLoading utility for managing loading and error states. If the fetch is successful, it updates the allergens state and returns the data. If there is an error during the fetch operation, it returns an empty array. This function allows components using the hook to easily access allergen data while ensuring that the UI reflects the current state of the data retrieval process.
	const fetchPreferences = useCallback(async (): Promise<Preference[]> => {
		try {
			const response = await withLoading(() => profileService.getAllPreferences());
			setPreferences(response);
			return response;
		} catch {
			return [];
		}
	}, [withLoading]);
// The fetchPreferences function retrieves the list of preferences using the withLoading utility for managing loading and error states. If the fetch is successful, it updates the preferences state and returns the data. If there is an error during the fetch operation, it returns an empty array. This function allows components using the hook to easily access preference data while ensuring that the UI reflects the current state of the data retrieval process.
	const fetchProfileOptions = useCallback(async () => {
		try {
			const [conditionsResult, allergensResult, preferencesResult] = await withLoading(() =>
				Promise.allSettled([
					profileService.getAllConditions(),
					profileService.getAllAllergens(),
					profileService.getAllPreferences(),
				]),
			);

			const conditionsResponse =
				conditionsResult.status === "fulfilled" ? conditionsResult.value : [];
			const allergensResponse =
				allergensResult.status === "fulfilled" ? allergensResult.value : [];
			const preferencesResponse =
				preferencesResult.status === "fulfilled" ? preferencesResult.value : [];

			if (
				conditionsResult.status === "rejected" &&
				allergensResult.status === "rejected" &&
				preferencesResult.status === "rejected"
			) {
				setError("Could not load profile options.");
			}

			setConditions(conditionsResponse);
			setAllergens(allergensResponse);
			setPreferences(preferencesResponse);

			return {
				conditions: conditionsResponse,
				allergens: allergensResponse,
				preferences: preferencesResponse,
			};
		} catch {
			return { conditions: [], allergens: [], preferences: [] };
		}
	}, [withLoading]);

	return {
		profile,
		conditions,
		allergens,
		preferences,
		loading,
		error,
		clearError,
		setProfile,
		fetchProfile,
		createProfile,
		updateProfile,
		deleteProfile,
		fetchConditions,
		fetchAllergens,
		fetchPreferences,
		fetchProfileOptions,
	};
};

export default useProfile;
