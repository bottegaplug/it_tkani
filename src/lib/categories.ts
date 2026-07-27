export const NOVELTIES_KEY = "Новинки";

export const FABRIC_CATEGORIES = [
  "Новинки",
  "Шёлк",
  "Лён",
  "Хлопок",
  "Шерсть",
  "Кашемир",
  "Бархат",
  "Атлас",
  "Твид",
  "Органза",
  "Жаккард",
  "Тафта",
  "Замша",
  "Кружево",
  "Деним",
  "Вискоза",
  "Полиэстер",
] as const;

export type FabricCategory = (typeof FABRIC_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<FabricCategory, { en: string; cs: string }> = {
  "Новинки":    { en: "New Arrivals", cs: "Novinky" },
  "Шёлк":       { en: "Silk",         cs: "Hedvábí" },
  "Лён":        { en: "Linen",        cs: "Len" },
  "Хлопок":     { en: "Cotton",       cs: "Bavlna" },
  "Шерсть":     { en: "Wool",         cs: "Vlna" },
  "Кашемир":    { en: "Cashmere",     cs: "Kašmír" },
  "Бархат":     { en: "Velvet",       cs: "Samet" },
  "Атлас":      { en: "Satin",        cs: "Satén" },
  "Твид":       { en: "Tweed",        cs: "Tvíd" },
  "Органза":    { en: "Organza",      cs: "Organza" },
  "Жаккард":    { en: "Jacquard",     cs: "Žakár" },
  "Тафта":      { en: "Taffeta",      cs: "Taft" },
  "Замша":      { en: "Suede",        cs: "Semiš" },
  "Кружево":    { en: "Lace",         cs: "Krajka" },
  "Деним":      { en: "Denim",        cs: "Denim" },
  "Вискоза":    { en: "Viscose",      cs: "Viskóza" },
  "Полиэстер":  { en: "Polyester",    cs: "Polyester" },
};
