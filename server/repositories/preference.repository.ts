import prisma from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";

export class PreferenceRepository {
	// newest preferences first
	async findAll() {
		return await prisma.preference.findMany({
			orderBy: { createdAt: "desc" },
		});
	}

	// get one preference by id
	async findById(id: string) {
		return await prisma.preference.findUnique({
			where: { id },
		});
	}

	// get one preference by name
	async findByName(name: string) {
		return await prisma.preference.findFirst({
			where: { name },
		});
	}

	// create preference record
	async create(data: Prisma.PreferenceCreateInput) {
		return await prisma.preference.create({
			data,
		});
	}

	// update preference fields
	async update(id: string, data: Prisma.PreferenceUpdateInput) {
		return await prisma.preference.update({
			where: { id },
			data,
		});
	}

	// hard delete preference
	async delete(id: string) {
		return await prisma.preference.delete({
			where: { id },
		});
	}
}

export default new PreferenceRepository();
