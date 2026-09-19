export interface PortfolioItem {
  id: string;
  serviceId?: string | null;
  beforeImageUrl: string;
  afterImageUrl: string;
  caption?: string | null;
  sortOrder: number;
}
