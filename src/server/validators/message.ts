import { z } from "zod";

export const createMessageSchema = z.object({
  recipientId: z.string().trim().min(1, "Debes indicar un destinatario"),
  body: z.string().trim().min(5, "El mensaje es demasiado corto").max(800, "Maximo 800 caracteres"),
  templateId: z.string().trim().optional(),
  inReplyToId: z.string().trim().optional(),
  scheduledFor: z.string().datetime().optional(),
});
