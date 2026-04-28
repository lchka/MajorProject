import api from '../config/api';

export interface RegisterInput {
  first_name: string;
  last_name?: string;
  email: string;
  password: string;
  c_password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface GoogleAuthInput {
  token: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    profile_id?: string | null;
    role: {
      id: string;
      name: string;
    };
  };
}


export const authService = {

  register: async (data: RegisterInput): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },


  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  googleLogin: async (data: GoogleAuthInput): Promise<AuthResponse> => {
    const response = await api.post('/auth/google', data);
    return response.data;
  },


  logout: async (): Promise<void> => {
 
  },

 
  getCurrentUser: async (): Promise<any> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateEmail: async (currentEmail: string, newEmail: string, password: string): Promise<any> => {
    const response = await api.patch('/auth/update-email', {
      currentEmail,
      newEmail,
      password,
    });
    return response.data;
  },

  updatePassword: async (currentPassword: string, newPassword: string): Promise<any> => {
    const response = await api.patch('/auth/update-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

export default authService;
