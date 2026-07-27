"use client";

import { useState, useEffect } from "react";
import { useLang } from "@/context/LanguageContext";

export type CookieConsent = {
  necessary: true;
  preferences: boolean;
};

export const CONSENT_KEY = "ittkani_cookie_consent";

export function getConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function hasPreferenceConsent(): boolean {
  return getConsent()?.preferences === true;
}

const LABELS = {
  ru: {
    title: "Мы используем файлы cookie",
    text: "Необходимые cookie обеспечивают работу корзины и авторизации. Cookie предпочтений сохраняют выбранный язык между визитами.",
    necessary: "Необходимые",
    preferences: "Предпочтения",
    acceptAll: "Принять все",
    necessaryOnly: "Только необходимые",
    alwaysOn: "Всегда включены",
  },
  en: {
    title: "We use cookies",
    text: "Necessary cookies keep your cart and login working. Preference cookies remember your chosen language between visits.",
    necessary: "Necessary",
    preferences: "Preferences",
    acceptAll: "Accept all",
    necessaryOnly: "Necessary only",
    alwaysOn: "Always on",
  },
  cs: {
    title: "Používáme soubory cookie",
    text: "Nezbytné soubory cookie zajišťují fungování košíku a přihlášení. Preferenční soubory cookie si pamatují váš jazyk.",
    necessary: "Nezbytné",
    preferences: "Preference",
    acceptAll: "Přijmout vše",
    necessaryOnly: "Jen nezbytné",
    alwaysOn: "Vždy zapnuto",
  },
};

export default function CookieBanner() {
  const { lang } = useLang();
  const lbl = LABELS[lang] ?? LABELS.en;
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!getConsent()) setVisible(true);
  }, []);

  const save = (preferences: boolean) => {
    const consent: CookieConsent = { necessary: true, preferences };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    setVisible(false);
    // Dispatch event so LanguageContext can react and persist the current lang
    window.dispatchEvent(new Event("cookie-consent-updated"));
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[90] border-t border-[#e8e0d8] bg-white shadow-[0_-4px_24px_rgba(44,40,37,0.08)] banner-up">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-4">

        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Left: text */}
          <div className="flex-1 min-w-0">
            <p className="font-heading text-base font-semibold text-[#2c2825] mb-1">{lbl.title}</p>
            <p className="text-xs text-[#8a8178] leading-relaxed">{lbl.text}</p>

            {/* Expanded details */}
            {expanded && (
              <div className="mt-3 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 bg-[#f5f0eb] px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-[#2c2825]">{lbl.necessary}</span>
                    <span className="text-[10px] uppercase tracking-widest text-[#8a8178]">{lbl.alwaysOn}</span>
                  </div>
                  <p className="text-[11px] text-[#8a8178] leading-relaxed">
                    {lang === "ru" ? "Корзина, авторизация в чате, сессия администратора" :
                     lang === "cs" ? "Košík, přihlášení do chatu, relace administrátora" :
                     "Cart, chat login, admin session"}
                  </p>
                </div>
                <div className="flex-1 bg-[#f5f0eb] px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-[#2c2825]">{lbl.preferences}</span>
                  </div>
                  <p className="text-[11px] text-[#8a8178] leading-relaxed">
                    {lang === "ru" ? "Сохранение выбранного языка интерфейса" :
                     lang === "cs" ? "Uložení zvoleného jazyka rozhraní" :
                     "Saving your chosen interface language"}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-[11px] text-[#8a8178] hover:text-[#2c2825] transition-colors underline underline-offset-2"
            >
              {expanded
                ? (lang === "ru" ? "Скрыть детали" : lang === "cs" ? "Skrýt podrobnosti" : "Hide details")
                : (lang === "ru" ? "Подробнее" : lang === "cs" ? "Podrobnosti" : "More details")}
            </button>
          </div>

          {/* Right: buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => save(false)}
              className="px-5 py-2.5 text-sm text-[#2c2825] border border-[#e8e0d8] hover:bg-[#f5f0eb] transition-colors whitespace-nowrap"
            >
              {lbl.necessaryOnly}
            </button>
            <button
              onClick={() => save(true)}
              className="px-5 py-2.5 text-sm bg-[#2c2825] text-white hover:bg-[#3d3632] transition-colors whitespace-nowrap"
            >
              {lbl.acceptAll}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
