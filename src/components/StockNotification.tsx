"use client";

import { useCart } from "@/context/CartContext";
import { useLang } from "@/context/LanguageContext";

export default function StockNotification() {
  const { hasStockIssue, stockIssues, dismissStockIssue, openCart } = useCart();
  const { t } = useLang();

  if (!hasStockIssue) return null;

  return (
    <div className="fixed top-4 right-4 z-[80] w-80 bg-white border-l-4 border-red-500 shadow-lg">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-red-500 shrink-0 mt-0.5"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p className="text-sm font-medium text-[#2c2825]">{t.stockIssueTitle}</p>
          </div>
          <button
            onClick={dismissStockIssue}
            className="text-[#8a8178] hover:text-[#2c2825] transition-colors shrink-0"
            aria-label="Закрыть"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-[#8a8178] mt-1 mb-2">{t.stockIssueText}</p>

        <ul className="space-y-0.5 mb-3">
          {stockIssues.map((issue) => (
            <li key={issue.postId} className="text-xs text-red-600">
              • {issue.title}
            </li>
          ))}
        </ul>

        <button
          onClick={() => {
            openCart();
            dismissStockIssue();
          }}
          className="text-xs text-[#2c2825] underline underline-offset-2 hover:text-red-600 transition-colors"
        >
          {t.goToCartLink}
        </button>
      </div>
    </div>
  );
}
