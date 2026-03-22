import prisma from "../lib/prisma.js";
import { Prisma } from "@prisma/client";

export class AllergenRepository {
    // newest allergens first
    async findAll(){
        return await prisma.allergen.findMany({
            orderBy:{createdAt:"desc"}
        })
    }

    // get one allergen by id
    async findById(id:  string){
        return await prisma.preference.findUnique({
            where :{id}
        })
    }

    // get one allergen by name
    async findByName(name: string){
        return await prisma.preference.findFirst({
            where:{name},
        })
    }


    // create allergen record
    async create(data: Prisma.AllergenCreateInput){
        return await prisma.allergen.create({
            data,
        })
    }

    // update allergen fields
    async update(id: string,data: Prisma.AllergenUpdateInput){
        return await prisma.allergen.update({
            where:{id},
            data,
        })
    }

    // hard delete allergen
    async delete(id:string){
        return await prisma.allergen.delete({
            where:{id}
        })
    }
}