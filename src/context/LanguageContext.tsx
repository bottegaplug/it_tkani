"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Lang, translations } from "@/lib/i18n";
import { hasPreferenceConsent } from "@/components/CookieBanner";
import { FALLBACK_RATES, priceForLang, totalForLang, type Rates } from "@/lib/currency";

const LANG_KEY = "ittkani_lang";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (typeof translations)["ru"];
  /** Живые курсы ЦБ; до загрузки — запасные */
  rates: Rates;
  /** Цена товара за метр в валюте текущего языка */
  fmtPrice: (price: string | number | null | undefined) => string;
  /** Сумма в рублях → строка в валюте текущего языка */
  fmtTotal: (rub: number) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "ru",
  setLang: () => {},
  t: translations["ru"],
  rates: FALLBACK_RATES,
  fmtPrice: (p) => priceForLang(p, "ru"),
  fmtTotal: (r) => totalForLang(r, "ru"),
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always start with "ru" — same on server and client, no hydration mismatch
  const [lang, setLangState] = useState<Lang>("ru");
  const [rates, setRates] = useState<Rates>(FALLBACK_RATES);

  // After mount: restore saved language if consent given
  useEffect(() => {
    if (!hasPreferenceConsent()) return;
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "ru" || saved === "en" || saved === "cs") {
      setLangState(saved);
    }
  }, []);

  // Pull live rates once per page load; the API caches them server-side
  useEffect(() => {
    let cancelled = false;
    fetch("/api/rates")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.rubPerEur > 0 && d?.rubPerCzk > 0) {
          setRates({ rubPerEur: d.rubPerEur, rubPerCzk: d.rubPerCzk });
        }
      })
      .catch(() => { /* keep the fallback rates */ });
    return () => { cancelled = true; };
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (hasPreferenceConsent()) {
      localStorage.setItem(LANG_KEY, l);
    }
  }, []);

  // When consent is granted, persist current lang immediately
  useEffect(() => {
    const onConsent = () => {
      if (hasPreferenceConsent()) {
        localStorage.setItem(LANG_KEY, lang);
      }
    };
    window.addEventListener("cookie-consent-updated", onConsent);
    return () => window.removeEventListener("cookie-consent-updated", onConsent);
  }, [lang]);

  const fmtPrice = useCallback(
    (price: string | number | null | undefined) => priceForLang(price, lang, rates),
    [lang, rates]
  );
  const fmtTotal = useCallback((rub: number) => totalForLang(rub, lang, rates), [lang, rates]);

  return (
    <LanguageContext.Provider
      value={{ lang, setLang, t: translations[lang], rates, fmtPrice, fmtTotal }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
