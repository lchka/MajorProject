import API from "./api";

export type Preference = {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
};

// GET all preferences
export const getPreferences = async (): Promise<Preference[]> => {
  const res = await API.get("/preferences");
  return res.data;
};

// GET single preference
export const getPreferenceById = async (id: string): Promise<Preference> => {
  const res = await API.get(`/preferences/${id}`);
  return res.data;
};

// CREATE preference
export const createPreference = async (data: {
  name: string;
  description?: string;
}): Promise<Preference> => {
  const res = await API.post("/preferences", data);
  return res.data;
};

// UPDATE preference
export const updatePreference = async (
  id: string,
  data: {
    name?: string;
    description?: string;
  }
): Promise<Preference> => {
  const res = await API.patch(`/preferences/${id}`, data);
  return res.data;
};

// DELETE preference
export const deletePreference = async (id: string): Promise<void> => {
  await API.delete(`/preferences/${id}`);
};