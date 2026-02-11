import { Request, Response, NextFunction } from "express";
import userService from "../services/user.service.js";
import { UpdateUserDto } from "../types/user.dto.js";

export class UserController {
  async getProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Assuming userId comes from auth middleware
      const userId = req.userId as string;
      
      const user = await userService.getUserById(userId);
      
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const users = await userService.getAllUsers();
      
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await userService.getUserById(req.params.id);
      
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(
    req: Request<{ id: string }, Record<string, never>, UpdateUserDto>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(
    req: Request<Record<string, never>, Record<string, never>, UpdateUserDto>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId as string;
      const user = await userService.updateUser(userId, req.body);
      
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async softDeleteUser(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await userService.softDeleteUser(req.params.id);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async forceDeleteUser(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await userService.forceDeleteUser(req.params.id);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async restoreUser(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await userService.restoreUser(req.params.id);
      
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
