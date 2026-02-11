// DTOs for User-related operations

export interface UserResponseDto {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: {
    id: number;
    name: string;
  };
}

export interface RegisterRequestDto {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  c_password: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  message: string;
  token: string;
  user: UserResponseDto;
}

export interface CreateUserDto {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  roleId: number;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
}

export interface UpdateProfileDto {
  first_name?: string;
  last_name?: string;
  nickname?: string;
  age?: number;
}
