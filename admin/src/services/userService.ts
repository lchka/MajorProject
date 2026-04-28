import API from "./api";

export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: {
    id: string;
    name: string;
  };
  deletedAt?: string | null; 
};

// GET all users
export const getUsers = async (): Promise<User[]> => {
  const res = await API.get("/users");
  return res.data;
};

// SOFT DELETE (normal delete)
export const softDeleteUser = async (id: string) => {
  const res = await API.delete(`/users/${id}`);
  return res.data;
};

// FORCE DELETE (permanent)
export const forceDeleteUser = async (id: string) => {
  const res = await API.delete(`/users/${id}/force`);
  return res.data;
};

// RESTORE user
export const restoreUser = async (id: string) => {
  const res = await API.patch(`/users/${id}/restore`);
  return res.data;
};

// UPDATE user
export const updateUser = async (
  id: string,
  data: {
    email?: string;
    first_name?: string;
    last_name?: string;
    password?: string;
  }
) => {
  const res = await API.patch(`/users/${id}`, data);
  return res.data;
};