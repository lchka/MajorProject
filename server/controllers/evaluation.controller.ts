import { NextFunction, Request, Response } from "express";
import evaluationContextService from "../services/evaluationContext.service.js";
import {
  CreateEvaluationContextDto,
  createEvaluationContextSchema,
} from "../types/evaluationContext.dto.js";
import { CREATED_SUCCESS, SUCCESS_RES, HttpError, NOT_FOUND } from "../utils/HttpError.js";

type ArchiveEvaluationBody = CreateEvaluationContextDto & {
  evaluationContextId?: string;
};

export class EvaluationController {
  async archiveEvaluation(
    req: Request<Record<string, never>, Record<string, never>, ArchiveEvaluationBody>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const evaluationContextId =
        typeof req.body?.evaluationContextId === "string"
          ? req.body.evaluationContextId
          : undefined;

      if (evaluationContextId) {
        try {
          const existing = await evaluationContextService.getEvaluationContextById(
            evaluationContextId,
          );
          res.status(SUCCESS_RES).json(existing);
          return;
        } catch (error) {
          if (!(error instanceof HttpError) || error.statusCode !== NOT_FOUND) {
            throw error;
          }
        }
      }

      const parsed = createEvaluationContextSchema.parse(req.body);
      const created = await evaluationContextService.createEvaluationContext(parsed);
      res.status(CREATED_SUCCESS).json(created);
    } catch (error) {
      next(error);
    }
  }
}

export default new EvaluationController();
