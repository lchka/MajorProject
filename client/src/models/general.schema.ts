import { z } from "zod";

export const relationIdsSchema = z.array(z.string().uuid("Must be a valid UUID"));
// The relationIdsSchema defines a Zod schema for validating an array of strings, where each string must be a valid UUID. This schema can be used to ensure that any data representing relationships (such as user IDs, profile IDs, etc.) adheres to the expected format of UUIDs, providing a layer of validation and error handling for any operations that involve these IDs.
export const prefererenceEnum = z.enum([
  "Cruelty-Free",
  "Vegan",
  "Fragrance-Free",
  "Alcohol-Free",
  "Paraben-Free",
  "Sulfate-Free",
  "Hypoallergenic",
  "Non-Comedogenic",
  "Organic",
  "Eco-Friendly Packaging",
]);
export const ALLOWED_IMAGE_TYPES = ["png", "jpg", "jpeg", "webp", "svg", "gif"];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; //5mb max weight

export const ImageFileSchema = z
  .instanceof(File, { message: "Must be a valid file" })
  .refine(
    (file) =>
      ALLOWED_IMAGE_TYPES.includes(
        (file as File).type as (typeof ALLOWED_IMAGE_TYPES)[number],
      ),
    { message: "Only .jpg, .jpeg, .png, and .webp files are allowed" },
  )
  .refine((file) => (file as File).size <= MAX_IMAGE_SIZE, {
    message: `File size must be less than ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
  });

export const ImageUrlSchema = z
  .string()
  .trim()
  .url("Profile image must be a valid URL");

export const ReactNativeImageFileSchema = z.object({
  uri: z.string().trim().min(1, "Image uri is required"),
  name: z.string().trim().optional(),
  type: z.string().trim().optional(),
});

// Optional image (for updates where image isn't required)
export const OptionalImageFileSchema = z
  .union([ImageFileSchema, ImageUrlSchema, ReactNativeImageFileSchema])
  .optional();
