import { NextResponse } from "next/server";
import { getInvitePreviewByToken } from "@/server/services/invites";

type InviteRouteProps = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, { params }: InviteRouteProps) {
  try {
    const { token } = await params;
    const preview = await getInvitePreviewByToken(token);

    if (!preview) {
      return NextResponse.json({ error: "Invitacion no encontrada." }, { status: 404 });
    }

    if (preview.isExpired) {
      return NextResponse.json({ error: "Invitacion expirada." }, { status: 410 });
    }

    return NextResponse.json({ invite: preview });
  } catch (error) {
    console.error("Invite lookup error", error);
    return NextResponse.json({ error: "No se pudo obtener la invitacion." }, { status: 500 });
  }
}
