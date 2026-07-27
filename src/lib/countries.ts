import type { Lang } from "@/lib/i18n";

export interface Country {
  code: string;
  dialCode: string;
  ru: string;
  en: string;
  cs: string;
}

export const COUNTRIES: Country[] = [
  { code: "RU", dialCode: "+7",   ru: "Россия",          en: "Russia",           cs: "Rusko" },
  { code: "UA", dialCode: "+380", ru: "Украина",          en: "Ukraine",          cs: "Ukrajina" },
  { code: "BY", dialCode: "+375", ru: "Беларусь",         en: "Belarus",          cs: "Bělorusko" },
  { code: "KZ", dialCode: "+7",   ru: "Казахстан",        en: "Kazakhstan",       cs: "Kazachstán" },
  { code: "CZ", dialCode: "+420", ru: "Чехия",            en: "Czech Republic",   cs: "Česká republika" },
  { code: "SK", dialCode: "+421", ru: "Словакия",         en: "Slovakia",         cs: "Slovensko" },
  { code: "DE", dialCode: "+49",  ru: "Германия",         en: "Germany",          cs: "Německo" },
  { code: "AT", dialCode: "+43",  ru: "Австрия",          en: "Austria",          cs: "Rakousko" },
  { code: "CH", dialCode: "+41",  ru: "Швейцария",        en: "Switzerland",      cs: "Švýcarsko" },
  { code: "FR", dialCode: "+33",  ru: "Франция",          en: "France",           cs: "Francie" },
  { code: "IT", dialCode: "+39",  ru: "Италия",           en: "Italy",            cs: "Itálie" },
  { code: "ES", dialCode: "+34",  ru: "Испания",          en: "Spain",            cs: "Španělsko" },
  { code: "PT", dialCode: "+351", ru: "Португалия",       en: "Portugal",         cs: "Portugalsko" },
  { code: "GB", dialCode: "+44",  ru: "Великобритания",   en: "United Kingdom",   cs: "Velká Británie" },
  { code: "IE", dialCode: "+353", ru: "Ирландия",         en: "Ireland",          cs: "Irsko" },
  { code: "NL", dialCode: "+31",  ru: "Нидерланды",       en: "Netherlands",      cs: "Nizozemsko" },
  { code: "BE", dialCode: "+32",  ru: "Бельгия",          en: "Belgium",          cs: "Belgie" },
  { code: "PL", dialCode: "+48",  ru: "Польша",           en: "Poland",           cs: "Polsko" },
  { code: "SE", dialCode: "+46",  ru: "Швеция",           en: "Sweden",           cs: "Švédsko" },
  { code: "NO", dialCode: "+47",  ru: "Норвегия",         en: "Norway",           cs: "Norsko" },
  { code: "DK", dialCode: "+45",  ru: "Дания",            en: "Denmark",          cs: "Dánsko" },
  { code: "FI", dialCode: "+358", ru: "Финляндия",        en: "Finland",          cs: "Finsko" },
  { code: "GR", dialCode: "+30",  ru: "Греция",           en: "Greece",           cs: "Řecko" },
  { code: "HR", dialCode: "+385", ru: "Хорватия",         en: "Croatia",          cs: "Chorvatsko" },
  { code: "RS", dialCode: "+381", ru: "Сербия",           en: "Serbia",           cs: "Srbsko" },
  { code: "TR", dialCode: "+90",  ru: "Турция",           en: "Turkey",           cs: "Turecko" },
  { code: "IL", dialCode: "+972", ru: "Израиль",          en: "Israel",           cs: "Izrael" },
  { code: "AE", dialCode: "+971", ru: "ОАЭ",              en: "UAE",              cs: "SAE" },
  { code: "US", dialCode: "+1",   ru: "США",              en: "USA",              cs: "USA" },
  { code: "CA", dialCode: "+1",   ru: "Канада",           en: "Canada",           cs: "Kanada" },
  { code: "AU", dialCode: "+61",  ru: "Австралия",        en: "Australia",        cs: "Austrálie" },
  { code: "CN", dialCode: "+86",  ru: "Китай",            en: "China",            cs: "Čína" },
  { code: "JP", dialCode: "+81",  ru: "Япония",           en: "Japan",            cs: "Japonsko" },
  { code: "KR", dialCode: "+82",  ru: "Южная Корея",      en: "South Korea",      cs: "Jižní Korea" },
  { code: "IN", dialCode: "+91",  ru: "Индия",            en: "India",            cs: "Indie" },
  { code: "BR", dialCode: "+55",  ru: "Бразилия",         en: "Brazil",           cs: "Brazílie" },
  { code: "MX", dialCode: "+52",  ru: "Мексика",          en: "Mexico",           cs: "Mexiko" },
  { code: "AR", dialCode: "+54",  ru: "Аргентина",        en: "Argentina",        cs: "Argentina" },
  { code: "SG", dialCode: "+65",  ru: "Сингапур",         en: "Singapore",        cs: "Singapur" },
  { code: "TH", dialCode: "+66",  ru: "Таиланд",          en: "Thailand",         cs: "Thajsko" },
];

export function getCountryLabel(country: Country, lang: Lang): string {
  if (lang === "en") return country.en;
  if (lang === "cs") return country.cs;
  return country.ru;
}

/** Strip non-digits, check 7–15 digits (ITU E.164) */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

/** Basic email validation */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}
