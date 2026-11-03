// ══════════════════════════════════════════════════════════
//  ВАЛЮТЫ
//  Цены в админке задаются ТОЛЬКО в рублях за метр.
//  Английская версия показывает евро, чешская — кроны.
//
//  Курсы подтягиваются автоматически с Центробанка РФ
//  (см. /api/rates) и кэшируются на сервере.
//  Константы ниже — только запасной вариант, если ЦБ недоступен.
// ══════════════════════════════════════════════════════════

export type Lang = "ru" | "en" | "cs";
export type Currency = "rub" | "eur" | "czk";

export interface Rates {
  /** Сколько рублей в одном евро */
  rubPerEur: number;
  /** Сколько рублей в одной чешской кроне */
  rubPerCzk: number;
}

/** Запасные курсы — используются, только если ЦБ не ответил */
export const FALLBACK_RATES: Rates = {
  rubPerEur: 95,
  rubPerCzk: 4,
};

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

/** Округление вверх до десятых: 38.84 → 38.9 */
function ceilToTenth(n: number): number {
  return Math.ceil(n * 10) / 10;
}

/**
 * Переводит рубли в валюту языка, всегда округляя вверх.
 * Евро — до десятых, кроны и рубли — до целых: дробных крон в ценниках не бывает.
 */
export function convertFromRub(rub: number, lang: Lang, rates: Rates = FALLBACK_RATES): number {
  if (lang === "en") return ceilToTenth(rub / rates.rubPerEur);
  if (lang === "cs") return Math.ceil(rub / rates.rubPerCzk);
  return Math.ceil(rub);
}

/** Форматирует сумму: "950 ₽" · "€38,9" · "995 Kč" */
export function formatAmount(amount: number, lang: Lang): string {
  if (lang === "en") return `€${amount.toLocaleString("en-US", { maximumFractionDigits: 1 })}`;
  if (lang === "cs") return `${amount.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč`;
  return `${amount.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽`;
}

/** Единица измерения метра на языке сайта */
export function meterUnit(lang: Lang): string {
  return lang === "ru" ? "м" : "m";
}

/**
 * Цена товара: рубли из базы → строка в валюте языка, за метр.
 * "950 руб/м" + "en" → "€10/m"
 */
export function priceForLang(
  price: string | number | null | undefined,
  lang: Lang,
  rates: Rates = FALLBACK_RATES
): string {
  const rub = parseRub(price);
  if (rub == null) return typeof price === "string" ? price : "";
  return `${formatAmount(convertFromRub(rub, lang, rates), lang)}/${meterUnit(lang)}`;
}

/** То же, но без суффикса «/м» — для итогов и строк заказа */
export function totalForLang(rub: number, lang: Lang, rates: Rates = FALLBACK_RATES): string {
  return formatAmount(convertFromRub(rub, lang, rates), lang);
}
