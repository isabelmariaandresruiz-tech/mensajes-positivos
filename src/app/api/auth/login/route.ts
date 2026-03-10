import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { attachSessionCookie, createSessionToken } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { loginSchema } from "@/server/validators/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Credenciales invalidas." },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "Credenciales incorrectas." }, { status: 401 });
    }

    const validPassword = await verifyPassword(parsed.data.password, user.passwordHash);

    if (!validPassword) {
      return NextResponse.json({ error: "Credenciales incorrectas." }, { status: 401 });
    }

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
      },
    });

    return attachSessionCookie(response, token);
  } catch (error) {
    console.error("Login error", error);
    return NextResponse.json({ error: "No se pudo iniciar sesion." }, { status: 500 });
  }
}
