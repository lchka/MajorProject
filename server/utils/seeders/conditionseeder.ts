import prisma from "../../lib/prisma.js";
// Seeder script to populate the database with common skin conditions for testing and development purposes
interface ConditionData {
	name: string;
	description: string;
}

const skinConditions: ConditionData[] = [
	{
		name: "Psoriasis",
		description:
			"A chronic autoimmune skin condition that causes red, scaly patches and inflammation.",
	},
	{
		name: "Eczema",
		description:
			"An inflammatory skin condition causing dry, itchy, and irritated skin.",
	},
	{
		name: "Acne",
		description:
			"A common skin condition where pores become clogged, leading to pimples and breakouts.",
	},
	{
		name: "Rosacea",
		description:
			"A long-term condition that causes facial redness, visible blood vessels, and sometimes bumps.",
	},
	{
		name: "Vitiligo",
		description:
			"A condition where pigment cells are lost, causing white patches on the skin.",
	},
	{
		name: "Seborrheic Dermatitis",
		description:
			"A skin condition causing red, flaky, and greasy patches, often on the scalp and face.",
	},
	{
		name: "Hives",
		description:
			"Raised, itchy welts on the skin often triggered by allergic reactions.",
	},
	{
		name: "Contact Dermatitis",
		description:
			"Skin inflammation caused by direct contact with an irritant or allergen.",
	},
	{
		name: "Melasma",
		description:
			"A condition that causes dark, discolored patches, usually on sun-exposed skin.",
	},
	{
		name: "Folliculitis",
		description:
			"Inflammation or infection of hair follicles resulting in red bumps or pustules.",
	},
];

async function seedConditions(): Promise<void> {
	try {
		console.log("Seeding skin conditions...");

		for (const condition of skinConditions) {
			const existingCondition = await prisma.condition.findFirst({
				where: { name: condition.name },
			});

			if (existingCondition) {
				console.log(`- Condition '${condition.name}' already exists, skipping`);
				continue;
			}

			await prisma.condition.create({
				data: condition,
			});

			console.log(`✓ Condition '${condition.name}' created`);
		}

		console.log("Skin conditions seeded successfully!");
	} catch (error) {
		console.error("Error seeding skin conditions:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

seedConditions();
