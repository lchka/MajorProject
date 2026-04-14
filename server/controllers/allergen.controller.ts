import { Request, Response, NextFunction } from "express";
import allergenService from "../services/allergen.service.js";
import { CreateAllergenDto, UpdateAllergenDto } from "../types/allergen.dto.js";
import { CREATED_SUCCESS, SUCCESS_RES } from "../utils/HttpError.js";

export class AllergenController {
    // create a new allergen
    async createAllergen(
        req: Request<Record<string, never>, Record<string, never>, CreateAllergenDto>,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const allergen = await allergenService.createAllergen(req.body);
            res.status(CREATED_SUCCESS).json(allergen);
        } catch (error) {
            next(error);
        }
    }

    async getAllAllergens(
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            // fetch full allergen list
            const allergens = await allergenService.getAllAllergens();
            res.status(SUCCESS_RES).json(allergens);
        } catch (error) {
            next(error);
        }
    }

    async getAllergenById(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            // get one allergen by id
            const allergen = await allergenService.getAllergenById(req.params.id);
            res.status(SUCCESS_RES).json(allergen);
        } catch (error) {
            next(error);
        }
    }

    async updateAllergen(
        req: Request<{ id: string }, Record<string, never>, UpdateAllergenDto>,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            // patch allergen fields
            const allergen = await allergenService.updateAllergen(req.params.id, req.body);
            res.status(SUCCESS_RES).json(allergen);
        } catch (error) {
            next(error);
        }
    }

    async deleteAllergen(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            // remove allergen by id
            const result = await allergenService.deleteAllergen(req.params.id);
            res.status(SUCCESS_RES).json(result);
        } catch (error) {
            next(error);
        }
    }

    async getProfileAllergens(
        req: Request<{ profileId: string }>,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const allergens = await allergenService.getProfileAllergens(req.params.profileId);
            res.status(SUCCESS_RES).json(allergens);
        } catch (error) {
            next(error);
        }
    }
}

export default new AllergenController();