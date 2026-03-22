import jwt from "jsonwebtoken";
import userService from "./user.service.js";
import roleRepository from "../repositories/role.repository.js";
import { HttpError } from "../utils/HttpError.js";
import {
  RegisterRequestDto,
  LoginRequestDto,
  AuthResponseDto,
} from "../types/user.dto.js";

export class AuthService {
  // jwt config
  private readonly JWT_SECRET = process.env.JWT_SECRET as string;
  private readonly JWT_EXPIRES_IN = "7d";

  // register user + return token
  async register(data: RegisterRequestDto): Promise<AuthResponseDto> {
    // pull default role for new signups
    const userRole = await roleRepository.findByName("user");

    if (!userRole) {
      throw new HttpError(
        500,
        "Default user role not found. Please run role seeder.",
      );
    }

    // create user account
    const user = await userService.registerUser({
      email: data.email,
      password: data.password,
      first_name: data.first_name,
      last_name: data.last_name,
      roleId: userRole.id,
    });

    // issue auth token
    const token = this.generateToken(user.id);

    return {
      message: "Registration successful",
      token,
      user,
    };
  }

  // login user + return token
  async login(data: LoginRequestDto): Promise<AuthResponseDto> {
    // validate email/password
    const user = await userService.authenticateUser(data.email, data.password);

    // issue auth token
    const token = this.generateToken(user.id);

    return {
      message: "Login successful",
      token,
      user,
    };
  }

  // sign jwt with user id payload
  private generateToken(userId: string): string {
    return jwt.sign({ userId }, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  // verify jwt and return payload
  verifyToken(token: string): { userId: string } {
    try {
      return jwt.verify(token, this.JWT_SECRET) as { userId: string };
    } catch {
      throw new HttpError(401, "Invalid or expired token");
    }
  }
}

export default new AuthService();
