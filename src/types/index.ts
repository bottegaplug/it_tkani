export interface PostTranslation {
  title: string;
  description: string;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  images: string[];
  videos: string[];
  tags: string[];
  categories: string[];
  is_new: boolean;
  is_discounted?: boolean;
  price: string;
  created_at: string;
  sku?: string;
  stock_meters?: number | null;
  translations?: {
    en?: PostTranslation;
    cs?: PostTranslation;
  };
}

export interface Tag {
  name: string;
  count: number;
}
