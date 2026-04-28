import prisma from "../lib/prisma";
import type { Prisma } from "@prisma/client";

export class conditionRepository{

    // newest conditions first
    async findAll(){
        const conditions = await prisma.condition.findMany({
            orderBy:{createdAt:"desc"},
            include: {
                profiles: true,
            },
        });

        return conditions.map((c) => ({
            ...c,
            usedCount: c.profiles.length,
        }));
    }

    // get one condition by id
    async findById(id:string){
        return await prisma.condition.findUnique({
            where :{id},
            include: {
                profiles: true,
            },
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

export default new conditionRepository();