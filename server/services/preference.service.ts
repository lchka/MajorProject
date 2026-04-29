import prisma from "../lib/prisma.js";
import preferenceRepository from "../repositories/preference.repository.js";
import { HttpError } from "../utils/HttpError.js";

import {
  CreatePreferenceDto,
  UpdatePreferenceDto,
  PreferenceResponseDto,
} from "../types/preference.dto.js";


export class PreferenceService {
    
    //create preference
  async createPreference(data: CreatePreferenceDto): Promise<PreferenceResponseDto> {
    const preference = await prisma.preference.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return preference;
  }

  //get all preferences by id
  async getPreferenceById(id:string):Promise<PreferenceResponseDto>{
    const preference = await preferenceRepository.findById(id)

    if(!preference){
        throw new HttpError(404,"Preference not found")
    }

    return {
      ...preference,
      usedCount: preference.profiles.length,
    };
  }

  //get all preferences
  async getAllPreferences():Promise<PreferenceResponseDto[]>{
    return preferenceRepository.findAll();

  }
//updating preference
  async updatePreference(id:string, data:UpdatePreferenceDto):Promise<PreferenceResponseDto>{
    const existingPreference = await prisma.preference.findUnique({where:{id}})

    if(!existingPreference){
        throw new HttpError(404, "Preference not found")
    }
    const updatedPreference = await prisma.preference.update({
        where: {id},
        data,
    })
    return updatedPreference;
  }

  //delete preference 

  async deletePreference(id:string):Promise<{message:string}>{

    const existingPreference = await prisma.preference.findUnique({where:{id}})

    if(!existingPreference){
        throw new HttpError(404, "Preference not found ")
    }
    await prisma.preference.delete({where:{id}})
    return {message:"Preference deleted successfully"}
  }

  async getProfilePreferences(profileId: string): Promise<PreferenceResponseDto[]> {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        preferences: {
          orderBy: { name: "asc" }
        }
      }
    });

    if (!profile) {
      throw new HttpError(404, "Profile not found");
    }

    return profile.preferences;
  }
}
