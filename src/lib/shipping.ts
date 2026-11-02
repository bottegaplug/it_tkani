import { totalForLang, type Lang } from "./currency";

// ══════════════════════════════════════════════════════════
//  НАСТРОЙКИ ДОСТАВКИ — меняй здесь
//  Суммы, как и цены товаров, задаются в рублях.
//  На сайте пересчитываются в валюту языка автоматически.
// ══════════════════════════════════════════════════════════

export const SHIPPING_RATES_RUB = {
  eu: 950,     // доставка по ЕС (≈ €10)
  world: 2375, // доставка вне ЕС (≈ €25)
};

// Страны Европейского союза (коды ISO 3166-1 alpha-2)
export const EU_COUNTRY_CODES = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI",
  "FR", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT",
  "NL", "PL", "PT", "RO", "SE", "SI", "SK",
]);

/** Стоимость доставки в рублях для данной страны (код ISO). */
export function getShippingRub(countryCode: string): number {
  if (!countryCode) return 0;
  return EU_COUNTRY_CODES.has(countryCode)
    ? SHIPPING_RATES_RUB.eu
    : SHIPPING_RATES_RUB.world;
}

/** Метка зоны доставки */
export function shippingZoneLabel(countryCode: string, lang: string): string {
  const isEu = EU_COUNTRY_CODES.has(countryCode);
  if (lang === "ru") return isEu ? "Доставка по ЕС" : "Международная доставка";
  if (lang === "cs") return isEu ? "Doprava v EU" : "Mezinárodní doprava";
  return isEu ? "EU shipping" : "International shipping";
}

/** Форматирует стоимость доставки в валюте языка */
export function formatShippingCost(rub: number, lang: Lang): string {
  if (rub === 0) {
    if (lang === "ru") return "Бесплатно";
    if (lang === "cs") return "Zdarma";
    return "Free";
  }
  return totalForLang(rub, lang);
}
