import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";

export class conditionRepository{

    async findAll(){
        return await prisma.condition.findMany({
            orderBy:{createdAt:"desc"}
        })
    }

    async findById(id:string){
        return await prisma.condition.findUnique({
            where :{id}
        })
    }

    async findByName(name:string){
        return await prisma.condition.findFirst({
            where:{name}
        })
    }

    async create(data:Prisma.ConditionCreateInput){
        return await prisma.condition.create({
            data,
        })
    }
    async update(id:string,data:Prisma.ConditionUpdateInput){
        return await prisma.condition.update({
            where:{id},
            data
        })
    }
    async delete (id:string){
        return await prisma.condition.delete({
             where:{id}
        })
    }
}