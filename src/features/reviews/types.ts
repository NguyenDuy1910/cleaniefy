export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  source: "google" | "manual";
  sourceUrl?: string | null;
  featured: boolean;
}
