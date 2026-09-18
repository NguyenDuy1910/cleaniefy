export interface Service {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  durationMinutes: number;
  active: boolean;
  sortOrder: number;
}
