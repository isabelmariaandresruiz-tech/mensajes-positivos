import { NextResponse } from "next/server";
import { getRequestSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  try {
    const session = await getRequestSession(request);

    if (!session) {
      return NextResponse.json({ error: "Sesion no valida." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();

    if (q.length < 2) {
      return NextResponse.json({ items: [] });
    }

    const items = await prisma.user.findMany({
      where: {
        id: {
          not: session.userId,
        },
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
          { username: { contains: q } },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
      take: 20,
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("User search error", error);
    return NextResponse.json({ error: "No se pudo buscar usuarios." }, { status: 500 });
  }
}
