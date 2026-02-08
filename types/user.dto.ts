// DTOs for User-related operations

export interface UserResponseDto {
  id: string;
  email: string;
  role: string;
  profile?: {
    first_name: string;
    last_name: string;
    nickname?: string | null;
    age?: number | null;
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
  roleId: string;
}
