import prisma from "../lib/prisma.js";
import type { Prisma } from "@prisma/client"

export class promptRepository{
//find all prompts
    async findAll(){
        return await prisma.prompt.findMany({
            orderBy:{createdAt:"desc"}
        })
    }
//find prompt by id
    async findById(id:string){
        return await prisma.prompt.findUnique({
            where:{id}
        })
    }
//create a new prompt
    async create(data:Prisma.PromptCreateInput){
        return await prisma.prompt.create({
            data
        })
    }
//update an existing prompt by id
    async update(data:Prisma.PromptCreateInput,id:string){
        return await prisma.prompt.update({
            data,
            where:{id}
        })
    }
//delete a prompt by id
    async delete(id:string){
        return await prisma.prompt.delete({
            where:{id}
        })
    }
}