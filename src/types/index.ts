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
  /** Pre-discount price, shown struck through next to `price` */
  old_price?: string | null;
  created_at: string;
  sku?: string;
  /** Суммарный метраж. Если заданы cuts — это их сумма. */
  stock_meters?: number | null;
  /**
   * Отдельные отрезы одной ткани, в метрах: [3.5, 2.2].
   * Их нельзя складывать — непрерывного куска на 5.7 м не существует,
   * поэтому покупатель выбирает конкретный отрез.
   */
  cuts?: number[] | null;
  translations?: {
    en?: PostTranslation;
    cs?: PostTranslation;
  };
}

export interface Tag {
  name: string;
  count: number;
}
