import { DeliveryChannel, DeliveryStatus, MessageStatus, PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

const templates = [
  {
    id: "tmpl_mind_001",
    slug: "respira-4-4",
    title: "Respira 4-4",
    category: "mindfulness-respiracion",
    body: "Haz una pausa: inhala en 4, exhala en 4. Vuelve al presente con amabilidad.",
  },
  {
    id: "tmpl_mind_002",
    slug: "ancla-cuerpo",
    title: "Ancla corporal",
    category: "mindfulness-respiracion",
    body: "Siente los pies en el suelo y afloja los hombros. Tu cuerpo te sostiene.",
  },
  {
    id: "tmpl_mind_003",
    slug: "micro-pausa",
    title: "Micro pausa consciente",
    category: "mindfulness-respiracion",
    body: "Un minuto de silencio y respiracion puede cambiar todo tu estado.",
  },
  {
    id: "tmpl_mind_004",
    slug: "aqui-y-ahora",
    title: "Aqui y ahora",
    category: "mindfulness-respiracion",
    body: "No hace falta resolverlo todo hoy. Solo da el siguiente paso con calma.",
  },
  {
    id: "tmpl_animo_001",
    slug: "vas-bien",
    title: "Vas bien",
    category: "animo-diario",
    body: "Aunque no lo veas ahora, estas avanzando. Tu esfuerzo cuenta.",
  },
  {
    id: "tmpl_animo_002",
    slug: "energia-suave",
    title: "Energia suave",
    category: "animo-diario",
    body: "Hoy no necesitas perfeccion, necesitas constancia amable.",
  },
  {
    id: "tmpl_animo_003",
    slug: "paso-pequeno",
    title: "Paso pequeno",
    category: "animo-diario",
    body: "Un paso pequeno tambien es progreso. Hazlo facil y hazlo hoy.",
  },
  {
    id: "tmpl_animo_004",
    slug: "reencuadre",
    title: "Reencuadre positivo",
    category: "animo-diario",
    body: "No es un retroceso: es informacion para ajustar y seguir.",
  },
  {
    id: "tmpl_ref_001",
    slug: "confio-en-ti",
    title: "Confio en ti",
    category: "refuerzo-emocional",
    body: "Confio en tu capacidad para atravesar esto. No estas sola/o.",
  },
  {
    id: "tmpl_ref_002",
    slug: "eres-valioso",
    title: "Eres valioso",
    category: "refuerzo-emocional",
    body: "Tu valor no depende de un resultado. Ya eres suficiente.",
  },
  {
    id: "tmpl_ref_003",
    slug: "fortaleza-serena",
    title: "Fortaleza serena",
    category: "refuerzo-emocional",
    body: "Tu calma tambien es fortaleza. Hoy estas sosteniendote muy bien.",
  },
  {
    id: "tmpl_ref_004",
    slug: "te-acompano",
    title: "Te acompano",
    category: "refuerzo-emocional",
    body: "Si hoy pesa, no cargues sola/o: aqui estoy para acompanarte.",
  },
  {
    id: "tmpl_grat_001",
    slug: "gracias-por-ti",
    title: "Gracias por ti",
    category: "gratitud",
    body: "Gracias por ser como eres. Tu presencia hace bien.",
  },
  {
    id: "tmpl_grat_002",
    slug: "valoro-tu-esfuerzo",
    title: "Valoro tu esfuerzo",
    category: "gratitud",
    body: "Quiero reconocer tu esfuerzo de estos dias. Se nota y se aprecia.",
  },
  {
    id: "tmpl_grat_003",
    slug: "detalle-bonito",
    title: "Detalle bonito",
    category: "gratitud",
    body: "Ese gesto tuyo marco la diferencia. Gracias por dar tanto.",
  },
  {
    id: "tmpl_grat_004",
    slug: "alegria-compartida",
    title: "Alegria compartida",
    category: "gratitud",
    body: "Me alegra caminar esta etapa contigo. Gracias por sumar luz.",
  },
  {
    id: "tmpl_auto_001",
    slug: "hablate-bonito",
    title: "Hablate bonito",
    category: "autocompasion",
    body: "Hoy hablare contigo como hablo con alguien a quien quiero mucho.",
  },
  {
    id: "tmpl_auto_002",
    slug: "permiso-descanso",
    title: "Permiso para descansar",
    category: "autocompasion",
    body: "Descansar tambien es avanzar. Tu cuerpo merece cuidado.",
  },
  {
    id: "tmpl_auto_003",
    slug: "error-humano",
    title: "Error humano",
    category: "autocompasion",
    body: "Equivocarte no te define. Aprender con ternura te fortalece.",
  },
  {
    id: "tmpl_auto_004",
    slug: "recomenzar",
    title: "Siempre puedes recomenzar",
    category: "autocompasion",
    body: "Cada momento te permite recomenzar. Sin culpa, con claridad.",
  },
  {
    id: "tmpl_foco_001",
    slug: "prioridad-uno",
    title: "Una prioridad",
    category: "enfoque-y-calma",
    body: "Elige una sola prioridad ahora. Menos ruido, mas avance.",
  },
  {
    id: "tmpl_foco_002",
    slug: "calma-productiva",
    title: "Calma productiva",
    category: "enfoque-y-calma",
    body: "La prisa confunde. La calma te ayuda a decidir mejor.",
  },
  {
    id: "tmpl_foco_003",
    slug: "ritmo-propio",
    title: "Ritmo propio",
    category: "enfoque-y-calma",
    body: "No compitas con nadie hoy. Tu ritmo tambien es valido.",
  },
  {
    id: "tmpl_foco_004",
    slug: "cerrar-dia",
    title: "Cerrar el dia",
    category: "enfoque-y-calma",
    body: "Cierra el dia con una respiracion profunda y agradece un avance.",
  },
];

async function seed() {
  const passwordHash = await hashPassword("Animo1234");

  const [ana, luis] = await Promise.all([
    prisma.user.upsert({
      where: { email: "ana@animocerca.local" },
      update: {
        name: "Ana",
        username: "ana",
        phone: "+34600111222",
        passwordHash,
        timezone: "Europe/Madrid",
        country: "Espana",
        city: "Madrid",
      },
      create: {
        email: "ana@animocerca.local",
        name: "Ana",
        username: "ana",
        phone: "+34600111222",
        passwordHash,
        timezone: "Europe/Madrid",
        country: "Espana",
        city: "Madrid",
      },
    }),
    prisma.user.upsert({
      where: { email: "luis@animocerca.local" },
      update: {
        name: "Luis",
        username: "luis",
        phone: "+34600333444",
        passwordHash,
        timezone: "Europe/Madrid",
        country: "Espana",
        city: "Barcelona",
      },
      create: {
        email: "luis@animocerca.local",
        name: "Luis",
        username: "luis",
        phone: "+34600333444",
        passwordHash,
        timezone: "Europe/Madrid",
        country: "Espana",
        city: "Barcelona",
      },
    }),
  ]);

  for (const template of templates) {
    await prisma.template.upsert({
      where: { id: template.id },
      update: {
        slug: template.slug,
        title: template.title,
        body: template.body,
        category: template.category,
        isActive: true,
        authorId: ana.id,
      },
      create: {
        id: template.id,
        slug: template.slug,
        title: template.title,
        body: template.body,
        category: template.category,
        isActive: true,
        authorId: ana.id,
      },
    });
  }

  const firstTemplate = await prisma.template.findFirst({
    where: {
      slug: "confio-en-ti",
    },
    select: { id: true },
  });

  const secondTemplate = await prisma.template.findFirst({
    where: {
      slug: "gracias-por-ti",
    },
    select: { id: true },
  });

  if (!firstTemplate || !secondTemplate) {
    throw new Error("No se pudieron cargar plantillas base.");
  }

  await prisma.message.upsert({
    where: { id: "msg_demo_ana_luis" },
    update: {
      senderId: ana.id,
      recipientId: luis.id,
      templateId: firstTemplate.id,
      body: "Luis, confio en ti. Respira, paso a paso, y sigue.",
      status: MessageStatus.READ,
      sentAt: new Date(),
    },
    create: {
      id: "msg_demo_ana_luis",
      senderId: ana.id,
      recipientId: luis.id,
      templateId: firstTemplate.id,
      body: "Luis, confio en ti. Respira, paso a paso, y sigue.",
      status: MessageStatus.READ,
      sentAt: new Date(),
    },
  });

  await prisma.message.upsert({
    where: { id: "msg_demo_luis_ana" },
    update: {
      senderId: luis.id,
      recipientId: ana.id,
      templateId: secondTemplate.id,
      inReplyToId: "msg_demo_ana_luis",
      body: "Ana, gracias por estar. Tu energia positiva me ayuda mucho.",
      status: MessageStatus.READ,
      sentAt: new Date(),
    },
    create: {
      id: "msg_demo_luis_ana",
      senderId: luis.id,
      recipientId: ana.id,
      templateId: secondTemplate.id,
      inReplyToId: "msg_demo_ana_luis",
      body: "Ana, gracias por estar. Tu energia positiva me ayuda mucho.",
      status: MessageStatus.READ,
      sentAt: new Date(),
    },
  });

  await prisma.messageDelivery.upsert({
    where: { id: "delivery_demo_1" },
    update: {
      messageId: "msg_demo_ana_luis",
      channel: DeliveryChannel.IN_APP,
      status: DeliveryStatus.SENT,
    },
    create: {
      id: "delivery_demo_1",
      messageId: "msg_demo_ana_luis",
      channel: DeliveryChannel.IN_APP,
      status: DeliveryStatus.SENT,
    },
  });

  await prisma.messageDelivery.upsert({
    where: { id: "delivery_demo_2" },
    update: {
      messageId: "msg_demo_luis_ana",
      channel: DeliveryChannel.IN_APP,
      status: DeliveryStatus.SENT,
    },
    create: {
      id: "delivery_demo_2",
      messageId: "msg_demo_luis_ana",
      channel: DeliveryChannel.IN_APP,
      status: DeliveryStatus.SENT,
    },
  });

  await prisma.inviteLink.upsert({
    where: { token: "demo-invite-ana-luis" },
    update: {
      messageId: "msg_demo_ana_luis",
      createdById: ana.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    },
    create: {
      token: "demo-invite-ana-luis",
      messageId: "msg_demo_ana_luis",
      createdById: ana.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    },
  });

  await prisma.contact.upsert({
    where: {
      ownerId_fingerprint: {
        ownerId: ana.id,
        fingerprint: `phone:${luis.phone}`,
      },
    },
    update: {
      name: "Luis",
      phone: luis.phone,
      email: luis.email,
      linkedUserId: luis.id,
      source: "seed",
    },
    create: {
      ownerId: ana.id,
      name: "Luis",
      phone: luis.phone,
      email: luis.email,
      fingerprint: `phone:${luis.phone}`,
      linkedUserId: luis.id,
      source: "seed",
    },
  });

  await prisma.contact.upsert({
    where: {
      ownerId_fingerprint: {
        ownerId: luis.id,
        fingerprint: `phone:${ana.phone}`,
      },
    },
    update: {
      name: "Ana",
      phone: ana.phone,
      email: ana.email,
      linkedUserId: ana.id,
      source: "seed",
    },
    create: {
      ownerId: luis.id,
      name: "Ana",
      phone: ana.phone,
      email: ana.email,
      fingerprint: `phone:${ana.phone}`,
      linkedUserId: ana.id,
      source: "seed",
    },
  });

  console.log("Seed completado.");
  console.log("Usuario 1: ana@animocerca.local / Animo1234 / @ana");
  console.log("Usuario 2: luis@animocerca.local / Animo1234 / @luis");
  console.log(`Plantillas mindfulness cargadas: ${templates.length}`);
}

seed()
  .catch((error) => {
    console.error("Error en seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
