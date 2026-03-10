import { NextResponse } from "next/server";
import { DeliveryStatus, MessageStatus } from "@prisma/client";
import { getRequestSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createMessageSchema } from "@/server/validators/message";

export async function POST(request: Request) {
  try {
    const session = await getRequestSession(request);

    if (!session) {
      return NextResponse.json({ error: "Sesion no valida." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos del mensaje invalidos." },
        { status: 400 },
      );
    }

    if (parsed.data.recipientId === session.userId) {
      return NextResponse.json({ error: "No puedes enviarte un mensaje a ti mismo en este flujo." }, { status: 400 });
    }

    const recipient = await prisma.user.findUnique({
      where: {
        id: parsed.data.recipientId,
      },
      select: {
        id: true,
        allowIncomingMessages: true,
      },
    });

    if (!recipient) {
      return NextResponse.json({ error: "Destinatario no encontrado." }, { status: 404 });
    }

    if (!recipient.allowIncomingMessages) {
      return NextResponse.json(
        { error: "La persona no acepta mensajes en este momento." },
        { status: 403 },
      );
    }

    const isBlocked = await prisma.blockedUser.findUnique({
      where: {
        ownerId_blockedUserId: {
          ownerId: recipient.id,
          blockedUserId: session.userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (isBlocked) {
      return NextResponse.json({ error: "No puedes enviar mensajes a esta persona." }, { status: 403 });
    }

    if (parsed.data.templateId) {
      const template = await prisma.template.findUnique({
        where: { id: parsed.data.templateId },
        select: { id: true, isActive: true },
      });

      if (!template || !template.isActive) {
        return NextResponse.json({ error: "La plantilla seleccionada no esta disponible." }, { status: 400 });
      }
    }

    if (parsed.data.inReplyToId) {
      const originalMessage = await prisma.message.findUnique({
        where: {
          id: parsed.data.inReplyToId,
        },
        select: {
          id: true,
          senderId: true,
          recipientId: true,
        },
      });

      if (!originalMessage) {
        return NextResponse.json({ error: "El mensaje original para responder no existe." }, { status: 404 });
      }

      if (originalMessage.recipientId !== session.userId) {
        return NextResponse.json(
          { error: "Solo puedes responder mensajes que hayas recibido." },
          { status: 403 },
        );
      }

      if (originalMessage.senderId !== parsed.data.recipientId) {
        return NextResponse.json(
          { error: "La respuesta debe enviarse a quien te escribio originalmente." },
          { status: 400 },
        );
      }
    }

    const now = new Date();
    let status: MessageStatus = MessageStatus.SENT;
    let sentAt: Date | null = now;
    let scheduledFor: Date | null = null;

    if (parsed.data.scheduledFor) {
      const candidateDate = new Date(parsed.data.scheduledFor);
      if (Number.isNaN(candidateDate.getTime())) {
        return NextResponse.json({ error: "Fecha de programacion no valida." }, { status: 400 });
      }

      if (candidateDate > now) {
        status = MessageStatus.SCHEDULED;
        sentAt = null;
        scheduledFor = candidateDate;
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          senderId: session.userId,
          recipientId: recipient.id,
          templateId: parsed.data.templateId,
          inReplyToId: parsed.data.inReplyToId,
          body: parsed.data.body,
          status,
          sentAt,
          scheduledFor,
        },
      });

      await tx.messageDelivery.create({
        data: {
          messageId: message.id,
          channel: "IN_APP",
          status: status === MessageStatus.SCHEDULED ? DeliveryStatus.QUEUED : DeliveryStatus.SENT,
        },
      });

      const invite = await tx.inviteLink.create({
        data: {
          token: crypto.randomUUID(),
          messageId: message.id,
          createdById: session.userId,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
        },
      });

      return { message, invite };
    });

    const origin = new URL(request.url).origin;

    return NextResponse.json(
      {
        message: {
          id: created.message.id,
          status: created.message.status,
        },
        inviteUrl: `${origin}/i/${created.invite.token}`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create message error", error);
    return NextResponse.json({ error: "No se pudo crear el mensaje." }, { status: 500 });
  }
}
