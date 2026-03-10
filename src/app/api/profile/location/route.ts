import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const updateLocationSchema = z.object({
  country: z.string().trim().max(80).nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
});

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  return normalized;
}

export async function PATCH(request: Request) {
  try {
    const session = await getRequestSession(request);

    if (!session) {
      return NextResponse.json({ error: "Sesion no valida." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateLocationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos de ubicacion invalidos." },
        { status: 400 },
      );
    }

    const country = normalizeOptionalText(parsed.data.country);
    const city = normalizeOptionalText(parsed.data.city);

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: {
        country,
        city,
      },
      select: {
        id: true,
        country: true,
        city: true,
      },
    });

    return NextResponse.json({
      profile: updated,
      message: "Ubicacion actualizada correctamente.",
    });
  } catch (error) {
    console.error("Update location error", error);
    return NextResponse.json({ error: "No se pudo actualizar la ubicacion." }, { status: 500 });
  }
}