"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Lang, translations } from "@/lib/i18n";
import { hasPreferenceConsent } from "@/components/CookieBanner";

const LANG_KEY = "ittkani_lang";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (typeof translations)["ru"];
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "ru",
  setLang: () => {},
  t: translations["ru"],
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always start with "ru" — same on server and client, no hydration mismatch
  const [lang, setLangState] = useState<Lang>("ru");

  // After mount: restore saved language if consent given
  useEffect(() => {
    if (!hasPreferenceConsent()) return;
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "ru" || saved === "en" || saved === "cs") {
      setLangState(saved);
    }
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

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
