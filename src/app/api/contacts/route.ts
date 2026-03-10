import { NextResponse } from "next/server";
import { getRequestSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  normalizeContactsBatch,
  normalizeEmail,
  normalizePhone,
  type RawContactInput,
} from "@/server/services/contacts";

type ImportContactsPayload = {
  contacts?: RawContactInput[];
};

export async function GET(request: Request) {
  try {
    const session = await getRequestSession(request);

    if (!session) {
      return NextResponse.json({ error: "Sesion no valida." }, { status: 401 });
    }

    const contacts = await prisma.contact.findMany({
      where: {
        ownerId: session.userId,
      },
      include: {
        linkedUser: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: [
        {
          name: "asc",
        },
      ],
      take: 500,
    });

    return NextResponse.json({ items: contacts });
  } catch (error) {
    console.error("Contacts list error", error);
    return NextResponse.json({ error: "No se pudieron cargar contactos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getRequestSession(request);

    if (!session) {
      return NextResponse.json({ error: "Sesion no valida." }, { status: 401 });
    }

    const payload = (await request.json()) as ImportContactsPayload;
    const contactsInput = Array.isArray(payload.contacts) ? payload.contacts : [];

    if (contactsInput.length === 0) {
      return NextResponse.json({ error: "No se recibieron contactos." }, { status: 400 });
    }

    const normalizedContacts = normalizeContactsBatch(contactsInput).slice(0, 500);

    const emails = normalizedContacts
      .map((contact) => normalizeEmail(contact.email))
      .filter((value): value is string => Boolean(value));

    const phones = normalizedContacts
      .map((contact) => normalizePhone(contact.phone))
      .filter((value): value is string => Boolean(value));

    const relatedUsers = emails.length > 0 || phones.length > 0
      ? await prisma.user.findMany({
          where: {
            OR: [
              emails.length > 0 ? { email: { in: emails } } : undefined,
              phones.length > 0 ? { phone: { in: phones } } : undefined,
            ].filter(Boolean) as Array<object>,
          },
          select: {
            id: true,
            email: true,
            phone: true,
          },
        })
      : [];

    const usersByEmail = new Map<string, string>();
    const usersByPhone = new Map<string, string>();

    for (const user of relatedUsers) {
      if (user.email) usersByEmail.set(user.email.toLowerCase(), user.id);
      if (user.phone) usersByPhone.set(user.phone, user.id);
    }

    const createdOrUpdated = await prisma.$transaction(
      normalizedContacts.map((contact) => {
        const linkedByEmail = contact.email ? usersByEmail.get(contact.email.toLowerCase()) : undefined;
        const linkedByPhone = contact.phone ? usersByPhone.get(contact.phone) : undefined;
        const linkedUserId = linkedByEmail ?? linkedByPhone;

        return prisma.contact.upsert({
          where: {
            ownerId_fingerprint: {
              ownerId: session.userId,
              fingerprint: contact.fingerprint,
            },
          },
          update: {
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            linkedUserId: linkedUserId && linkedUserId !== session.userId ? linkedUserId : null,
            source: "phone",
          },
          create: {
            ownerId: session.userId,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            fingerprint: contact.fingerprint,
            linkedUserId: linkedUserId && linkedUserId !== session.userId ? linkedUserId : null,
            source: "phone",
          },
        });
      }),
    );

    return NextResponse.json({
      imported: createdOrUpdated.length,
    });
  } catch (error) {
    console.error("Contacts import error", error);
    return NextResponse.json({ error: "No se pudieron importar los contactos." }, { status: 500 });
  }
}
