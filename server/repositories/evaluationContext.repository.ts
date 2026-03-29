import prisma from "../lib/prisma.js";

type PrismaRuntime = {
	evaluationContext: {
		findMany: (args?: Record<string, unknown>) => Promise<unknown[]>;
		findUnique: (args: { where: { id: string } }) => Promise<unknown | null>;
		create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
		update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
		delete: (args: { where: { id: string } }) => Promise<unknown>;
	};
};

const prismaRuntime = prisma as unknown as PrismaRuntime;

export class EvaluationContextRepository {
	async findAll() {
		return await prismaRuntime.evaluationContext.findMany({
			orderBy: { createdAt: "desc" },
		});
	}

	async findById(id: string) {
		return await prismaRuntime.evaluationContext.findUnique({
			where: { id },
		});
	}

	async findByProfileId(profileId: string) {
		return await prismaRuntime.evaluationContext.findMany({
			where: { profileId },
			orderBy: { createdAt: "desc" },
		});
	}

	async findByProductId(productId: string) {
		return await prismaRuntime.evaluationContext.findMany({
			where: { productId },
			orderBy: { createdAt: "desc" },
		});
	}

	async create(data: Record<string, unknown>) {
		return await prismaRuntime.evaluationContext.create({
			data,
		});
	}

	async update(id: string, data: Record<string, unknown>) {
		return await prismaRuntime.evaluationContext.update({
			where: { id },
			data,
		});
	}

	async delete(id: string) {
		return await prismaRuntime.evaluationContext.delete({
			where: { id },
		});
	}
}

export default new EvaluationContextRepository();
