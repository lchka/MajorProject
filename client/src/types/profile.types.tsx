
export interface ProfileBase {
    first_name: string;
    last_name: string;
    age?: string;
    profile_image?: string;
    conditionIds?: string[];
    allergenIds?: string[];
    preferenceIds?: string[];
}

export interface Profile extends ProfileBase {
    id: string;
    main_profile: boolean;
    isComplete: boolean;
}