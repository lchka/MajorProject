import api from '../config/api';

export interface User {
  id: string;
  email: string;
  roleId: string;
  role: {
    id: string;
    name: string;
  };
  profile?: any;
  createdAt: string;
  updatedAt: string;
}

/**
 * User Service - Handles all user-related API calls
 */
export const userService = {
  /**
   * Get all users (admin only)
   */
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  /**
   * Get user by ID
   */
  getUserById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  /**
   * Update user
   */
  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Delete user (soft delete)
   */
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

export default userService;
