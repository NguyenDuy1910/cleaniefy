export interface PortfolioItem {
  id: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  caption?: string | null;
  sortOrder: number;
}
