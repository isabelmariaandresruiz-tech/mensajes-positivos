import { prisma } from "@/lib/db/prisma";

export type InvitePreview = {
  token: string;
  senderId: string;
  senderName: string;
  senderUsername: string | null;
  messageExcerpt: string;
  createdAt: string;
  expiresAt: string | null;
  isExpired: boolean;
};

export async function getInvitePreviewByToken(token: string): Promise<InvitePreview | null> {
  const invite = await prisma.inviteLink.findUnique({
    where: { token },
    include: {
      message: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      },
    },
  });

  if (!invite) {
    return null;
  }

  const now = new Date();
  const isExpired = Boolean(invite.expiresAt && invite.expiresAt < now);

  return {
    token: invite.token,
    senderId: invite.message.sender.id,
    senderName: invite.message.sender.name,
    senderUsername: invite.message.sender.username,
    messageExcerpt:
      invite.message.body.length > 160
        ? `${invite.message.body.slice(0, 157)}...`
        : invite.message.body,
    createdAt: invite.createdAt.toISOString(),
    expiresAt: invite.expiresAt ? invite.expiresAt.toISOString() : null,
    isExpired,
  };
}