// ══════════════════════════════════════════════════════════
//  КУРСЫ ВАЛЮТ — меняй здесь, когда курс уйдёт
//  Цены в админке задаются ТОЛЬКО в рублях за метр.
//  Английская версия показывает евро, чешская — кроны.
// ══════════════════════════════════════════════════════════

/** Сколько рублей в одном евро */
export const RUB_PER_EUR = 95;

/** Сколько рублей в одной чешской кроне */
export const RUB_PER_CZK = 4;

export type Lang = "ru" | "en" | "cs";
export type Currency = "rub" | "eur" | "czk";

/** Какая валюта показывается на каждой версии сайта */
export const CURRENCY_BY_LANG: Record<Lang, Currency> = {
  ru: "rub",
  en: "eur",
  cs: "czk",
};

/**
 * Достаёт число рублей из строки цены.
 * "950 руб/м" → 950 · "3 690 ₽" → 3690 · "1200" → 1200
 */
export function parseRub(price: string | number | null | undefined): number | null {
  if (price == null) return null;
  if (typeof price === "number") return isFinite(price) && price > 0 ? price : null;
  const match = price.replace(/\s/g, "").match(/\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const n = parseFloat(match[0].replace(",", "."));
  return isNaN(n) || n <= 0 ? null : n;
}

/** Переводит рубли в валюту языка. Округление вверх до целой единицы. */
export function convertFromRub(rub: number, lang: Lang): number {
  if (lang === "en") return Math.ceil(rub / RUB_PER_EUR);
  if (lang === "cs") return Math.ceil(rub / RUB_PER_CZK);
  return Math.round(rub);
}

/** Форматирует сумму в валюте языка: "950 ₽" · "€10" · "238 Kč" */
export function formatAmount(amount: number, lang: Lang): string {
  if (lang === "en") return `€${amount.toLocaleString("en-US")}`;
  if (lang === "cs") return `${amount.toLocaleString("cs-CZ")} Kč`;
  return `${amount.toLocaleString("ru-RU")} ₽`;
}

/** Единица измерения метра на языке сайта */
export function meterUnit(lang: Lang): string {
  return lang === "ru" ? "м" : "m";
}

/**
 * Главная функция показа цены товара.
 * Цена из базы (всегда рубли) → строка в валюте языка, за метр.
 * "950 руб/м" + "en" → "€10/m"
 */
export function priceForLang(price: string | number | null | undefined, lang: Lang): string {
  const rub = parseRub(price);
  if (rub == null) return typeof price === "string" ? price : "";
  return `${formatAmount(convertFromRub(rub, lang), lang)}/${meterUnit(lang)}`;
}

/** То же, но без суффикса «/м» — для итогов и строк заказа */
export function totalForLang(rub: number, lang: Lang): string {
  return formatAmount(convertFromRub(rub, lang), lang);
}
