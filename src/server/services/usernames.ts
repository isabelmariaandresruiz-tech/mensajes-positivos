import { prisma } from "@/lib/db/prisma";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16);
}

function randomSuffix(): string {
  return Math.floor(100 + Math.random() * 900).toString();
}

export async function generateUniqueUsername(name: string, email: string): Promise<string> {
  const nameBase = slugify(name);
  const emailBase = slugify(email.split("@")[0] ?? "");
  const base = nameBase || emailBase || `usuario${randomSuffix()}`;

  let candidate = base;
  let attempts = 0;

  while (attempts < 15) {
    const existing = await prisma.user.findUnique({ where: { username: candidate } });
    if (!existing) {
      return candidate;
    }

    candidate = `${base}${randomSuffix()}`.slice(0, 20);
    attempts += 1;
  }

  return `usuario${Date.now().toString().slice(-6)}`;
}
