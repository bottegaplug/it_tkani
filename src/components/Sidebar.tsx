"use client";

import { useLang } from "@/context/LanguageContext";
import { FABRIC_CATEGORIES, CATEGORY_LABELS, NOVELTIES_KEY, type FabricCategory } from "@/lib/categories";

interface SidebarProps {
  selectedCategories: string[];
  categoryCounts: Record<string, number>;
  onToggleCategory: (cat: string) => void;
  onReset: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  selectedCategories,
  categoryCounts,
  onToggleCategory,
  onReset,
  isOpen,
  onClose,
}: SidebarProps) {
  const { lang, t } = useLang();

  function getCategoryLabel(cat: FabricCategory): string {
    if (lang === "en") return CATEGORY_LABELS[cat].en;
    if (lang === "cs") return CATEGORY_LABELS[cat].cs;
    return cat;
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 lg:top-[140px] left-0 h-full
          w-[300px] lg:w-[260px] bg-white lg:bg-transparent
          z-50 lg:z-0 overflow-y-auto lg:overflow-visible
          transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          hidden lg:block lg:shrink-0
          ${isOpen ? "!block" : ""}
        `}
      >
        <div className="p-5 lg:p-0 pb-16">
          {/* Mobile close button */}
          <div className="flex items-center justify-between lg:hidden mb-4">
            <h3 className="font-heading text-xl font-semibold text-[#2c2825]">
              {t.filters}
            </h3>
            <button onClick={onClose} className="p-1 text-[#8a8178] hover:text-[#2c2825]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Reset button (only when something selected) */}
          {selectedCategories.length > 0 && (
            <div className="flex justify-end mb-3">
              <button
                onClick={onReset}
                className="text-xs text-[#8a8178] hover:text-[#2c2825] underline underline-offset-2 transition-colors"
              >
                {t.reset}
              </button>
            </div>
          )}

          {/* Categories list */}
          <div className="flex flex-col gap-0.5">
            {FABRIC_CATEGORIES.map((cat) => {
              const isActive = selectedCategories.includes(cat);
              const count = categoryCounts[cat === NOVELTIES_KEY ? NOVELTIES_KEY : cat] ?? 0;

              return (
                <button
                  key={cat}
                  onClick={() => onToggleCategory(cat)}
                  className={`flex items-center justify-between px-3 transition-all text-left ${
                    cat === NOVELTIES_KEY
                      ? "py-3 text-[16px] font-semibold"
                      : "py-2.5 text-[15px] font-normal"
                  } ${
                    isActive
                      ? "bg-[#2c2825] text-white"
                      : "text-[#2c2825] hover:bg-[#f5f0eb] hover:translate-x-1"
                  }`}
                >
                  <span>{getCategoryLabel(cat as FabricCategory)}</span>
                  {count > 0 && (
                    <span className={`text-xs tabular-nums ${isActive ? "text-white/70" : "text-[#8a8178]"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
