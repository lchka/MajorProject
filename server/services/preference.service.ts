import prisma from "../lib/prisma";
import { HttpError } from "../utils/HttpError";

import {
  CreatePreferenceDto,
  UpdatePreferenceDto,
  PreferenceResponseDto,
} from "../types/preference.dto";


export class PreferenceService {
    
    //create p
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
    const preference = await prisma.preference.findUnique({where:{id}})

    if(!preference){
        throw new HttpError(404,"Preference not found")
    }
    return preference;
  }

  //get all preferences
  async getAllPreferences():Promise<PreferenceResponseDto[]>{
    return prisma.preference.findMany({
        orderBy:{
            createdAt:"desc"
        }
    })

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
}
