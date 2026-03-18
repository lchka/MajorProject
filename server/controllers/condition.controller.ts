import { Request, Response, NextFunction } from "express";
import conditionService from "../services/condition.service.js";
import { CreateConditionDto, UpdateConditionDto } from "../types/condition.dto.js";

export class ConditionController {
	async createCondition(
		req: Request<Record<string, never>, Record<string, never>, CreateConditionDto>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const condition = await conditionService.createCondition(req.body);
			res.status(201).json(condition);
		} catch (error) {
			next(error);
		}
	}

	async getAllConditions(
		_req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const conditions = await conditionService.getAllConditions();
			res.status(200).json(conditions);
		} catch (error) {
			next(error);
		}
	}

	async getConditionById(
		req: Request<{ id: string }>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const condition = await conditionService.getConditionById(req.params.id);
			res.status(200).json(condition);
		} catch (error) {
			next(error);
		}
	}

	async updateCondition(
		req: Request<{ id: string }, Record<string, never>, UpdateConditionDto>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const condition = await conditionService.updateCondition(req.params.id, req.body);
			res.status(200).json(condition);
		} catch (error) {
			next(error);
		}
	}

	async deleteCondition(
		req: Request<{ id: string }>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const result = await conditionService.deleteCondition(req.params.id);
			res.status(200).json(result);
		} catch (error) {
			next(error);
		}
	}
}

export default new ConditionController();
