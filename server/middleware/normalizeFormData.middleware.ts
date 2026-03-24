import { NextFunction, Request, Response } from "express";

const ARRAY_FIELDS = ["conditionIds", "allergenIds", "preferenceIds"] as const;

const toStringArray = (value: unknown): string[] => {
    if (value === undefined || value === null) {
        return [];
    }

    const rawValues = Array.isArray(value) ? value : [value];

    return rawValues
        .flat()
        .map((item) => (typeof item === "string" ? item.trim() : String(item)))
        .filter((item) => item.length > 0);
};

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

    next();
};
