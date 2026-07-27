"use client";

import { useState } from "react";
import { useLang } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import type { Lang } from "@/lib/i18n";

export type Tab = "catalog" | "about" | "delivery" | "payment";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onToggleSidebar: () => void;
}

const LANGS: { code: Lang; label: string }[] = [
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
  { code: "cs", label: "CZ" },
];

const socials = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/it_tkani/",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "Telegram",
    href: "https://t.me/it_tkani_admin",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  {
    name: "WhatsApp",
    href: "https://wa.me/79851858584",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
      </svg>
    ),
  },
];

function LangSwitcher() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex items-center gap-0">
      {LANGS.map((l, i) => (
        <span key={l.code} className="flex items-center">
          <button
            onClick={() => setLang(l.code)}
            className={`text-xs tracking-[0.15em] font-medium transition-colors ${
              lang === l.code
                ? "text-[#2c2825]"
                : "text-[#8a8178] hover:text-[#2c2825]"
            }`}
          >
            {l.label}
          </button>
          {i < LANGS.length - 1 && (
            <span className="text-[#d0c8c0] mx-1 text-xs">/</span>
          )}
        </span>
      ))}
    </div>
  );
}

function CartButton() {
  const { totalUniqueItems, hasStockIssue, openCart } = useCart();
  return (
    <button
      onClick={openCart}
      className="relative p-2.5 text-[#2c2825] border border-[#e8e0d8] hover:bg-[#f5f0eb] transition-colors"
      aria-label="Корзина"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      {totalUniqueItems > 0 && (
        <span
          className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center ${
            hasStockIssue ? "bg-red-500 animate-pulse" : "bg-[#2c2825]"
          }`}
        >
          {totalUniqueItems}
        </span>
      )}
    </button>
  );
}

export default function Header({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  onToggleSidebar,
}: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { t } = useLang();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e0d8]">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        {/* Top row */}
        <div className="flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            {/* Mobile sidebar toggle */}
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 text-[#2c2825] hover:bg-[#f5f0eb] transition-colors"
              aria-label={t.filters}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 6h14M3 10h14M3 14h14" />
              </svg>
            </button>

            <div className="flex items-center gap-3">
              <div>
                <h1 className="font-heading text-3xl lg:text-4xl font-semibold text-[#2c2825] tracking-wide">
                  IT Tkani
                </h1>
                <p className="text-xs text-[#8a8178] tracking-[0.2em] uppercase mt-0.5">
                  {t.subtitle}
                </p>
              </div>
              {/* Italian flag */}
              <svg width="22" height="48" viewBox="0 0 22 48" fill="none" className="ml-1 opacity-80">
                <path d="M4 2 C4.8 10, 3 18, 4.2 26, 3.5 34, 4.5 40, 3.8 46" stroke="#009246" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M11 2 C10.2 10, 12 18, 10.8 26, 11.5 34, 10.5 40, 11.2 46" stroke="#e8e0d8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M18 2 C17.2 10, 19 18, 17.8 26, 18.5 34, 17.5 40, 18.2 46" stroke="#CE2B37" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
          </div>

          {/* Desktop: Language switcher + Cart + Social icons */}
          <div className="hidden md:flex items-center gap-3">
            <LangSwitcher />
            <CartButton />
            <div className="flex items-center gap-1">
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  title={s.name}
                  className="p-2.5 text-[#2c2825] border border-[#e8e0d8] hover:bg-[#f5f0eb] transition-colors"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Mobile search toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden p-2 text-[#2c2825] hover:bg-[#f5f0eb] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </div>

        {/* Tabs + Search row */}
        <div className="flex items-center gap-6 pb-4">
          <nav className="flex gap-1 flex-wrap">
            {(
              [
                { key: "catalog", label: t.catalog },
                { key: "delivery", label: t.delivery },
                { key: "payment", label: t.payment },
                { key: "about", label: t.about },
              ] as { key: Tab; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onTabChange(key)}
                className={`px-4 py-2 font-heading text-base tracking-wide transition-colors ${
                  activeTab === key
                    ? "bg-[#2c2825] text-white"
                    : "text-[#8a8178] hover:text-[#2c2825] hover:bg-[#f5f0eb]"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Desktop search */}
          <div className="hidden lg:flex flex-1 max-w-md ml-auto">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full py-2 pl-10 pr-4 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] placeholder-[#8a8178] focus:outline-none focus:border-[#8a8178] transition-colors"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8178]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Mobile search dropdown */}
        {searchOpen && (
          <div className="md:hidden pb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full py-2.5 px-4 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] placeholder-[#8a8178] focus:outline-none focus:border-[#8a8178]"
              autoFocus
            />
          </div>
        )}

        {/* Mobile: Language switcher + Cart + Social icons */}
        <div className="md:hidden flex items-center gap-2 pb-3">
          <LangSwitcher />
          <CartButton />
          <div className="flex items-center gap-1">
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                title={s.name}
                className="p-2 text-[#2c2825] border border-[#e8e0d8] hover:bg-[#f5f0eb] transition-colors"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
