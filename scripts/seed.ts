import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  availabilityRules,
  bookingConfig,
  bookings,
  partners,
  partnerSiteConfig,
  portfolioItems,
  reviews,
  services,
  users,
} from "@/db/schema";
import { hashPassword } from "@/features/auth/service";
import { getTemplateDefinition } from "@/templates/catalog";
import type { TemplateKey } from "@/lib/types";

const demoUsers: Array<{
  email: string;
  name: string;
  slug: string;
  template: TemplateKey;
  tagline: string;
  image: string;
}> = [
  { email: "jessica@example.com", name: "Jessica's Home Care", slug: "jessica", template: "clean", tagline: "Thoughtful cleaning for busy families.", image: "/demo/jessica.png" },
  { email: "warm@example.com", name: "Warm Home Cleaning", slug: "warm-demo", template: "warm-home", tagline: "The neighborhood clean that feels like home.", image: "/demo/warm-home.png" },
  { email: "sparkle@example.com", name: "Sparkle Austin", slug: "sparkle", template: "pro", tagline: "Home & office cleaning you can count on.", image: "/demo/jessica.png" },
  { email: "fresh@example.com", name: "Fresh Start Cleaning", slug: "fresh-start", template: "fresh-start", tagline: "A clear home and a lighter week, starting here.", image: "/demo/warm-home.png" },
  { email: "signature@example.com", name: "The Signature Clean", slug: "signature-clean", template: "signature", tagline: "Thoughtful details, beautifully finished.", image: "/demo/jessica.png" },
  { email: "eco@example.com", name: "Green Room Care", slug: "green-room", template: "eco-calm", tagline: "Gentle on your home, mindful of every surface.", image: "/demo/warm-home.png" },
  { email: "move@example.com", name: "Move Ready Austin", slug: "move-ready", template: "move-ready", tagline: "The clean handoff your next chapter deserves.", image: "/demo/jessica.png" },
  { email: "bright@example.com", name: "Bright Home Co.", slug: "bright-home", template: "bright-home", tagline: "A little more light in every room.", image: "/demo/warm-home.png" },
  { email: "studio@example.com", name: "Studio Luxe Cleaning", slug: "studio-luxe", template: "studio-luxe", tagline: "Concierge-level care for spaces with standards.", image: "/demo/jessica.png" },
  { email: "neighbor@example.com", name: "Neighborly Clean", slug: "neighborly", template: "neighborly", tagline: "The local clean you can feel good about.", image: "/demo/warm-home.png" },
];

async function seed() {
  const client = db();
  for (const [index, demo] of demoUsers.entries()) {
    const [existing] = await client.select({ id: users.id }).from(users).where(eq(users.email, demo.email));
    if (existing) continue;
    await client.transaction(async (tx) => {
      const [user] = await tx.insert(users).values({
        email: demo.email,
        passwordHash: hashPassword("cleanie-demo"),
        isAdmin: index === 0,
      }).returning();
      const [partner] = await tx.insert(partners).values({
        ownerUserId: user.id,
        businessName: demo.name,
        slug: demo.slug,
        tagline: demo.tagline,
        serviceArea: "Austin, TX",
        profileImageUrl: demo.image,
        heroImageUrl: demo.image,
        about: `${demo.name} brings reliable, detail-minded care to every home. We arrive prepared, respect your space, and leave things feeling genuinely refreshed.`,
        status: "published",
        publishedAt: new Date(),
      }).returning();
      const template = getTemplateDefinition(demo.template);
      await tx.insert(partnerSiteConfig).values({
        partnerId: partner.id,
        template: demo.template,
        themeConfig: template.theme,
        sectionsConfig: { services: true, portfolio: true, reviews: true, about: true },
      });
      await tx.insert(availabilityRules).values({ partnerId: partner.id, weekdays: [1, 2, 3, 4, 5], startTime: "09:00", endTime: "17:00", slotIntervalMinutes: 60 });
      await tx.insert(bookingConfig).values({
        partnerId: partner.id,
        ctaLabel: demo.template === "warm-home" ? "See available times" : demo.template === "pro" ? "Get an available slot" : "Book a cleaning",
        requiredFields: { name: true, phone: true, email: false, address: true, notes: false },
        paymentMode: "none",
        confirmationMessage: "Your request is in. We’ll be in touch shortly.",
      });
      const baseServices = [
        { name: demo.template === "pro" ? "Residential Cleaning" : "Standard Cleaning", description: "A reliable reset for your home", priceCents: 12_000, durationMinutes: 120, sortOrder: 0 },
        { name: "Deep Cleaning", description: "The details that make a home shine", priceCents: 18_000, durationMinutes: 180, sortOrder: 1 },
      ];
      if (demo.template === "pro") baseServices.push({ name: "Office Cleaning", description: "Dependable care for productive teams", priceCents: 24_000, durationMinutes: 180, sortOrder: 2 });
      const seededServices = await tx.insert(services).values(baseServices.map((service) => ({ ...service, partnerId: partner.id, active: true }))).returning();
      await tx.insert(reviews).values([
        { partnerId: partner.id, author: "Sarah M.", rating: 5, text: "Reliable, kind and incredibly thorough.", source: "google", featured: true },
        { partnerId: partner.id, author: "Diana R.", rating: 5, text: "Easy to book and our home felt brand new.", source: "google", featured: false },
      ]);
      await tx.insert(portfolioItems).values({
        partnerId: partner.id,
        beforeImageUrl: demo.image,
        afterImageUrl: demo.image.endsWith("jessica.png") ? "/demo/warm-home.png" : "/demo/jessica.png",
        caption: "A fresh start for a busy home",
        sortOrder: 0,
      });
      if (demo.slug === "jessica") {
        const tomorrow = new Date();
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        tomorrow.setUTCHours(10, 0, 0, 0);
        await tx.insert(bookings).values({
          partnerId: partner.id,
          serviceId: seededServices[0]!.id,
          customerName: "Sarah Johnson",
          customerPhone: "(512) 555-0194",
          customerAddress: "1804 Oak Street, Austin",
          scheduledStart: tomorrow,
          scheduledEnd: new Date(tomorrow.getTime() + seededServices[0]!.durationMinutes * 60_000),
          priceCents: seededServices[0]!.priceCents,
        });
      }
    });
  }
  console.info("Demo data is ready.");
}

seed().catch((error) => {
  console.error("Could not seed demo data", error);
  process.exitCode = 1;
});
