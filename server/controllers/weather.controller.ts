import { NextFunction, Request, Response } from "express";
import weatherUvService from "../services/weatherUv.service.js";
import { BAD_REQUEST, SUCCESS_RES } from "../utils/HttpError.js";

export class WeatherController {
  async getCurrentUv(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const latRaw = req.query.lat;
      const lonRaw = req.query.lon;

      const lat = typeof latRaw === "string" ? Number(latRaw) : NaN;
      const lon = typeof lonRaw === "string" ? Number(lonRaw) : NaN;

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        res.status(BAD_REQUEST).json({
          message: "Query params lat and lon are required numeric values.",
        });
        return;
      }

      const uvSnapshot = await weatherUvService.getCurrentUvByCoordinates(lat, lon);
      res.status(SUCCESS_RES).json(uvSnapshot);
    } catch (error) {
      next(error);
    }
  }
}

export default new WeatherController();
