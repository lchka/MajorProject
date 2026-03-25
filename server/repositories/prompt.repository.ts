import prisma from "../lib/prisma";
import {Prisma} from "@prisma/client"

export class promptRepository{

    async findAll(){
        return await prisma.prompt.findMany({
            orderBy:{createdAt:"desc"}
        })
    }

    async findById(id:number){
        return await prisma.prompt.findUnique({
            where:{id}
        })
    }

    async create(data:Prisma.PromptCreateInput){
        return await prisma.prompt.create({
            data
        })
    }

    async update(data:Prisma.PromptCreateInput,id:number){
        return await prisma.prompt.update({
            data,
            where:{id}
        })
    }

    async delete(id:number){
        return await prisma.prompt.delete({
            where:{id}
        })
    }
}