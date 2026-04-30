import API from "./api";

export const Category = {
  Shampoo: "Shampoo",
  DeodorantAndAntiperspirant: "Deodorant & Antiperspirant",
  Cleanser: "Cleanser",
  Scrub: "Scrub",
  Conditioner: "Conditioner",
  BodyWash: "Body Wash",
  Moisturiser: "Moisturiser",
  Serum: "Serum",
  Other: "Other",
} as const;

export type Category = (typeof Category)[keyof typeof Category];

export type Prompt = {
  id: string;
  prompt_text: string;
  category: Category;
  createdAt?: string;
  usedCount?: number; 
};

// GET all prompts
export const getPrompts = async (): Promise<Prompt[]> => {
  const res = await API.get("/prompts");
  return res.data;
};

// GET single prompt
export const getPromptById = async (id: string): Promise<Prompt> => {
  const res = await API.get(`/prompts/${id}`);
  return res.data;
};

// CREATE prompt
export const createPrompt = async (data: {
  prompt_text: string;
  category: Category;
}): Promise<Prompt> => {
  const res = await API.post("/prompts", data);
  return res.data;
};

// UPDATE prompt
export const updatePrompt = async (
  id: string,
  data: {
    prompt_text?: string;
    category?: Category;
  }
): Promise<Prompt> => {
  const res = await API.patch(`/prompts/${id}`, data);
  return res.data;
};

// DELETE prompts
export const deletePrompt = async (id: string): Promise<void> => {
  await API.delete(`/prompts/${id}`);
};