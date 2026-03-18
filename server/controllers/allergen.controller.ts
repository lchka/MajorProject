import { Request, Response, NextFunction } from "express";
import allergenService from "../services/allergen.service.js";
import { CreateAllergenDto, UpdateAllergenDto } from "../types/allergen.dto.js";

export class AllergenController {
    async createAllergen(
        req: Request<Record<string, never>, Record<string, never>, CreateAllergenDto>,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const allergen = await allergenService.createAllergen(req.body);
            res.status(201).json(allergen);
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
            const allergens = await allergenService.getAllAllergens();
            res.status(200).json(allergens);
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
            const allergen = await allergenService.getAllergenById(req.params.id);
            res.status(200).json(allergen);
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
            const allergen = await allergenService.updateAllergen(req.params.id, req.body);
            res.status(200).json(allergen);
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
            const result = await allergenService.deleteAllergen(req.params.id);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export default new AllergenController();