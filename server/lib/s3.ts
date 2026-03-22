import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { Express } from "express";
import crypto from "node:crypto";
import path from "node:path";

const awsRegion = process.env.AWS_REGION ?? "eu-west-1";
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const awsS3Bucket = process.env.AWS_S3_BUCKET;

const missingConfig: string[] = [];
if (!awsAccessKeyId) missingConfig.push("AWS_ACCESS_KEY_ID");
if (!awsSecretAccessKey) missingConfig.push("AWS_SECRET_ACCESS_KEY");
if (!awsS3Bucket) missingConfig.push("AWS_S3_BUCKET");

if (missingConfig.length) {
    console.warn(
        `S3 uploads are disabled because the following env vars are missing: ${missingConfig.join(", ")}`,
    );
}

const isS3Configured = missingConfig.length === 0;

const s3Client = isS3Configured
    ? new S3Client({
          region: awsRegion,
          credentials: {
              accessKeyId: awsAccessKeyId!,
              secretAccessKey: awsSecretAccessKey!,
          },
      })
    : undefined;

const MIME_EXTENSION_MAP: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
};

const sanitizeFileName = (name: string): string => {
    return name
        .trim()
        .replace(/[^a-zA-Z0-9.\-]/g, "-")
        .replace(/-+/g, "-")
        .toLowerCase();
};

const resolveExtension = (mimeType: string, originalName: string): string => {
    if (MIME_EXTENSION_MAP[mimeType]) {
        return MIME_EXTENSION_MAP[mimeType];
    }

    const ext = path.extname(originalName);
    return ext || ".jpg";
};

export const buildProfileImageKey = (userId: string, file: Express.Multer.File): string => {
    const extension = resolveExtension(file.mimetype, file.originalname);
    const baseName = sanitizeFileName(path.basename(file.originalname, path.extname(file.originalname)));
    const uniqueSuffix = crypto.randomUUID();

    return `profile/${userId}/${Date.now()}-${uniqueSuffix}-${baseName}${extension}`;
};

export const getPublicS3Url = (key: string): string => {
    if (!awsS3Bucket) {
        throw new Error("S3 bucket is not configured");
    }
    return `https://${awsS3Bucket}.s3.${awsRegion}.amazonaws.com/${key}`;
};

export const uploadProfileImageToS3 = async (userId: string, file: Express.Multer.File): Promise<string> => {
    if (!s3Client || !awsS3Bucket) {
        throw new Error("S3 uploads are not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET.");
    }
    const key = buildProfileImageKey(userId, file);

    const command = new PutObjectCommand({
        Bucket: awsS3Bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
    });

    await s3Client.send(command);
    return getPublicS3Url(key);
};
