import prisma from "../../lib/prisma.js";
// Seeder script to populate the database with common user preferences for testing and development purposes
interface PreferenceData {
	name: string;
	description: string;
}

const preferences: PreferenceData[] = [
	{
		name: "Cruelty-Free",
		description:
			"Products developed without animal testing at any stage of production.",
	},
	{
		name: "Vegan",
		description:
			"Products with no animal-derived ingredients or by-products.",
	},
	{
		name: "Fragrance-Free",
		description:
			"Products formulated without added fragrance to reduce irritation risk.",
	},
	{
		name: "Alcohol-Free",
		description:
			"Products that do not contain drying alcohols that may irritate skin.",
	},
	{
		name: "Paraben-Free",
		description:
			"Products that avoid parabens often used as preservatives.",
	},
	{
		name: "Sulfate-Free",
		description:
			"Products that avoid sulfates, which can strip natural oils from skin.",
	},
	{
		name: "Hypoallergenic",
		description:
			"Products designed to minimize the chance of allergic reactions.",
	},
	{
		name: "Non-Comedogenic",
		description:
			"Products formulated not to clog pores.",
	},
	{
		name: "Organic",
		description:
			"Products made with ingredients grown without synthetic pesticides.",
	},
	{
		name: "Eco-Friendly Packaging",
		description:
			"Products packaged with recyclable or low-impact materials.",
	},
];

async function seedPreferences(): Promise<void> {
	try {
		console.log("Seeding preferences...");

		for (const preference of preferences) {
			const existingPreference = await prisma.preference.findFirst({
				where: { name: preference.name },
			});

			if (existingPreference) {
				console.log(`- Preference '${preference.name}' already exists, skipping`);
				continue;
			}

			await prisma.preference.create({
				data: preference,
			});

			console.log(`✓ Preference '${preference.name}' created`);
		}

		console.log("Preferences seeded successfully!");
	} catch (error) {
		console.error("Error seeding preferences:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

seedPreferences();
