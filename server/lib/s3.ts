import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { Express } from "express";
import crypto from "node:crypto";
import path from "node:path";
// Utility functions for handling file uploads to Amazon S3, including building S3 object keys, uploading profile and product images, and generating public URLs for uploaded files, with configuration based on environment variables and error handling for missing configurations
const awsRegion = process.env.AWS_REGION ?? "eu-west-1";
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const awsS3Bucket = process.env.AWS_S3_BUCKET;

const missingConfig: string[] = [];
if (!awsAccessKeyId) missingConfig.push("AWS_ACCESS_KEY_ID");
if (!awsSecretAccessKey) missingConfig.push("AWS_SECRET_ACCESS_KEY");
if (!awsS3Bucket) missingConfig.push("AWS_S3_BUCKET");
// Log a warning if any required S3 configuration is missing, and disable S3 uploads in that case
if (missingConfig.length) {
    console.warn(
        `S3 uploads are disabled because the following env vars are missing: ${missingConfig.join(", ")}`,
    );
}

const isS3Configured = missingConfig.length === 0;
// Initialize the S3 client if all required configurations are present, otherwise set it to undefined to prevent usage
const s3Client = isS3Configured
    ? new S3Client({
          region: awsRegion,
          credentials: {
              accessKeyId: awsAccessKeyId!,
              secretAccessKey: awsSecretAccessKey!,
          },
      })
    : undefined;
// Mapping of common image MIME types to file extensions for consistent key generation when uploading files to S3
const MIME_EXTENSION_MAP: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
};
//  Utility function to sanitize file names by removing unwanted characters and normalizing the format for safe usage in S3 object keys
const sanitizeFileName = (name: string): string => {
    return name
        .trim()
        .replace(/[^a-zA-Z0-9.\-]/g, "-")
        .replace(/-+/g, "-")
        .toLowerCase();
};
// Helper function to determine the appropriate file extension based on the MIME type of the uploaded file, with a fallback to using the original file extension if the MIME type is not recognized
const resolveExtension = (mimeType: string, originalName: string): string => {
    if (MIME_EXTENSION_MAP[mimeType]) {
        return MIME_EXTENSION_MAP[mimeType];
    }

    const ext = path.extname(originalName);
    return ext || ".jpg";
};
// Function to build a unique S3 object key for profile images, incorporating the user ID, a timestamp, a random UUID, and a sanitized version of the original file name to ensure uniqueness and organization within the S3 bucket
export const buildProfileImageKey = (userId: string, file: Express.Multer.File): string => {
    const extension = resolveExtension(file.mimetype, file.originalname);
    const baseName = sanitizeFileName(path.basename(file.originalname, path.extname(file.originalname)));
    const uniqueSuffix = crypto.randomUUID();

    return `profile/${userId}/${Date.now()}-${uniqueSuffix}-${baseName}${extension}`;
};
// Function to build a unique S3 object key for product images, following a similar pattern to profile images but organized under a "product" prefix in the S3 bucket for better categorization and management of uploaded product images
export const buildProductImageKey = (userId: string, file: Express.Multer.File): string => {
    const extension = resolveExtension(file.mimetype, file.originalname);
    const baseName = sanitizeFileName(path.basename(file.originalname, path.extname(file.originalname)));
    const uniqueSuffix = crypto.randomUUID();

    return `product/${userId}/${Date.now()}-${uniqueSuffix}-${baseName}${extension}`;
};
// Function to build a standardized S3 object key for official product images, using a consistent naming convention that includes the product ID and a fixed file name to allow for easy retrieval and management of official product images within the S3 bucket
export const buildOfficialProductImageKey = (productId: string): string => {
    return `products/${productId}/official.jpg`;
};
//  Utility function to generate a public URL for an S3 object based on the configured bucket and region, allowing for easy access to uploaded files via their S3 URLs, with error handling for missing bucket configuration
export const getPublicS3Url = (key: string): string => {
    if (!awsS3Bucket) {
        throw new Error("S3 bucket is not configured");
    }
    return `https://${awsS3Bucket}.s3.${awsRegion}.amazonaws.com/${key}`;
};
// Function to upload a profile image file to S3, using the generated S3 client and bucket configuration, and returning the public URL of the uploaded image for use in the application, with error handling for missing authentication and configuration
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
// Function to upload a product image file to S3, following the same process as profile image uploads but using the product-specific key generation function, and returning the public URL of the uploaded product image for use in the application, with error handling for missing authentication and configuration
export const uploadProductImageToS3 = async (userId: string, file: Express.Multer.File): Promise<string> => {
    if (!s3Client || !awsS3Bucket) {
        throw new Error("S3 uploads are not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET.");
    }
    const key = buildProductImageKey(userId, file);

    const command = new PutObjectCommand({
        Bucket: awsS3Bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
    });

    await s3Client.send(command);
    return getPublicS3Url(key);
};
// Export the S3 client and bucket name for use in other parts of the application, allowing for direct access to the S3 client for more advanced operations if needed, while also providing the bucket name for reference
export const uploadBufferToS3 = async (params: {
    key: string;
    buffer: Buffer;
    contentType: string;
}): Promise<string> => {
    if (!s3Client || !awsS3Bucket) {
        throw new Error("S3 uploads are not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET.");
    }

    const command = new PutObjectCommand({
        Bucket: awsS3Bucket,
        Key: params.key,
        Body: params.buffer,
        ContentType: params.contentType,
    });

    await s3Client.send(command);
    return getPublicS3Url(params.key);
};
