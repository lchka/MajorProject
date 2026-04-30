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
  console.log("BASE URL:", API.defaults.baseURL);
};

export const softDeleteUser = async (id: string) => {
  const token = localStorage.getItem("token");

  return await API.delete(`/users/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
// FORCE DELETE (permanent)
export const forceDeleteUser = async (id: string) => {
  const token = localStorage.getItem("token");

  const res = await API.delete(`/users/${id}/force`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
console.log("TOKEN:", token);
  return res.data;
};

// RESTORE user
export const restoreUser = async (id: string) => {
  const res = await API.post(`/users/${id}/restore`);
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