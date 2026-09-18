import { NextResponse } from "next/server";
import { createPublicBooking } from "@/features/booking/service";
import { errorMessage, errorStatus } from "@/lib/errors";

type Context = { params: Promise<{ partnerSlug: string }> };

export async function POST(request: Request, { params }: Context) {
  try {
    const { partnerSlug } = await params;
    const booking = await createPublicBooking(partnerSlug, await request.json());
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Public booking creation failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: errorStatus(error) });
  }
}
