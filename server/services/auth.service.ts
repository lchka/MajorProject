import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { randomUUID } from "crypto";
import userService from "./user.service.js";
import userRepository from "../repositories/user.repository.js";
import roleRepository from "../repositories/role.repository.js";
import { HttpError } from "../utils/HttpError.js";
import {
  RegisterRequestDto,
  LoginRequestDto,
  GoogleLoginRequestDto,
  AuthResponseDto,
} from "../types/user.dto.js";

export class AuthService {
  // jwt config
  private readonly JWT_SECRET = process.env.JWT_SECRET as string;
  private readonly JWT_EXPIRES_IN = "7d";
  private readonly googleClient = new OAuth2Client();

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

  async googleLogin(data: GoogleLoginRequestDto): Promise<AuthResponseDto> {
    const audiences = this.getGoogleAudiences();
    if (audiences.length === 0) {
      throw new HttpError(
        500,
        "Google auth is not configured. Set GOOGLE_AUTH_CLIENT_IDS or GOOGLE_*_CLIENT_ID in server environment.",
      );
    }

    let ticket;
    try {
      ticket = await this.googleClient.verifyIdToken({
        idToken: data.token,
        audience: audiences,
      });
    } catch {
      throw new HttpError(401, "Invalid Google ID token.");
    }

    const payload = ticket.getPayload();
    const email = payload?.email?.toLowerCase().trim();

    if (!email || payload?.email_verified !== true) {
      throw new HttpError(401, "Google account email is missing or not verified.");
    }

    const user = await userRepository.findByEmail(email);

    if (!user) {
      const userRole = await roleRepository.findByName("user");

      if (!userRole) {
        throw new HttpError(
          500,
          "Default user role not found. Please run role seeder.",
        );
      }

      const firstName = payload?.given_name?.trim() || this.getFirstNameFromDisplayName(payload?.name);
      const lastName = payload?.family_name?.trim() || this.getLastNameFromDisplayName(payload?.name);

      const createdUser = await userService.registerUser({
        email,
        password: this.generateOauthPassword(),
        first_name: firstName,
        last_name: lastName,
        roleId: userRole.id,
      });

      const token = this.generateToken(createdUser.id);

      return {
        message: "Google login successful",
        token,
        user: createdUser,
      };
    }

    const authenticatedUser = await userService.getUserById(user.id);
    const token = this.generateToken(authenticatedUser.id);

    return {
      message: "Google login successful",
      token,
      user: authenticatedUser,
    };
  }

  private getGoogleAudiences(): string[] {
    const directAudiences = [
      process.env.GOOGLE_WEB_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
      process.env.GOOGLE_IOS_CLIENT_ID,
      process.env.GOOGLE_EXPO_CLIENT_ID,
    ]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value));

    const grouped = (process.env.GOOGLE_AUTH_CLIENT_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    return [...new Set([...directAudiences, ...grouped])];
  }

  private generateOauthPassword(): string {
    return `G#${randomUUID()}a1`;
  }

  private getFirstNameFromDisplayName(name?: string): string {
    const cleaned = name?.trim();
    if (!cleaned) {
      return "Google";
    }

    return cleaned.split(/\s+/)[0] || "Google";
  }

  private getLastNameFromDisplayName(name?: string): string {
    const cleaned = name?.trim();
    if (!cleaned) {
      return "User";
    }

    const parts = cleaned.split(/\s+/);
    if (parts.length < 2) {
      return "User";
    }

    return parts.slice(1).join(" ") || "User";
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

  // get current user by ID
  async getCurrentUser(userId: string) {
    const user = await userRepository.findById(userId);
    
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    return user;
  }
}

export default new AuthService();
