// ── Курс валют ─────────────────────────────────────────────
// Меняй EUR_TO_CZK при необходимости
export const EUR_TO_CZK = 25;

/**
 * Конвертирует строку цены в EUR → CZK для чешской версии.
 * "€150/м"  →  "3 750 Kč/м"
 * "€1 200"  →  "30 000 Kč"
 */
export function convertPriceToCzk(eurPrice: string): string {
  if (!eurPrice) return eurPrice;
  const s = eurPrice.replace(/\s/g, "");
  if (!/€|eur/i.test(s)) return eurPrice; // не евро — не трогаем

  const match = s.match(/\d+(?:[.,]\d+)?/);
  if (!match) return eurPrice;

  const eur = parseFloat(match[0].replace(",", "."));
  if (isNaN(eur)) return eurPrice;

  const czk = Math.ceil(eur * EUR_TO_CZK * 10) / 10; // округление вверх до 0.1
  const formatted = czk.toLocaleString("cs-CZ");      // "3 750" с пробелом

  // Суффикс типа "/м", "/m" — оставляем
  const suffix = eurPrice.replace(/^[^a-zа-яёA-ZА-ЯЁ€\d]*[\d.,\s]+[€a-zа-яёA-ZА-ЯЁ\s.]*/u, "")
    .replace(/€|eur/gi, "").trim();

  return `${formatted} Kč${suffix ? `/${suffix.replace(/^\//, "")}` : ""}`;
}

/**
 * Парсит числовое значение EUR из строки цены.
 * Нужно для расчёта итогов.
 */
export function parseEurAmount(price: string): number | null {
  if (!price) return null;
  const s = price.replace(/\s/g, "");
  const match = s.match(/\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const n = parseFloat(match[0].replace(",", "."));
  return isNaN(n) ? null : n;
}
