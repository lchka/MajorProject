import { Request, Response, NextFunction } from "express";
import conditionService from "../services/condition.service.js";
import { CreateConditionDto, UpdateConditionDto } from "../types/condition.dto.js";
import { CREATED_SUCCESS, SUCCESS_RES } from "../utils/HttpError.js";
//CHECK AUTH MIDDLARE AND PERMISSION TYPES FOR ROLE POLICIES
// controller functions for handling condition-related API requests, including creating, retrieving, updating, and deleting conditions, as well as fetching conditions associated with a specific user profile
export class ConditionController {
	// create a new condition
	async createCondition(
		req: Request<Record<string, never>, Record<string, never>, CreateConditionDto>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const condition = await conditionService.createCondition(req.body);
			res.status(CREATED_SUCCESS).json(condition);
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
			// fetch full condition list
			const conditions = await conditionService.getAllConditions();
			res.status(SUCCESS_RES).json(conditions);
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
			// get one condition by id
			const condition = await conditionService.getConditionById(req.params.id);
			res.status(SUCCESS_RES).json(condition);
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
			// patch condition fields
			const condition = await conditionService.updateCondition(req.params.id, req.body);
			res.status(SUCCESS_RES).json(condition);
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
			// remove condition by id
			const result = await conditionService.deleteCondition(req.params.id);
			res.status(SUCCESS_RES).json(result);
		} catch (error) {
			next(error);
		}
	}

	async getProfileConditions(
		req: Request<{ profileId: string }>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const conditions = await conditionService.getProfileConditions(req.params.profileId);
			res.status(SUCCESS_RES).json(conditions);
		} catch (error) {
			next(error);
		}
	}
}

export default new ConditionController();
