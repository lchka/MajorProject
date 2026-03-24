import { useCallback, useState } from "react";
import profileService, {
	Allergen,
	Condition,
	CreateProfileInput,
	Preference,
	Profile,
	UpdateProfileInput,
} from "../services/profileService";

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

	const fetchConditions = useCallback(async (): Promise<Condition[]> => {
		try {
			const response = await withLoading(() => profileService.getAllConditions());
			setConditions(response);
			return response;
		} catch {
			return [];
		}
	}, [withLoading]);

	const fetchAllergens = useCallback(async (): Promise<Allergen[]> => {
		try {
			const response = await withLoading(() => profileService.getAllAllergens());
			setAllergens(response);
			return response;
		} catch {
			return [];
		}
	}, [withLoading]);

	const fetchPreferences = useCallback(async (): Promise<Preference[]> => {
		try {
			const response = await withLoading(() => profileService.getAllPreferences());
			setPreferences(response);
			return response;
		} catch {
			return [];
		}
	}, [withLoading]);

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
