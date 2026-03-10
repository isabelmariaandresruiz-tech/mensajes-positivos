import { NextResponse } from "next/server";
import { getRequestSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getHappinessLeaderboard, type HappinessLeaderboardScope } from "@/server/services/happiness";

function normalizeScope(value: string | null): HappinessLeaderboardScope {
  if (value === "country" || value === "city") {
    return value;
  }

  return "global";
}

function normalizeOptionalText(value: string | null): string | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  return normalized;
}

export async function GET(request: Request) {
  try {
    const session = await getRequestSession(request);

    if (!session) {
      return NextResponse.json({ error: "Sesion no valida." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedLimit = Number(searchParams.get("limit") ?? 10);
    const limit = Number.isFinite(requestedLimit) ? Math.max(3, Math.min(25, requestedLimit)) : 10;

    const scope = normalizeScope(searchParams.get("scope"));
    let country = normalizeOptionalText(searchParams.get("country"));
    let city = normalizeOptionalText(searchParams.get("city"));

    if ((scope === "country" && !country) || (scope === "city" && (!country || !city))) {
      const profile = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { country: true, city: true },
      });

      if (!country) {
        country = profile?.country ?? null;
      }

      if (!city) {
        city = profile?.city ?? null;
      }
    }

    const leaderboard = await getHappinessLeaderboard({
      limit,
      scope,
      country,
      city,
      userId: session.userId,
    });

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("Happiness leaderboard error", error);
    return NextResponse.json({ error: "No se pudo calcular el ranking de felicidad." }, { status: 500 });
  }
}