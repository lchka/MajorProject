import API from "./api";

export type Condition = {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  usedCount?: number;
};

// GET all conditions
export const getConditions = async (): Promise<Condition[]> => {
  const res = await API.get("/conditions");
  return res.data;
};

// GET single condition
export const getConditionById = async (id: string): Promise<Condition> => {
  const res = await API.get(`/conditions/${id}`);
  return res.data;
};

// CREATE condition
export const createCondition = async (data: {
  name: string;
  description?: string;
}): Promise<Condition> => {
  const res = await API.post("/conditions", data);
  return res.data;
};

// UPDATE condition
export const updateCondition = async (
  id: string,
  data: {
    name?: string;
    description?: string;
  }
): Promise<Condition> => {
  const res = await API.patch(`/conditions/${id}`, data);
  return res.data;
};

// DELETE condition
export const deleteCondition = async (id: string): Promise<void> => {
  await API.delete(`/conditions/${id}`);
};