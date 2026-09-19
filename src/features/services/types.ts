export interface Service {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  priceMode: "fixed" | "from";
  durationMinutes: number;
  active: boolean;
  sortOrder: number;
}
