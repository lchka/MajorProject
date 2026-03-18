import prisma from "../lib/prisma.js";
import { Prisma } from "@prisma/client";

export class AllergenRepository {
    async findAll(){
        return await prisma.allergen.findMany({
            orderBy:{createdAt:"desc"}
        })
    }

    async findById(id:  string){
        return await prisma.preference.findUnique({
            where :{id}
        })
    }

    async findByName(name: string){
        return await prisma.preference.findFirst({
            where:{name},
        })
    }


    async create(data: Prisma.AllergenCreateInput){
        return await prisma.allergen.create({
            data,
        })
    }

    async update(id: string,data: Prisma.AllergenUpdateInput){
        return await prisma.allergen.update({
            where:{id},
            data,
        })
    }

    async delete(id:string){
        return await prisma.allergen.delete({
            where:{id}
        })
    }
}