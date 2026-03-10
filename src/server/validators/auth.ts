import { z } from "zod";

const optionalLocationField = z
  .string()
  .trim()
  .max(80, "El valor no puede superar 80 caracteres")
  .optional();

export const registerSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio").max(80),
  email: z.string().trim().email("Correo invalido").max(180),
  password: z
    .string()
    .min(8, "La contrasena debe tener al menos 8 caracteres")
    .max(128, "La contrasena no puede superar 128 caracteres"),
  country: optionalLocationField,
  city: optionalLocationField,
});

export const loginSchema = z.object({
  email: z.string().trim().email("Correo invalido"),
  password: z.string().min(1, "La contrasena es obligatoria"),
});