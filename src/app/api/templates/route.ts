import { NextResponse } from "next/server";
import { getRequestSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  try {
    const session = await getRequestSession(request);

    if (!session) {
      return NextResponse.json({ error: "Sesion no valida." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = (searchParams.get("category") ?? "").trim();

    const templates = await prisma.template.findMany({
      where: {
        isActive: true,
        category: category.length > 0 ? category : undefined,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        body: true,
        category: true,
      },
      orderBy: [
        {
          category: "asc",
        },
        {
          title: "asc",
        },
      ],
      take: 300,
    });

    const categories = [...new Set(templates.map((template) => template.category))];

    return NextResponse.json({
      categories,
      items: templates,
    });
  } catch (error) {
    console.error("Templates error", error);
    return NextResponse.json({ error: "No se pudieron cargar las plantillas." }, { status: 500 });
  }
}
