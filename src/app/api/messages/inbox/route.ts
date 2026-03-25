import { MessageStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getRequestSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  try {
    const session = await getRequestSession(request);

    if (!session) {
      return NextResponse.json({ error: "Sesion no valida." }, { status: 401 });
    }

    await prisma.message.updateMany({
      where: {
        recipientId: session.userId,
        status: MessageStatus.SENT,
      },
      data: {
        status: MessageStatus.READ,
      },
    });

    const inbox = await prisma.message.findMany({
      where: {
        recipientId: session.userId,
        status: {
          in: [MessageStatus.SENT, MessageStatus.READ],
        },
      },
      include: {
        sender: {
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
      items: inbox.map((message) => ({
        id: message.id,
        body: message.body,
        status: message.status,
        sentAt: message.sentAt,
        createdAt: message.createdAt,
        sender: message.sender,
      })),
    });
  } catch (error) {
    console.error("Inbox error", error);
    return NextResponse.json({ error: "No se pudo obtener la bandeja." }, { status: 500 });
  }
}
