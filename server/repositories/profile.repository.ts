import  prisma from "../lib/prisma.js"
import { Prisma } from "@prisma/client"

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

export class ProfileRepository{

// newest profiles first
async findAll(){
    return await prisma.profile.findMany({
        include: profileInclude,
        orderBy:{createdAt:"desc"}
    })
}

async findById(id:string){

    return await prisma.profile.findUnique({
        where : {id}
        ,include: profileInclude
    })
}

// get profile by owning user id
async findByUserId(userId: string){
    return await prisma.profile.findFirst({
        where: { userId },
        include: profileInclude
    })
}

async create (data:Prisma.ProfileCreateInput){
    return await prisma.profile.create({
        data,
        include: profileInclude
    })
}

// update only fields that are passed in
async update (id:string, data:Prisma.ProfileUpdateInput){
    return await prisma.profile.update({
        where:{id},
        data,
        include: profileInclude
    })
}

// hard delete profile
async delete(id:string){
    return await prisma.profile.delete({
        where:{id}
    })
}

}

export default new ProfileRepository();