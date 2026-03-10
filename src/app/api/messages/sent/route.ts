import { NextResponse } from "next/server";
import { getRequestSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  try {
    const session = await getRequestSession(request);

    if (!session) {
      return NextResponse.json({ error: "Sesion no valida." }, { status: 401 });
    }

    const sent = await prisma.message.findMany({
      where: {
        senderId: session.userId,
      },
      include: {
        recipient: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return NextResponse.json({
      items: sent,
    });
  } catch (error) {
    console.error("Sent messages error", error);
    return NextResponse.json({ error: "No se pudieron cargar los mensajes enviados." }, { status: 500 });
  }
}
