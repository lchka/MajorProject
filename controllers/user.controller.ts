import { Request, Response, NextFunction } from "express";
import userService from "../services/user.service.js";

export class UserController {
  async getProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Assuming userId comes from auth middleware
      const userId = (req as any).userId;
      
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
}

export default new UserController();
