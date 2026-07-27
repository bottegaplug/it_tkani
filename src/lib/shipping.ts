import { EUR_TO_CZK } from "./currency";

// ══════════════════════════════════════════════════════════
//  НАСТРОЙКИ ДОСТАВКИ — меняй здесь
// ══════════════════════════════════════════════════════════

export const SHIPPING_RATES_EUR = {
  eu: 10,    // доставка по ЕС, €
  world: 25, // доставка вне ЕС, €
};

// Страны Европейского союза (коды ISO 3166-1 alpha-2)
export const EU_COUNTRY_CODES = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI",
  "FR", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT",
  "NL", "PL", "PT", "RO", "SE", "SI", "SK",
]);

/** Стоимость доставки в EUR для данной страны (код ISO). */
export function getShippingEur(countryCode: string): number {
  if (!countryCode) return 0;
  return EU_COUNTRY_CODES.has(countryCode)
    ? SHIPPING_RATES_EUR.eu
    : SHIPPING_RATES_EUR.world;
}

/** Метка зоны доставки */
export function shippingZoneLabel(countryCode: string, lang: string): string {
  const isEu = EU_COUNTRY_CODES.has(countryCode);
  if (lang === "ru") return isEu ? "Доставка по ЕС" : "Международная доставка";
  if (lang === "cs") return isEu ? "Doprava v EU" : "Mezinárodní doprava";
  return isEu ? "EU shipping" : "International shipping";
}

/** Форматирует стоимость доставки для отображения */
export function formatShippingCost(eur: number, lang: string): string {
  if (eur === 0) {
    if (lang === "ru") return "Бесплатно";
    if (lang === "cs") return "Zdarma";
    return "Free";
  }
  if (lang === "cs") {
    const czk = Math.ceil(eur * EUR_TO_CZK * 10) / 10;
    return `${czk.toLocaleString("cs-CZ")} Kč`;
  }
  return `€${eur}`;
}
