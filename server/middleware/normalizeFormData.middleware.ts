import { NextFunction, Request, Response } from "express";

const ARRAY_FIELDS = ["conditionIds", "allergenIds", "preferenceIds"] as const;
const BOOLEAN_FIELDS = ["isComplete", "main_profile"] as const;
// Utility function to normalize various forms of array input from form-data into consistent string arrays, supporting multiple formats such as JSON arrays, comma-separated strings, and repeated fields, while also trimming whitespace and filtering out empty values for robust handling of array inputs in Express request bodies.
const toStringArray = (value: unknown): string[] => {
    if (value === undefined || value === null) {
        return [];
    }

    if (typeof value === "string") {
        const trimmed = value.trim();

        // Support JSON-array payloads commonly sent as form-data strings.
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            try {
                const parsed = JSON.parse(trimmed);
                return toStringArray(parsed);
            } catch {
                // Fall through to regular string handling.
            }
        }

        // Support comma-separated ids in a single form-data field.
        if (trimmed.includes(",")) {
            return trimmed
                .split(",")
                .map((item) => item.trim())
                .filter((item) => item.length > 0);
        }
    }

    const rawValues = Array.isArray(value) ? value : [value];

    return rawValues
        .flat()
        .map((item) => (typeof item === "string" ? item.trim() : String(item)))
        .filter((item) => item.length > 0);
};
// Middleware function to normalize form-data inputs for specific fields that are expected to be arrays or booleans, transforming them into consistent formats for easier processing in route handlers, and ensuring that the request body is properly structured before reaching the controllers.
export const normalizeFormDataArrays = (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.body || typeof req.body !== "object") {
        next();
        return;
    }

    const body = req.body as Record<string, unknown>;

    for (const [key, value] of Object.entries(body)) {
        const trimmedKey = key.trim();
        if (trimmedKey !== key) {
            body[trimmedKey] = value;
            delete body[key];
        }
    }

    for (const field of ARRAY_FIELDS) {
        const bracketKey = `${field}[]`;
        const rawValue = body[bracketKey] ?? body[field];

        if (rawValue === undefined) {
            continue;
        }

        const normalizedValues = toStringArray(rawValue);
        body[field] = normalizedValues;

        if (Object.prototype.hasOwnProperty.call(body, bracketKey)) {
            delete body[bracketKey];
        }
    }

    for (const field of BOOLEAN_FIELDS) {
        const rawValue = body[field];

        if (typeof rawValue === "string") {
            const trimmed = rawValue.trim().toLowerCase();
            if (trimmed === "true") {
                body[field] = true;
            } else if (trimmed === "false") {
                body[field] = false;
            }
        }
    }

    next();
};
