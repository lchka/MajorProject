import { Request, Response, NextFunction } from "express";
import { PreferenceService } from "../services/preference.service.js";
import { CreatePreferenceDto, UpdatePreferenceDto } from "../types/preference.dto.js";
import { CREATED_SUCCESS, SUCCESS_RES } from "../utils/HttpError.js";
//CHECK AUTH MIDDLARE AND PERMISSION TYPES FOR ROLE POLICIES
// controller functions for handling preference-related API requests, including creating, retrieving, updating, and deleting preferences, as well as fetching preferences associated with a specific user profile	
const preferenceService = new PreferenceService();

export class PreferenceController {
	// create a new preference
	async createPreference(
		req: Request<Record<string, never>, Record<string, never>, CreatePreferenceDto>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const preference = await preferenceService.createPreference(req.body);
			res.status(CREATED_SUCCESS).json(preference);
		} catch (error) {
			next(error);
		}
	}

	async getAllPreferences(
		_req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			// fetch full preference list
			const preferences = await preferenceService.getAllPreferences();
			res.status(SUCCESS_RES).json(preferences);
		} catch (error) {
			next(error);
		}
	}

	async getPreferenceById(
		req: Request<{ id: string }>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			// get one preference by id
			const preference = await preferenceService.getPreferenceById(req.params.id);
			res.status(SUCCESS_RES).json(preference);
		} catch (error) {
			next(error);
		}
	}

	async updatePreference(
		req: Request<{ id: string }, Record<string, never>, UpdatePreferenceDto>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			// patch preference fields
			const preference = await preferenceService.updatePreference(req.params.id, req.body);
			res.status(SUCCESS_RES).json(preference);
		} catch (error) {
			next(error);
		}
	}

	async deletePreference(
		req: Request<{ id: string }>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			// remove preference by id
			const result = await preferenceService.deletePreference(req.params.id);
			res.status(SUCCESS_RES).json(result);
		} catch (error) {
			next(error);
		}
	}

	async getProfilePreferences(
		req: Request<{ profileId: string }>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const preferences = await preferenceService.getProfilePreferences(req.params.profileId);
			res.status(SUCCESS_RES).json(preferences);
		} catch (error) {
			next(error);
		}
	}
}

export default new PreferenceController();
