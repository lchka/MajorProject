import userRepository from "../../repositories/user.repository.js";
import roleRepository from "../../repositories/role.repository.js";
import UserSecurity from "../utils/UserSecurity.js";
import { HttpError } from "../utils/HttpError.js";
import { CreateUserDto, UserResponseDto, UpdateUserDto } from "../types/user.dto.js";

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

  async updateUser(id: string, data: UpdateUserDto): Promise<UserResponseDto> {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    // Prepare update data
    const updateData: {
      email?: string;
      password?: string;
    } = {};

    if (data.email && data.email !== user.email) {
      // Check if new email is already taken
      const existingUser = await userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new HttpError(400, "Email already in use");
      }
      updateData.email = data.email;
    }

    if (data.password) {
      updateData.password = await UserSecurity.hashPassword(data.password);
    }

    // Update user if there are changes
    if (Object.keys(updateData).length > 0) {
      await userRepository.update(id, updateData);
    }

    // Update profile if there are profile changes
    const profileData: {
      first_name?: string;
      last_name?: string;
      nickname?: string;
      age?: number;
    } = {};

    if (data.first_name) profileData.first_name = data.first_name;
    if (data.last_name) profileData.last_name = data.last_name;
    if (data.nickname !== undefined) profileData.nickname = data.nickname;
    if (data.age !== undefined) profileData.age = data.age;

    if (Object.keys(profileData).length > 0) {
      await userRepository.updateProfile(id, profileData);
    }

    // Fetch and return updated user
    const updatedUser = await userRepository.findById(id);
    if (!updatedUser) {
      throw new HttpError(404, "User not found after update");
    }

    return this.mapToUserResponse(updatedUser);
  }

  async softDeleteUser(id: string): Promise<{ message: string }> {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    await userRepository.softDelete(id);

    return { message: "User soft deleted successfully" };
  }

  async forceDeleteUser(id: string): Promise<{ message: string }> {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    await userRepository.forceDelete(id);

    return { message: "User permanently deleted" };
  }

  async restoreUser(id: string): Promise<UserResponseDto> {
    const restoredUser = await userRepository.restore(id);

    if (!restoredUser) {
      throw new HttpError(404, "User not found");
    }

    return this.mapToUserResponse(restoredUser);
  }

  private mapToUserResponse(user: {
    id: string;
    email: string;
    role: { name: string };
    profile?: { first_name: string; last_name: string; nickname?: string | null; age?: number | null } | null;
  }): UserResponseDto {
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
