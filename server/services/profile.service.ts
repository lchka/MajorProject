import prisma from "../lib/prisma";
import { BAD_REQUEST, HttpError, NOT_FOUND } from "../utils/HttpError";

import { CreateProfileDTO, ProfileResponseDTO, UpdateProfileDTO } from "../types/profile.dto";

// relation fields we always load with a profile
const profileInclude = {
    conditions: {
        select: { id: true, name: true, description: true }
    },
    allergens: {
        select: { id: true, name: true, description: true }
    },
    preferences: {
        select: { id: true, name: true, description: true }
    }
};

export class ProfileService{

private async assertExistingIds(
    model: "condition" | "allergen" | "preference",
    ids: string[] | undefined,
    label: string,
): Promise<void> {
    if (!ids?.length) {
        return;
    }

    const uniqueIds = [...new Set(ids)];

    const records =
        model === "condition"
            ? await prisma.condition.findMany({ where: { id: { in: uniqueIds } }, select: { id: true } })
            : model === "allergen"
                ? await prisma.allergen.findMany({ where: { id: { in: uniqueIds } }, select: { id: true } })
                : await prisma.preference.findMany({ where: { id: { in: uniqueIds } }, select: { id: true } });

    const foundIds = new Set(records.map((record) => record.id));
    const missingIds = uniqueIds.filter((id) => !foundIds.has(id));

    if (missingIds.length) {
        throw new HttpError(
            BAD_REQUEST,
            `${label} not found: ${missingIds.join(", ")}`,
        );
    }
}

// shape prisma output into our response dto
private toProfileResponse(profile: {
    id: string;
    userId: string;
    first_name: string;
    last_name: string;
    age: string | null;
    profile_image: string | null;
    main_profile: boolean;
    conditions: { id: string; name: string; description: string }[];
    allergens: { id: string; name: string; description: string }[];
    preferences: { id: string; name: string; description: string }[];
    isComplete?: boolean;
}): ProfileResponseDTO {
    return {
        id: profile.id,
        userId: profile.userId,
        first_name: profile.first_name,
        last_name: profile.last_name,
        age: profile.age,
        profile_image: profile.profile_image,
        main_profile: profile.main_profile,
        isComplete: profile.isComplete ?? false,
        conditions: profile.conditions,
        allergens: profile.allergens,
        preferences: profile.preferences
    };
}

// create profile
async createProfile(userId: string, data: CreateProfileDTO):Promise<ProfileResponseDTO>{
    // profile must belong to the logged-in user
    if (!userId) {
        throw new HttpError(401, "User is not authenticated");
    }

    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            deletedAt: null,
        },
        select: { id: true },
    });

    if (!user) {
        throw new HttpError(NOT_FOUND, "Authenticated user no longer exists");
    }

    await this.assertExistingIds("condition", data.conditionIds, "Condition ids");
    await this.assertExistingIds("allergen", data.allergenIds, "Allergen ids");
    await this.assertExistingIds("preference", data.preferenceIds, "Preference ids");

    const profile = await prisma.profile.create({
        data:{
            userId,
            first_name:data.first_name,
            last_name:data.last_name,
            age:data.age,
            profile_image:data.profile_image,
            conditions: data.conditionIds?.length
                ? { connect: data.conditionIds.map((id) => ({ id })) }
                : undefined,
            allergens: data.allergenIds?.length
                ? { connect: data.allergenIds.map((id) => ({ id })) }
                : undefined,
            preferences: data.preferenceIds?.length
                ? { connect: data.preferenceIds.map((id) => ({ id })) }
                : undefined,
        },
        include: profileInclude
    })

    return this.toProfileResponse(profile as {
        id: string;
        userId: string;
        first_name: string;
        last_name: string;
        age: string | null;
        profile_image: string | null;
        main_profile: boolean;
        conditions: { id: string; name: string; description: string }[];
        allergens: { id: string; name: string; description: string }[];
        preferences: { id: string; name: string; description: string }[];
        isComplete?: boolean;
    });
}

async getProfileById (id:string):Promise<ProfileResponseDTO>{
    const profile = await prisma.profile.findUnique({
        where:{id},
        include: profileInclude
    })

    if(!profile){
        throw new HttpError(NOT_FOUND, "Profile not found");
    }

    return this.toProfileResponse(profile as {
        id: string;
        userId: string;
        first_name: string;
        last_name: string;
        age: string | null;
        profile_image: string | null;
        main_profile: boolean;
        conditions: { id: string; name: string; description: string }[];
        allergens: { id: string; name: string; description: string }[];
        preferences: { id: string; name: string; description: string }[];
        isComplete?: boolean;
    });
}

async getProfileByUserId(userId: string): Promise<ProfileResponseDTO[]> {
    const profiles = await prisma.profile.findMany({
        where: { userId },
        include: profileInclude,
        orderBy: {
            createdAt: "desc"
        }
    });

    if (!profiles.length) {
        throw new HttpError(NOT_FOUND, "Profile not found");
    }

    return profiles.map((profile) => this.toProfileResponse(profile as {
        id: string;
        userId: string;
        first_name: string;
        last_name: string;
        age: string | null;
        profile_image: string | null;
        main_profile: boolean;
        conditions: { id: string; name: string; description: string }[];
        allergens: { id: string; name: string; description: string }[];
        preferences: { id: string; name: string; description: string }[];
        isComplete?: boolean;
    }));
}

async getAllProfiles(): Promise<ProfileResponseDTO[]> {
    const profiles = await prisma.profile.findMany({
        include: profileInclude,
        orderBy: {
            createdAt: "desc"
        }
    });

    return profiles.map((profile) => this.toProfileResponse(profile as {
        id: string;
        userId: string;
        first_name: string;
        last_name: string;
        age: string | null;
        profile_image: string | null;
        main_profile: boolean;
        conditions: { id: string; name: string; description: string }[];
        allergens: { id: string; name: string; description: string }[];
        preferences: { id: string; name: string; description: string }[];
        isComplete?: boolean;
    }));
}

async updateProfile(id: string, data: UpdateProfileDTO): Promise<ProfileResponseDTO> {
    const existingProfile = await prisma.profile.findUnique({ where: { id } });

    if (!existingProfile) {
        throw new HttpError(NOT_FOUND, "Profile not found");
    }

    const updatedProfile = await prisma.profile.update({
        where: { id },
        data: {
            first_name: data.first_name,
            last_name: data.last_name,
            age: data.age,
            profile_image: data.profile_image,
            main_profile: data.main_profile,
            // if ids are sent, replace existing links
            conditions: data.conditionIds
                ? { set: data.conditionIds.map((conditionId) => ({ id: conditionId })) }
                : undefined,
            allergens: data.allergenIds
                ? { set: data.allergenIds.map((allergenId) => ({ id: allergenId })) }
                : undefined,
            preferences: data.preferenceIds
                ? { set: data.preferenceIds.map((preferenceId) => ({ id: preferenceId })) }
                : undefined,
        },
        include: profileInclude
    });

    return this.toProfileResponse(updatedProfile as {
        id: string;
        userId: string;
        first_name: string;
        last_name: string;
        age: string | null;
        profile_image: string | null;
        main_profile: boolean;
        conditions: { id: string; name: string; description: string }[];
        allergens: { id: string; name: string; description: string }[];
        preferences: { id: string; name: string; description: string }[];
        isComplete?: boolean;
    });
}

async deleteProfile(id: string): Promise<{ message: string }> {
    const existingProfile = await prisma.profile.findUnique({ where: { id } });

    if (!existingProfile) {
        throw new HttpError(NOT_FOUND, "Profile not found");
    }

    const profileCount = await prisma.profile.count({
        where: { userId: existingProfile.userId },
    });

    if (profileCount <= 1) {
        throw new HttpError(BAD_REQUEST, "You must keep at least one profile");
    }

    await prisma.profile.delete({ where: { id } });
    return { message: "Profile deleted successfully" };
}
}
