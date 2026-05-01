import { NextFunction, Request, Response } from "express";
import weatherUvService from "../services/weatherUv.service.js";
import { BAD_REQUEST, SUCCESS_RES } from "../utils/HttpError.js";
//CHECK AUTH MIDDLARE AND PERMISSION TYPES FOR ROLE POLICIES
// controller functions for handling weather-related API requests, specifically for fetching the current UV index based on provided latitude and longitude coordinates, with validation for query parameters and error handling
export class WeatherController {
  async getCurrentUv(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      //get users lat and long
      const latRaw = req.query.lat;
      const lonRaw = req.query.lon;

      const lat = typeof latRaw === "string" ? Number(latRaw) : NaN;
      const lon = typeof lonRaw === "string" ? Number(lonRaw) : NaN;

      //validation for lat and long
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        res.status(BAD_REQUEST).json({
          message: "Query params lat and lon are required numeric values.",
        });
        return;
      }
      //using weather service to request info
      const uvSnapshot = await weatherUvService.getCurrentUvByCoordinates(
        lat,
        lon,
      );
      res.status(SUCCESS_RES).json(uvSnapshot);
    } catch (error) {
      next(error);
    }
  }
}

export default new WeatherController();
