import prisma from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";

export class ProductRepository {
	async findAll() {
		return await prisma.product.findMany({
			orderBy: { createdAt: "desc" },
		});
	}

	async findById(id: string) {
		return await prisma.product.findUnique({
			where: { id },
		});
	}

	async create(data: Prisma.ProductCreateInput) {
		return await prisma.product.create({
			data,
		});
	}

	async update(id: string, data: Prisma.ProductUpdateInput) {
		return await prisma.product.update({
			where: { id },
			data,
		});
	}

	async delete(id: string) {
		return await prisma.product.delete({
			where: { id },
		});
	}
}

export default new ProductRepository();
