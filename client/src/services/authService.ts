import api from '../config/api';

export interface RegisterInput {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  c_password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    roleId: string;
    role: {
      id: string;
      name: string;
    };
  };
}

/**
 * Auth Service - Handles all authentication-related API calls
 */
export const authService = {
  /**
   * Register a new user
   */
  register: async (data: RegisterInput): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  /**
   * Login user
   */
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  /**
   * Logout user (clear local storage)
   */
  logout: async (): Promise<void> => {
    // Clear any stored tokens
    // await AsyncStorage.removeItem('authToken');
    // You can also make an API call if your backend has a logout endpoint
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async (): Promise<any> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default authService;
