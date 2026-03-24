import api from "../../config/api";

export interface Profile {
	id: string;
	userId: string;
	first_name: string;
	last_name: string;
	age?: string;
	profile_image?: string;
	main_profile: boolean;
	isComplete: boolean;
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
	isComplete?: boolean;
	conditionIds?: string[];
	allergenIds?: string[];
	preferenceIds?: string[];
}

export const profileService = {
	getProfile: async (userId: string): Promise<Profile> => {
		const response = await api.get(`/profiles/user/${userId}`);
		return response.data;
	},

	createProfile: async (data: CreateProfileInput): Promise<Profile> => {
		const response = await api.post("/profiles", data);
		return response.data;
	},

	updateProfile: async (id: string, data: UpdateProfileInput): Promise<Profile> => {
		const response = await api.patch(`/profiles/${id}`, data);
		return response.data;
	},

	deleteProfile: async (id: string): Promise<void> => {
		await api.delete(`/profiles/${id}`);
	},

	getAllConditions: async (): Promise<Condition[]> => {
		const response = await api.get("/conditions");
		return response.data;
	},

	getAllAllergens: async (): Promise<Allergen[]> => {
		const response = await api.get("/allergens");
		return response.data;
	},

	getAllPreferences: async (): Promise<Preference[]> => {
		const response = await api.get("/preferences");
		return response.data;
	},
};

export default profileService;
