import { NextResponse } from "next/server";
import { getRequestSession } from "@/lib/auth/session";
import { computeHappinessForUser } from "@/server/services/happiness";

export async function GET(request: Request) {
  try {
    const session = await getRequestSession(request);

    if (!session) {
      return NextResponse.json({ error: "Sesion no valida." }, { status: 401 });
    }

    const happiness = await computeHappinessForUser(session.userId);

    return NextResponse.json(happiness);
  } catch (error) {
    console.error("Happiness me error", error);
    return NextResponse.json({ error: "No se pudo calcular tu medidor de felicidad." }, { status: 500 });
  }
}
