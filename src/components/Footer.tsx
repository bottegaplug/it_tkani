"use client";

import { useRef, useState, useCallback } from "react";
import { useLang } from "@/context/LanguageContext";
import type { Lang } from "@/lib/i18n";

export default function Footer() {
  const { t, setLang, lang } = useLang();
  const year = new Date().getFullYear();
  const clicksRef = useRef(0);
  const langRef = useRef<Lang>(lang);
  langRef.current = lang;
  const [flash, setFlash] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopyrightClick = useCallback(() => {
    clicksRef.current += 1;
    // Reset counter if no click for 3 seconds
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { clicksRef.current = 0; }, 3000);

    if (clicksRef.current >= 10) {
      clicksRef.current = 0;
      if (timerRef.current) clearTimeout(timerRef.current);
      const next: Lang = langRef.current === "ru" ? "en" : "ru";
      setLang(next);
      // Brief flash as visual feedback
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
    }
  }, [setLang]);

  return (
    <footer className="border-t border-[#e8e0d8] bg-[#faf9f7]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">

        {/* Three Italian-flag lines. White (middle) splits around the logo. */}
        <div className="py-8">

          {/* Green — full width */}
          <div className="h-[1.5px] bg-[#009246]" />

          {/* White — splits around the logo name */}
          <div className="flex items-center my-[5px]">
            <div className="flex-1 h-[1.5px] bg-[#e8e0d8]" />
            <div className="px-10 shrink-0 text-center">
              <p className="font-heading text-[22px] font-semibold tracking-[0.22em] text-[#2c2825] uppercase">
                IT Tkani
              </p>
              <p className="text-[10px] tracking-[0.18em] uppercase text-[#b8b0a8] mt-1">
                {t.subtitle}
              </p>
            </div>
            <div className="flex-1 h-[1.5px] bg-[#e8e0d8]" />
          </div>

          {/* Red — full width */}
          <div className="h-[1.5px] bg-[#CE2B37]" />

        </div>

        {/* Thin divider */}
        <div className="border-t border-[#e8e0d8]" />

        {/* Bottom row — three columns */}
        <div className="pt-5 pb-4 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-0 items-start">

          {/* Left — legal info (fill in later) */}
          <div className="text-[11px] text-[#b8b0a8] leading-[1.9] lg:text-left text-center">
            <p className="mt-1">
              <a href="mailto:info@ittkani.com" className="hover:text-[#2c2825] transition-colors duration-200">
                info@ittkani.com
              </a>
            </p>
          </div>

          {/* Center — empty spacer */}
          <div />

          {/* Right — slogan */}
          <div className="lg:text-right text-center">
            <p className="font-heading text-[20px] font-semibold text-[#2c2825] italic leading-snug tracking-wide">
              Wear exclusive.
            </p>
            <p className="font-heading text-[20px] font-semibold text-[#2c2825] italic leading-snug tracking-wide">
              Be exclusive.
            </p>
          </div>

        </div>

        {/* Copyright — full width, bottom */}
        <div className="border-t border-[#e8e0d8] py-4 text-center">
          <p className="text-[11px] text-[#c8c0b8]">
            © {year} IT Tkani.{" "}
            <span
              onPointerDown={handleCopyrightClick}
              className={`select-none transition-colors duration-150 ${flash ? "text-[#2c2825]" : ""}`}
              style={{ cursor: "default", touchAction: "manipulation" }}
            >
              All rights reserved.
            </span>
          </p>
        </div>

      </div>
    </footer>
  );
}
