import { MessageStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

const LEVEL_STEP = 120;

export type HappinessBreakdown = {
  messagePoints: number;
  readBonus: number;
  diversityBonus: number;
  repliesBonus: number;
  antiSpamPenalty: number;
  totalSent: number;
  uniquePeople: number;
  repliesReceived: number;
};

export type HappinessProgress = {
  currentLevel: number;
  currentLevelMin: number;
  nextLevelMin: number;
  progressPercent: number;
};

export type HappinessScore = {
  score: number;
  breakdown: HappinessBreakdown;
  progress: HappinessProgress;
};

export type HappinessLeaderboardScope = "global" | "country" | "city";

export type HappinessLeaderboardRow = {
  rank: number;
  userId: string;
  name: string;
  username?: string | null;
  country?: string | null;
  city?: string | null;
  score: number;
};

export type HappinessLeaderboardOptions = {
  limit?: number;
  scope?: HappinessLeaderboardScope;
  country?: string | null;
  city?: string | null;
  userId?: string;
};

export type HappinessLeaderboardResult = {
  scope: HappinessLeaderboardScope;
  country: string | null;
  city: string | null;
  totalUsers: number;
  userRank: number | null;
  items: HappinessLeaderboardRow[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getMessageTimestamp(sentAt: Date | null, createdAt: Date): Date {
  return sentAt ?? createdAt;
}

function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function normalizeBody(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeLocationValue(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return normalized;
}

function isMeaningfulMessage(body: string): boolean {
  const text = body.trim();
  const words = text.length > 0 ? text.split(/\s+/).filter(Boolean).length : 0;
  return text.length >= 25 && words >= 5;
}

function contentQualityFactor(body: string): number {
  const text = body.trim();
  const chars = text.length;
  const words = text.length > 0 ? text.split(/\s+/).filter(Boolean).length : 0;

  if (chars === 0 || words === 0) {
    return 0.05;
  }

  const charFactor = clamp(chars / 180, 0.12, 1.2);
  const wordFactor = clamp(words / 28, 0.15, 1.2);
  const punctuationBonus = /[.!?]/.test(text) ? 0.06 : 0;

  return clamp(charFactor * 0.5 + wordFactor * 0.45 + punctuationBonus, 0.08, 1.25);
}

function pairWeight(indexWithinPairDay: number): number {
  if (indexWithinPairDay <= 2) return 1;
  if (indexWithinPairDay <= 4) return 0.55;
  if (indexWithinPairDay <= 8) return 0.2;
  return 0.05;
}

function dayVolumeWeight(indexWithinDay: number): number {
  if (indexWithinDay <= 15) return 1;
  if (indexWithinDay <= 30) return 0.6;
  if (indexWithinDay <= 50) return 0.25;
  return 0.08;
}

function replyWeight(replyIndexBySameUser: number): number {
  if (replyIndexBySameUser <= 2) return 1;
  if (replyIndexBySameUser <= 5) return 0.45;
  return 0.12;
}

export async function computeHappinessForUser(userId: string): Promise<HappinessScore> {
  const sentMessages = await prisma.message.findMany({
    where: {
      senderId: userId,
      status: {
        in: [MessageStatus.SENT, MessageStatus.READ],
      },
    },
    select: {
      id: true,
      recipientId: true,
      body: true,
      status: true,
      sentAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const pairDailyCounter = new Map<string, number>();
  const dailyCounter = new Map<string, number>();
  const recipientTotals = new Map<string, number>();
  const dailyRepeatedBodies = new Map<string, number>();
  const uniqueRecipients = new Set<string>();

  let messagePoints = 0;
  let readBonus = 0;

  for (const message of sentMessages) {
    const timestamp = getMessageTimestamp(message.sentAt, message.createdAt);
    const day = toDayKey(timestamp);

    const currentDayCount = (dailyCounter.get(day) ?? 0) + 1;
    dailyCounter.set(day, currentDayCount);

    recipientTotals.set(message.recipientId, (recipientTotals.get(message.recipientId) ?? 0) + 1);

    const pairKey = `${message.recipientId}:${day}`;
    const indexWithinPairDay = (pairDailyCounter.get(pairKey) ?? 0) + 1;
    pairDailyCounter.set(pairKey, indexWithinPairDay);

    const quality = contentQualityFactor(message.body);
    const pairFactor = pairWeight(indexWithinPairDay);
    const volumeFactor = dayVolumeWeight(currentDayCount);

    messagePoints += 7 * quality * pairFactor * volumeFactor;

    if (message.status === MessageStatus.READ) {
      readBonus += 2 * Math.max(0.25, quality) * pairFactor * volumeFactor;
    }

    if (isMeaningfulMessage(message.body) && quality >= 0.3 && pairFactor >= 0.2) {
      uniqueRecipients.add(message.recipientId);
    }

    const normalizedBody = normalizeBody(message.body);
    if (normalizedBody.length > 0) {
      const repeatedBodyKey = `${day}:${normalizedBody}`;
      dailyRepeatedBodies.set(repeatedBodyKey, (dailyRepeatedBodies.get(repeatedBodyKey) ?? 0) + 1);
    }
  }

  let antiSpamPenalty = 0;

  for (const totalByDay of dailyCounter.values()) {
    if (totalByDay > 25) {
      antiSpamPenalty += (totalByDay - 25) * 2.5;
    }
    if (totalByDay > 50) {
      antiSpamPenalty += (totalByDay - 50) * 4;
    }
    if (totalByDay > 80) {
      antiSpamPenalty += (totalByDay - 80) * 6;
    }
  }

  for (const totalByRecipient of recipientTotals.values()) {
    if (totalByRecipient > 10) {
      antiSpamPenalty += (totalByRecipient - 10) * 1.3;
    }
    if (totalByRecipient > 20) {
      antiSpamPenalty += (totalByRecipient - 20) * 2.5;
    }
  }

  for (const repeatedCount of dailyRepeatedBodies.values()) {
    if (repeatedCount > 3) {
      antiSpamPenalty += (repeatedCount - 3) * 1.7;
    }
    if (repeatedCount > 8) {
      antiSpamPenalty += (repeatedCount - 8) * 3;
    }
  }

  const sentIds = sentMessages.map((message) => message.id);

  let repliesBonus = 0;
  let repliesReceived = 0;

  if (sentIds.length > 0) {
    const replies = await prisma.message.findMany({
      where: {
        recipientId: userId,
        inReplyToId: {
          in: sentIds,
        },
        status: {
          in: [MessageStatus.SENT, MessageStatus.READ],
        },
      },
      select: {
        senderId: true,
        body: true,
      },
    });

    repliesReceived = replies.length;

    const repliesByUser = new Map<string, number>();
    for (const reply of replies) {
      const replyIndex = (repliesByUser.get(reply.senderId) ?? 0) + 1;
      repliesByUser.set(reply.senderId, replyIndex);

      const quality = contentQualityFactor(reply.body);
      const qualityFactor = quality >= 0.3 ? 1 : 0.6;
      repliesBonus += 4 * replyWeight(replyIndex) * qualityFactor;
    }

    repliesBonus += repliesByUser.size * 3.5;
  }

  const diversityBonus = uniqueRecipients.size * 7 + Math.round(Math.sqrt(uniqueRecipients.size) * 4);

  const rawScore = messagePoints + readBonus + diversityBonus + repliesBonus - antiSpamPenalty;
  const score = Math.max(0, Math.round(rawScore));

  const currentLevel = Math.floor(score / LEVEL_STEP) + 1;
  const currentLevelMin = (currentLevel - 1) * LEVEL_STEP;
  const nextLevelMin = currentLevel * LEVEL_STEP;
  const progressPercent = Math.round(((score - currentLevelMin) / LEVEL_STEP) * 100);

  return {
    score,
    breakdown: {
      messagePoints: Math.round(messagePoints),
      readBonus: Math.round(readBonus),
      diversityBonus: Math.round(diversityBonus),
      repliesBonus: Math.round(repliesBonus),
      antiSpamPenalty: Math.round(antiSpamPenalty),
      totalSent: sentMessages.length,
      uniquePeople: uniqueRecipients.size,
      repliesReceived,
    },
    progress: {
      currentLevel,
      currentLevelMin,
      nextLevelMin,
      progressPercent: clamp(progressPercent, 0, 100),
    },
  };
}

export async function getHappinessLeaderboard(
  options: HappinessLeaderboardOptions = {},
): Promise<HappinessLeaderboardResult> {
  const scope = options.scope ?? "global";
  const limit = clamp(options.limit ?? 10, 3, 25);
  const normalizedCountry = normalizeLocationValue(options.country);
  const normalizedCity = normalizeLocationValue(options.city);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      country: true,
      city: true,
    },
  });

  const scopedUsers = users.filter((user) => {
    if (scope === "global") {
      return true;
    }

    if (scope === "country") {
      if (!normalizedCountry) {
        return false;
      }

      return normalizeLocationValue(user.country) === normalizedCountry;
    }

    if (!normalizedCity) {
      return false;
    }

    const cityMatches = normalizeLocationValue(user.city) === normalizedCity;
    if (!cityMatches) {
      return false;
    }

    if (!normalizedCountry) {
      return true;
    }

    return normalizeLocationValue(user.country) === normalizedCountry;
  });

  const scored = await Promise.all(
    scopedUsers.map(async (user) => {
      const result = await computeHappinessForUser(user.id);
      return {
        userId: user.id,
        name: user.name,
        username: user.username,
        country: user.country,
        city: user.city,
        score: result.score,
      };
    }),
  );

  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });

  const ranked = scored.map((user, index) => ({
    rank: index + 1,
    ...user,
  }));

  const userRank = options.userId ? (ranked.find((item) => item.userId === options.userId)?.rank ?? null) : null;

  return {
    scope,
    country: options.country?.trim() || null,
    city: options.city?.trim() || null,
    totalUsers: ranked.length,
    userRank,
    items: ranked.slice(0, limit),
  };
}