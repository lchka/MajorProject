import { NextFunction, Request, Response } from "express";
import { EvaluationContextService } from "../services/evaluationContext.service.js";
import {
	CreateEvaluationContextDto,
	EvaluateProductRequestDto,
	UpdateEvaluationContextDto,
} from "../types/evaluationContext.dto.js";
import { Permission, hasPermission } from "../types/permissions.dto.js";
import { CREATED_SUCCESS, SUCCESS_RES } from "../utils/HttpError.js";

// handles evaluation context logic through the service layer
const evaluationContextService = new EvaluationContextService();

export class EvaluationContextController {

	// creates a new evaluation context based on user input
	async createEvaluationContext(
		req: Request<Record<string, never>, Record<string, never>, CreateEvaluationContextDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const context = await evaluationContextService.createEvaluationContext(req.body);
			res.status(CREATED_SUCCESS).json(context);
		} catch (error) {
			next(error);
		}
	}

	// runs evaluation logic on a product using the provided data
	async evaluateProduct(
		req: Request<Record<string, never>, Record<string, never>, EvaluateProductRequestDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const result = await evaluationContextService.evaluateProduct(req.body);
			res.status(CREATED_SUCCESS).json(result);
		} catch (error) {
			next(error);
		}
	}

	// gets all evaluation contexts, or just the user’s ones depending on permissions
	async getAllEvaluationContexts(
		_req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userRole = _req.user?.role?.name;
			const userId = _req.userId ?? _req.user?.id;

			const canViewAll = userRole
				? hasPermission(userRole, Permission.PROFILE_VIEW_ALL)
				: false;

			const contexts = canViewAll
				? await evaluationContextService.getAllEvaluationContexts()
				: userId
					? await evaluationContextService.getEvaluationContextsForUser(userId)
					: [];

			res.status(SUCCESS_RES).json(contexts);
		} catch (error) {
			next(error);
		}
	}

	// gets a single evaluation context by id
	async getEvaluationContextById(
		req: Request<{ id: string }>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const context = await evaluationContextService.getEvaluationContextById(req.params.id);
			res.status(SUCCESS_RES).json(context);
		} catch (error) {
			next(error);
		}
	}

	// gets all contexts linked to a specific profile
	async getEvaluationContextsByProfileId(
		req: Request<{ profileId: string }>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const contexts = await evaluationContextService.getEvaluationContextsByProfileId(
				req.params.profileId,
			);
			res.status(SUCCESS_RES).json(contexts);
		} catch (error) {
			next(error);
		}
	}

	// gets contexts for a specific product, filtered by user if needed
	async getEvaluationContextsByProductId(
		req: Request<{ productId: string }>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userRole = req.user?.role?.name;
			const userId = req.userId ?? req.user?.id;

			const canViewAll = userRole
				? hasPermission(userRole, Permission.PROFILE_VIEW_ALL)
				: false;

			const contexts = canViewAll
				? await evaluationContextService.getEvaluationContextsByProductId(req.params.productId)
				: userId
					? await evaluationContextService.getEvaluationContextsByProductIdForUser(
							userId,
							req.params.productId,
						)
					: [];

			res.status(SUCCESS_RES).json(contexts);
		} catch (error) {
			next(error);
		}
	}

	// gets all contexts for the currently logged in user
	async getEvaluationContextsForUser(
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.userId ?? req.user?.id;

			if (!userId) {
				res.status(401).json({ message: "Unauthorized" });
				return;
			}

			const contexts = await evaluationContextService.getEvaluationContextsForUser(userId);
			res.status(SUCCESS_RES).json(contexts);
		} catch (error) {
			next(error);
		}
	}

	// updates an existing evaluation context
	async updateEvaluationContext(
		req: Request<{ id: string }, Record<string, never>, UpdateEvaluationContextDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const updated = await evaluationContextService.updateEvaluationContext(
				req.params.id,
				req.body,
			);
			res.status(SUCCESS_RES).json(updated);
		} catch (error) {
			next(error);
		}
	}

	// re-runs the evaluation logic for an existing context
	async reevaluateEvaluationContext(
		req: Request<{ id: string }>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const updated = await evaluationContextService.reevaluateEvaluationContext(req.params.id);
			res.status(SUCCESS_RES).json(updated);
		} catch (error) {
			next(error);
		}
	}

	// deletes an evaluation context
	async deleteEvaluationContext(
		req: Request<{ id: string }>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const result = await evaluationContextService.deleteEvaluationContext(req.params.id);
			res.status(SUCCESS_RES).json(result);
		} catch (error) {
			next(error);
		}
	}
}

export default new EvaluationContextController();