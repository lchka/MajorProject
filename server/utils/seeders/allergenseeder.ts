import prisma from "../../lib/prisma.js";

interface AllergenData {
	name: string;
	description: string;
}

const allergens: AllergenData[] = [
	{
		name: "Fragrance Mix",
		description:
			"A blend of fragrance compounds that commonly trigger contact allergies in cosmetics.",
	},
	{
		name: "Balsam of Peru",
		description:
			"A fragrant resin used in scented products and flavorings that can cause allergic dermatitis.",
	},
	{
		name: "Preservative Mix (MCI/MI)",
		description:
			"Methylchloroisothiazolinone and methylisothiazolinone preservatives known to cause skin sensitivity.",
	},
	{
		name: "Formaldehyde-Releasing Preservatives",
		description:
			"Preservatives that release formaldehyde over time and may trigger skin irritation or allergy.",
	},
	{
		name: "Parabens",
		description:
			"A class of preservatives that can cause reactions in sensitive individuals.",
	},
	{
		name: "Lanolin",
		description:
			"A moisturizing ingredient from wool wax that may cause allergic reactions in some users.",
	},
	{
		name: "Propylene Glycol",
		description:
			"A solvent and humectant used in many personal care products that may irritate sensitive skin.",
	},
	{
		name: "Cocamidopropyl Betaine",
		description:
			"A surfactant in cleansers and shampoos that can be associated with allergic contact dermatitis.",
	},
	{
		name: "Nickel",
		description:
			"A metal allergen that can be present as a trace contaminant in cosmetic tools or pigments.",
	},
	{
		name: "P-Phenylenediamine (PPD)",
		description:
			"A hair dye ingredient that is a frequent cause of strong allergic skin reactions.",
	},
];

async function seedAllergens(): Promise<void> {
	try {
		console.log("Seeding allergens...");

		for (const allergen of allergens) {
			const existingAllergen = await prisma.allergen.findFirst({
				where: { name: allergen.name },
			});

			if (existingAllergen) {
				console.log(`- Allergen '${allergen.name}' already exists, skipping`);
				continue;
			}

			await prisma.allergen.create({
				data: allergen,
			});

			console.log(`✓ Allergen '${allergen.name}' created`);
		}

		console.log("Allergens seeded successfully!");
	} catch (error) {
		console.error("Error seeding allergens:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

seedAllergens();
