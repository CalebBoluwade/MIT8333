import { z } from "zod";
import { PRIORITIES, STATUSES, ROLE_NAMES } from "@/db/schema";

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(80),
    email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
    password: passwordSchema,
    confirmPassword: z.string(),
    role: z.enum(["student", "staff"]).default("student"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  password: z.string().min(1, "Enter your password"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const createRequestSchema = z.object({
  title: z.string().trim().min(5, "Give the problem a short title (5+ characters)").max(120),
  description: z.string().trim().min(10, "Describe the problem in a sentence or two").max(2000),
  location: z.string().trim().min(2, "Say where the problem is").max(120),
  categoryId: z.number().int().positive("Choose a category"),
  priority: z.enum(PRIORITIES),
});
export type CreateRequestInput = z.infer<typeof createRequestSchema>;

export const createRequestApiSchema = createRequestSchema.extend({
  categoryId: z.coerce.number().int().positive("Choose a category"),
});

export const updateRequestSchema = createRequestApiSchema.partial();

export const assignSchema = z.object({
  officerId: z.string().min(1, "Choose an officer"),
  note: z.string().trim().max(500).optional(),
});

export const statusUpdateSchema = z.object({
  status: z.enum(STATUSES),
  note: z.string().trim().max(500).optional(),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  categoryId: z.coerce.number().int().optional(),
  officerId: z.string().optional(),
});

export const updateUserSchema = z.object({
  role: z.enum(ROLE_NAMES).optional(),
  isActive: z.boolean().optional(),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: passwordSchema,
  role: z.enum(ROLE_NAMES),
});

export const MAX_UPLOAD_BYTES = 1_000_000; // 1 MB per image
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
