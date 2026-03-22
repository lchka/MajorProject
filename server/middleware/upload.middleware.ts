import multer from "multer";
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

export const profileImageUpload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: imageFileFilter,
}).single("profile_image");
