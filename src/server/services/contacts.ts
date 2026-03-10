export type RawContactInput = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type NormalizedContact = {
  name: string;
  email: string | null;
  phone: string | null;
  fingerprint: string;
};

export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const normalized = phone.replace(/[^\d+]/g, "");
  return normalized.length > 0 ? normalized : null;
}

export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function createFallbackName(inputName: string | null | undefined): string {
  const cleaned = (inputName ?? "").trim();
  return cleaned.length > 0 ? cleaned : "Contacto sin nombre";
}

function createFingerprint(email: string | null, phone: string | null, name: string): string {
  if (email) return `email:${email}`;
  if (phone) return `phone:${phone}`;
  return `name:${name.toLowerCase().replace(/\s+/g, "-")}`;
}

export function normalizeContactsBatch(rawContacts: RawContactInput[]): NormalizedContact[] {
  const dedupe = new Map<string, NormalizedContact>();

  for (const raw of rawContacts) {
    const name = createFallbackName(raw.name);
    const email = normalizeEmail(raw.email);
    const phone = normalizePhone(raw.phone);
    const fingerprint = createFingerprint(email, phone, name);

    if (!dedupe.has(fingerprint)) {
      dedupe.set(fingerprint, { name, email, phone, fingerprint });
    }
  }

  return [...dedupe.values()];
}
