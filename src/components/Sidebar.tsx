"use client";

import type { Tag } from "@/types";

interface SidebarProps {
  tags: Tag[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onReset: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  tags,
  selectedTags,
  onToggleTag,
  onReset,
  isOpen,
  onClose,
}: SidebarProps) {
  const totalTags = tags.length;

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
          fixed lg:sticky top-0 lg:top-[140px] left-0 h-full lg:h-[calc(100vh-160px)]
          w-[300px] lg:w-[280px] bg-white lg:bg-transparent
          z-50 lg:z-0 overflow-y-auto
          transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          hidden lg:block lg:shrink-0
          ${isOpen ? "!block" : ""}
        `}
      >
        <div className="p-5 lg:p-0">
          {/* Mobile close button */}
          <div className="flex items-center justify-between lg:hidden mb-4">
            <h3 className="font-heading text-xl font-semibold text-[#2c2825]">
              Фильтры
            </h3>
            <button onClick={onClose} className="p-1 text-[#8a8178] hover:text-[#2c2825]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg font-semibold text-[#2c2825]">
              Хештеги
              <span className="ml-2 text-sm font-body text-[#8a8178] font-normal">
                {totalTags}
              </span>
            </h3>
            {selectedTags.length > 0 && (
              <button
                onClick={onReset}
                className="text-xs text-[#8a8178] hover:text-[#2c2825] underline underline-offset-2 transition-colors"
              >
                Сбросить
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1">
            {tags.map((tag) => {
              const isActive = selectedTags.includes(tag.name);
              return (
                <button
                  key={tag.name}
                  onClick={() => onToggleTag(tag.name)}
                  className={`flex items-center justify-between px-3 py-2 text-sm transition-all text-left ${
                    isActive
                      ? "bg-[#2c2825] text-white"
                      : "text-[#2c2825] hover:bg-[#f5f0eb] hover:translate-x-1"
                  }`}
                >
                  <span>#{tag.name}</span>
                  <span
                    className={`text-xs ${
                      isActive ? "text-white/70" : "text-[#8a8178]"
                    }`}
                  >
                    {tag.count}
                  </span>
                </button>
              );
            })}
          </div>

          {tags.length === 0 && (
            <p className="text-sm text-[#8a8178] mt-4">
              Хештеги появятся после добавления записей
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
