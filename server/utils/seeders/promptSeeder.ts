import prisma from "../../lib/prisma.js";
// Seeder script to populate the database with predefined prompts for testing and development purposes
type PromptCategory =
	| "Shampoo"
	| "Deodorant & Antiperspirant"
	| "Cleanser"
	| "Scrub"
	| "Conditioner"
	| "Body Wash"
	| "Moisturiser"
	| "Serum"
	| "Other";

interface PromptData {
	prompt_text: string;
	category: PromptCategory;
}

const prompts: PromptData[] = [
	{
		category: "Shampoo",
		prompt_text:
			"Evaluate this shampoo for ingredient safety and suitability against the user's allergens, skin conditions, and preferences.",
	},
	{
		category: "Deodorant & Antiperspirant",
		prompt_text:
			"Assess this deodorant or antiperspirant for irritation risk, allergen conflicts, and preference alignment for the user profile.",
	},
	{
		category: "Cleanser",
		prompt_text:
			"Review this cleanser for potential triggers, harsh surfactants, and overall compatibility with the user's skin profile.",
	},
	{
		category: "Scrub",
		prompt_text:
			"Analyze this scrub for abrasive and sensitizing ingredients, then score suitability for the user's conditions and sensitivities.",
	},
	{
		category: "Conditioner",
		prompt_text:
			"Evaluate this conditioner for ingredient compatibility, allergen overlap, and profile-specific risks for the user.",
	},
	{
		category: "Body Wash",
		prompt_text:
			"Assess this body wash for cleansing agents, fragrance/preservative risks, and profile fit based on user concerns.",
	},
	{
		category: "Moisturiser",
		prompt_text:
			"Evaluate this moisturiser for barrier-supportive vs irritating ingredients and determine suitability for the user's profile.",
	},
	{
		category: "Serum",
		prompt_text:
			"Review this serum for active ingredient safety, irritation potential, and compatibility with user allergens, conditions, and preferences.",
	},
	{
		category: "Other",
		prompt_text:
			"Perform a cautious ingredient safety evaluation for this product and explain suitability for the user's profile in clear reasons.",
	},
];

async function seedPrompts(): Promise<void> {
	try {
		console.log("Seeding prompts...");

		for (const prompt of prompts) {
			const existingPrompt = await prisma.prompt.findFirst({
				where: {
					category: prompt.category,
					prompt_text: prompt.prompt_text,
				},
			});

			if (existingPrompt) {
				console.log(`- Prompt for '${prompt.category}' already exists, skipping`);
				continue;
			}

			await prisma.prompt.create({
				data: prompt,
			});

			console.log(`✓ Prompt for '${prompt.category}' created`);
		}

		console.log("Prompts seeded successfully!");
	} catch (error) {
		console.error("Error seeding prompts:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

seedPrompts();
