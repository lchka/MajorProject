import prisma from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";

export class ProductRepository {
	//find all
	async findAll() {
		return await prisma.product.findMany({
			orderBy: { createdAt: "desc" },
		});
	}
//find by id
	async findById(id: string) {
		return await prisma.product.findUnique({
			where: { id },
		});
	}
//create a new product
	async create(data: Prisma.ProductCreateInput) {
		return await prisma.product.create({
			data,
		});
	}
//update an existing product by id
	async update(id: string, data: Prisma.ProductUpdateInput) {
		return await prisma.product.update({
			where: { id },
			data,
		});
	}
//delete a product by id
	async delete(id: string) {
		return await prisma.product.delete({
			where: { id },
		});
	}
}

export default new ProductRepository();
