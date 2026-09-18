import { revalidatePath } from "next/cache";

export function revalidatePartnerSite(slug: string) {
  revalidatePath(`/${slug}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/page");
  revalidatePath("/dashboard/bookings");
}
