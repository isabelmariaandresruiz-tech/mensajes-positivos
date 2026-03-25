import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { attachSessionCookie, createSessionToken } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { generateUniqueUsername } from "@/server/services/usernames";
import { registerSchema } from "@/server/validators/auth";

function normalizeOptionalText(value: string | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  return normalized;
}

function normalizeOptionalPhone(value: string | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  const compact = normalized.replace(/[^\d+]/g, "");
  return compact.length > 0 ? compact : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos de registro invalidos." },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Ese correo ya esta registrado." }, { status: 409 });
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const username = await generateUniqueUsername(parsed.data.name, email);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        name: parsed.data.name.trim(),
        passwordHash,
        phone: normalizeOptionalPhone(parsed.data.phone ?? undefined),
        country: normalizeOptionalText(parsed.data.country),
        city: normalizeOptionalText(parsed.data.city),
      },
    });

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      username: user.username ?? undefined,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        country: user.country,
        city: user.city,
      },
    });

    return attachSessionCookie(response, token);
  } catch (error) {
    console.error("Register error", error);
    return NextResponse.json({ error: "No se pudo completar el registro." }, { status: 500 });
  }
}
