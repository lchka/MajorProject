import API from "./api";

export type Allergen = {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
};

// GET all allergens
export const getAllergens = async (): Promise<Allergen[]> => {
  const res = await API.get("/allergens");
  return res.data;
};

// GET single allergen
export const getAllergenById = async (id: string): Promise<Allergen> => {
  const res = await API.get(`/allergens/${id}`);
  return res.data;
};

// CREATE allergen
export const createAllergen = async (data: {
  name: string;
  description?: string;
}): Promise<Allergen> => {
  const res = await API.post("/allergens", data);
  return res.data;
};

// UPDATE allergen
export const updateAllergen = async (
  id: string,
  data: {
    name?: string;
    description?: string;
  }
): Promise<Allergen> => {
  const res = await API.patch(`/allergens/${id}`, data);
  return res.data;
};

// DELETE allergen
export const deleteAllergen = async (id: string): Promise<void> => {
  await API.delete(`/allergens/${id}`);
};