import prisma from "../lib/prisma.js";
import { Prisma } from "@prisma/client";

export class PreferenceRepository {
	async findAll() {
		return await prisma.preference.findMany({
			orderBy: { createdAt: "desc" },
		});
	}

	async findById(id: string) {
		return await prisma.preference.findUnique({
			where: { id },
		});
	}

	async findByName(name: string) {
		return await prisma.preference.findFirst({
			where: { name },
		});
	}

	async create(data: Prisma.PreferenceCreateInput) {
		return await prisma.preference.create({
			data,
		});
	}

	async update(id: string, data: Prisma.PreferenceUpdateInput) {
		return await prisma.preference.update({
			where: { id },
			data,
		});
	}

	async delete(id: string) {
		return await prisma.preference.delete({
			where: { id },
		});
	}
}

export default new PreferenceRepository();
