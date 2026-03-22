import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";

export class conditionRepository{

    // newest conditions first
    async findAll(){
        return await prisma.condition.findMany({
            orderBy:{createdAt:"desc"}
        })
    }

    // get one condition by id
    async findById(id:string){
        return await prisma.condition.findUnique({
            where :{id}
        })
    }

    // get one condition by name
    async findByName(name:string){
        return await prisma.condition.findFirst({
            where:{name}
        })
    }

    // create condition record
    async create(data:Prisma.ConditionCreateInput){
        return await prisma.condition.create({
            data,
        })
    }

    // update condition fields
    async update(id:string,data:Prisma.ConditionUpdateInput){
        return await prisma.condition.update({
            where:{id},
            data
        })
    }

    // hard delete condition
    async delete (id:string){
        return await prisma.condition.delete({
             where:{id}
        })
    }
}