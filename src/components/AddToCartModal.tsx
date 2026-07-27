"use client";

import { useState, useEffect } from "react";
import type { Post } from "@/types";
import { useLang } from "@/context/LanguageContext";
import { metersToFtHint } from "@/lib/units";

interface AddToCartModalProps {
  post: Post;
  onAdd: (quantity: number) => void;
  onClose: () => void;
}

const QTY_REGEX = /^\d*\.?\d{0,1}$/;

export default function AddToCartModal({ post, onAdd, onClose }: AddToCartModalProps) {
  const { lang, t } = useLang();
  const [qty, setQty] = useState("");
  const [error, setError] = useState("");

  const displayTitle = (lang !== "ru" && post.translations?.[lang]?.title) || post.title;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const stockDisplay = post.stock_meters != null
    ? `${post.stock_meters} ${t.metersUnit}`
    : null;

  const handleChange = (val: string) => {
    if (QTY_REGEX.test(val)) {
      setQty(val);
      setError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(qty);
    if (!qty || isNaN(num) || num <= 0) {
      setError(t.enterPositiveNumber);
      return;
    }
    if (post.stock_meters != null && num > post.stock_meters) {
      setError(`${t.maxAvailable}: ${post.stock_meters} ${t.metersUnit}`);
      return;
    }
    onAdd(num);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 modal-overlay" />
      <div
        className="relative w-full max-w-sm mx-4 bg-white modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e8e0d8]">
          <h3 className="font-heading text-xl font-semibold text-[#2c2825]">{t.addToCart}</h3>
          <button
            onClick={onClose}
            className="p-1 text-[#8a8178] hover:text-[#2c2825] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Post info */}
          <div className="flex gap-3 mb-5">
            {post.images?.[0] && (
              <img
                src={post.images[0]}
                alt={displayTitle}
                className="w-16 h-16 object-cover bg-[#f5f0eb] shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#2c2825] truncate">{displayTitle}</p>
              {post.sku && (
                <p className="text-xs text-[#8a8178] mt-0.5">SKU: {post.sku}</p>
              )}
              {post.price && (
                <p className="text-sm font-heading text-[#2c2825] mt-0.5">{post.price}</p>
              )}
              {stockDisplay && (
                <p className="text-xs text-[#8a8178] mt-0.5">{stockDisplay} {t.inStock}</p>
              )}
              {post.stock_meters === 0 && (
                <p className="text-xs text-red-500 mt-0.5">{t.outOfStock}</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="block text-sm text-[#2c2825] mb-1.5">{t.quantityMeters}</label>
            <input
              type="text"
              inputMode="decimal"
              value={qty}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="1.5"
              autoFocus
              className="w-full py-3 px-4 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] placeholder-[#8a8178] focus:outline-none focus:border-[#8a8178] mb-1"
            />
            {lang === "en" && qty && !isNaN(parseFloat(qty)) && parseFloat(qty) > 0 && (
              <p className="text-xs text-[#8a8178] mb-1">{metersToFtHint(parseFloat(qty))}</p>
            )}
            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
            {!error && <div className="mb-3" />}

            <button
              type="submit"
              className="w-full py-3 bg-[#2c2825] text-white font-heading text-base tracking-wide hover:bg-[#3d3632] transition-colors"
            >
              {t.addToCart}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
