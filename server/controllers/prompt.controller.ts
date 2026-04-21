import { Request, Response, NextFunction } from "express";
import { PromptService } from "../services/prompt.service.js";
import { CreatePromptDto, UpdatePromptDto } from "../types/prompt.dto.js";
import { CREATED_SUCCESS, SUCCESS_RES } from "../utils/HttpError.js";

const promptService = new PromptService();
//CHECK AUTH MIDDLARE AND PERMISSION TYPES FOR ROLE POLICIES

export class promptController {
  async createPrompt(
    req: Request<Record<string, never>, Record<string, never>, CreatePromptDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const prompt = await promptService.createPrompt(req.body);
      res.status(CREATED_SUCCESS).json(prompt);
    } catch (error) {
      next(error);
    }
  }

  async getAllPrompts(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const prompts = await promptService.getAllPrompts();
      res.status(SUCCESS_RES).json(prompts);
    } catch (error) {
      next(error);
    }
  }

  async getPromptById(
    req: Request<{ id: string }>,
    res:Response,
    next:NextFunction
  ):Promise<void>{
    try{
        const prompt = await promptService.getPromptById(req.params.id);
        res.status(SUCCESS_RES).json(prompt);
    }catch(error){
        next(error)
    }
  }

     async updatePrompt(
        req: Request<{ id: string }, Record<string, never>, UpdatePromptDto>,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            // patch condition fields
            const condition = await promptService.updatePrompt(req.params.id, req.body);
            res.status(SUCCESS_RES).json(condition);
        } catch (error) {
            next(error);
        }
    }

    async deletePrompt(
      req:Request<{id:string}>,
        res:Response, 
        next:NextFunction
    ):Promise<void>{
        try{
            const result = await promptService.deletePrompt(req.params.id);
            res.status(SUCCESS_RES).json(result);
        }catch(error){
            next(error)
        }
    }
}


export default new promptController;