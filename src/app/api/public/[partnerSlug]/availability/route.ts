import { NextResponse } from "next/server";
import { getPublicAvailability } from "@/features/booking/queries";
import { PublicAvailabilityQuerySchema } from "@/features/booking/schema";
import { errorMessage, errorStatus } from "@/lib/errors";

type Context = { params: Promise<{ partnerSlug: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    const { partnerSlug } = await params;
    const url = new URL(request.url);
    const query = PublicAvailabilityQuerySchema.parse({
      date: url.searchParams.get("date"),
      serviceId: url.searchParams.get("serviceId") ?? undefined,
    });
    return NextResponse.json(await getPublicAvailability(partnerSlug, query.date, query.serviceId));
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: errorStatus(error) });
  }
}
