import userRepository from "../repositories/user.repository.js";
import roleRepository from "../repositories/role.repository.js";
import UserSecurity from "../utils/UserSecurity.js";
import { HttpError } from "../utils/HttpError.js";
import { CreateUserDto, UserResponseDto } from "../types/user.dto.js";

export class UserService {
  async registerUser(data: CreateUserDto): Promise<UserResponseDto> {
    // Check if user already exists
    const existingUser = await userRepository.findByEmail(data.email);
    
    if (existingUser) {
      throw new HttpError(400, "User already exists");
    }

    // Hash the password
    const hashedPassword = await UserSecurity.hashPassword(data.password);

    // Get the role
    const role = await roleRepository.findById(data.roleId);
    
    if (!role) {
      throw new HttpError(500, "Default user role not found. Please run role seeder.");
    }

    // Create the user
    const user = await userRepository.create({
      email: data.email,
      password: hashedPassword,
      first_name: data.first_name,
      last_name: data.last_name,
      roleId: role.id,
    });

    return this.mapToUserResponse(user);
  }

  async authenticateUser(email: string, password: string): Promise<UserResponseDto> {
    // Find user by email
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new HttpError(401, "Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await UserSecurity.comparePassword(
      password,
      user.password
    );

    if (!isPasswordValid) {
      throw new HttpError(401, "Invalid credentials");
    }

    return this.mapToUserResponse(user);
  }

  async getUserById(id: string): Promise<UserResponseDto> {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    return this.mapToUserResponse(user);
  }

  async getAllUsers(): Promise<UserResponseDto[]> {
    const users = await userRepository.findAll();
    return users.map(user => this.mapToUserResponse(user));
  }

  private mapToUserResponse(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role.name,
      profile: user.profile ? {
        first_name: user.profile.first_name,
        last_name: user.profile.last_name,
        nickname: user.profile.nickname,
        age: user.profile.age,
      } : undefined,
    };
  }
}

export default new UserService();
