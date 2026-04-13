import multer from "multer";
import type { NextFunction, Request, Response } from "express";
import { BAD_REQUEST, HttpError } from "../utils/HttpError.js";

const storage = multer.memoryStorage();
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB limit keeps uploads lightweight

const ALLOWED_IMAGE_MIME_TYPES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
]);

const imageFileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
        cb(null, true);
        return;
    }

    cb(new HttpError(BAD_REQUEST, "Only image uploads are supported"));
};

const profileImageUploader = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: imageFileFilter,
}).fields([
    { name: "profile_image", maxCount: 1 },
    { name: "profileImage", maxCount: 1 },
]);

const productImageUploader = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: imageFileFilter,
}).fields([
    { name: "product_image", maxCount: 1 },
    { name: "productImage", maxCount: 1 },
]);

export const profileImageUpload = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    profileImageUploader(req, res, (error) => {
        if (error) {
            if (error instanceof multer.MulterError) {
                if (error.code === "LIMIT_FILE_SIZE") {
                    next(new HttpError(BAD_REQUEST, "Image must be smaller than 5MB"));
                    return;
                }

                next(new HttpError(BAD_REQUEST, error.message));
                return;
            }

            const message = error instanceof Error ? error.message : "Invalid multipart form data";
            if (message.toLowerCase().includes("field name missing")) {
                next(
                    new HttpError(
                        BAD_REQUEST,
                        "Invalid form-data: one field has an empty key name. Remove any checked empty row in Postman and retry.",
                    ),
                );
                return;
            }

            next(new HttpError(BAD_REQUEST, message));
            return;
        }

        const files = req.files as
            | Record<string, Express.Multer.File[]>
            | undefined;

        req.file = files?.profile_image?.[0] ?? files?.profileImage?.[0];
        next();
    });
};

export const productImageUpload = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    productImageUploader(req, res, (error) => {
        if (error) {
            if (error instanceof multer.MulterError) {
                if (error.code === "LIMIT_FILE_SIZE") {
                    next(new HttpError(BAD_REQUEST, "Image must be smaller than 5MB"));
                    return;
                }

                next(new HttpError(BAD_REQUEST, error.message));
                return;
            }

            const message = error instanceof Error ? error.message : "Invalid multipart form data";
            if (message.toLowerCase().includes("field name missing")) {
                next(
                    new HttpError(
                        BAD_REQUEST,
                        "Invalid form-data: one field has an empty key name. Remove any checked empty row in Postman and retry.",
                    ),
                );
                return;
            }

            next(new HttpError(BAD_REQUEST, message));
            return;
        }

        const files = req.files as
            | Record<string, Express.Multer.File[]>
            | undefined;

        req.file = files?.product_image?.[0] ?? files?.productImage?.[0];
        next();
    });
};
