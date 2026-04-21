import { Request, Response, NextFunction } from "express";
import userService from "../services/user.service.js";
import { UpdateUserDto } from "../types/user.dto.js";
import { SUCCESS_RES } from "../utils/HttpError.js";
//CHECK AUTH MIDDLARE AND PERMISSION TYPES FOR ROLE POLICIES

export class UserController {
  // get current logged-in user
  async getProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // user id comes from auth middleware
      const userId = req.userId as string;

      const user = await userService.getUserById(userId);

      res.status(SUCCESS_RES).json(user);
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // list all users
      const users = await userService.getAllUsers();

      res.status(SUCCESS_RES).json(users);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // get one user by id
      const user = await userService.getUserById(req.params.id);

      res.status(SUCCESS_RES).json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(
    req: Request<{ id: string }, Record<string, never>, UpdateUserDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // update user by id
      const user = await userService.updateUser(req.params.id, req.body);

      res.status(SUCCESS_RES).json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(
    req: Request<Record<string, never>, Record<string, never>, UpdateUserDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // update own user profile
      const userId = req.userId as string;
      const user = await userService.updateUser(userId, req.body);

      res.status(SUCCESS_RES).json(user);
    } catch (error) {
      next(error);
    }
  }

  async softDeleteUser(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // soft delete user
      const result = await userService.softDeleteUser(req.params.id);

      res.status(SUCCESS_RES).json(result);
    } catch (error) {
      next(error);
    }
  }

  async forceDeleteUser(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // hard delete user
      const result = await userService.forceDeleteUser(req.params.id);

      res.status(SUCCESS_RES).json(result);
    } catch (error) {
      next(error);
    }
  }

  async restoreUser(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // restore soft-deleted user
      const user = await userService.restoreUser(req.params.id);

      res.status(SUCCESS_RES).json(user);
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
