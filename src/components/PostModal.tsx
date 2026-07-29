"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Post } from "@/types";
import { useLang } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useChat } from "@/context/ChatContext";
import AddToCartModal from "@/components/AddToCartModal";
import BuyNowModal from "@/components/BuyNowModal";
import { convertPriceToCzk } from "@/lib/currency";

interface PostModalProps {
  post: Post;
  onClose: () => void;
  onBuy?: () => void;
}

type MediaItem = { type: "image"; url: string } | { type: "video"; url: string };

export default function PostModal({ post, onClose }: PostModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBuyNowModal, setShowBuyNowModal] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const { lang, t } = useLang();
  const { addItem, openCart } = useCart();
  const { forwardPostToChat } = useChat();

  const displayTitle = (lang !== "ru" && post.translations?.[lang]?.title) || post.title;
  const displayDescription = (lang !== "ru" && post.translations?.[lang]?.description) || post.description;

  const media: MediaItem[] = useMemo(() => {
    const items: MediaItem[] = [];
    (post.images || []).forEach((url) => items.push({ type: "image", url }));
    (post.videos || []).forEach((url) => items.push({ type: "video", url }));
    return items;
  }, [post.images, post.videos]);

  const next = useCallback(
    () => setCurrentIndex((c) => (c + 1) % media.length),
    [media.length]
  );
  const prev = useCallback(
    () => setCurrentIndex((c) => (c - 1 + media.length) % media.length),
    [media.length]
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, prev, next]);

  const dateLocale = lang === "ru" ? "ru-RU" : lang === "cs" ? "cs-CZ" : "en-GB";

  return (
    <>
    <div className="fixed inset-0 z-50 modal-overlay" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative h-full lg:flex lg:items-center lg:justify-center overflow-y-auto">
        <div
          className="relative w-full lg:max-w-5xl lg:mx-4 lg:max-h-[90vh] flex flex-col lg:flex-row bg-white modal-content min-h-screen lg:min-h-0 lg:overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-white/90 text-[#2c2825] hover:bg-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Media carousel */}
          <div className="relative w-full lg:w-[60%] bg-[#1a1a1a] flex items-center justify-center aspect-square lg:aspect-auto lg:min-h-[500px] shrink-0">
            {media.length > 0 ? (
              <>
                {media[currentIndex].type === "video" ? (
                  <video
                    key={media[currentIndex].url}
                    src={media[currentIndex].url}
                    controls
                    className="max-w-full max-h-full lg:max-h-[80vh] object-contain"
                  />
                ) : (
                  <img
                    src={media[currentIndex].url}
                    alt={`${post.title} - ${currentIndex + 1}`}
                    className="max-w-full max-h-full lg:max-h-[80vh] object-contain"
                  />
                )}

                {media.length > 1 && (
                  <>
                    <button
                      onClick={prev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/20 text-white hover:bg-white/40 transition-colors"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m15 18-6-6 6-6" />
                      </svg>
                    </button>
                    <button
                      onClick={next}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/20 text-white hover:bg-white/40 transition-colors"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1">
                      {currentIndex + 1} / {media.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <span className="text-white/50 font-heading text-xl">{t.noPhoto}</span>
            )}
          </div>

          {/* Info panel */}
          <div className="w-full lg:w-[40%] lg:overflow-y-auto p-6 lg:p-8 flex flex-col">
            <p className="text-xs text-[#8a8178] mb-3">
              {new Date(post.created_at).toLocaleDateString(dateLocale, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>

            <h2 className="font-heading text-2xl font-semibold text-[#2c2825] mb-2">
              {displayTitle}
            </h2>

            {post.price && (
              <div className="flex items-center gap-2 mb-1">
                <p className="text-lg font-heading font-semibold text-[#2c2825]">
                  {lang === "cs" ? convertPriceToCzk(post.price) : post.price}
                </p>
                {post.is_discounted && (
                  <span className="bg-[#a8555c] text-white text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 font-semibold">
                    {lang === "ru" ? "Скидка" : lang === "cs" ? "Sleva" : "Sale"}
                  </span>
                )}
              </div>
            )}

            {post.stock_meters != null && post.stock_meters > 0 && (
              <p className="text-sm text-[#8a8178] mb-4">
                {post.stock_meters} м{" "}
                {lang === "en" ? "in stock" : lang === "cs" ? "skladem" : "в наличии"}
              </p>
            )}
            {post.stock_meters === 0 && (
              <p className="text-sm text-red-500 mb-4">
                {lang === "en" ? "Out of stock" : lang === "cs" ? "Není skladem" : "Нет в наличии"}
              </p>
            )}
            {post.stock_meters == null && post.price && <div className="mb-3" />}

            <div className="text-sm text-[#2c2825]/80 leading-relaxed whitespace-pre-wrap mb-6">
              {displayDescription}
            </div>

            {post.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag) => (
                  <span key={tag} className="text-xs text-[#8a8178] border border-[#e8e0d8] px-2 py-1">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto pt-6 flex flex-col gap-3">
                <button
                  onClick={() => setShowBuyNowModal(true)}
                  className="w-full py-4 bg-[#2c2825] text-white font-heading text-base tracking-widest uppercase hover:bg-[#3d3632] transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="1" y="4" width="22" height="16" rx="0" />
                    <path d="M1 10h22" />
                  </svg>
                  {t.buyNow}
                </button>

                <div className="flex gap-2">
                  {addedToCart ? (
                    <button
                      onClick={() => { openCart(); onClose(); }}
                      className="flex-1 py-3.5 bg-[#f5f0eb] border-2 border-[#2c2825] text-[#2c2825] font-heading text-sm tracking-widest uppercase hover:bg-[#ede7e0] transition-colors flex items-center justify-center gap-2"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                      {t.goToCart}
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="flex-1 py-3.5 bg-[#f5f0eb] border-2 border-[#2c2825] text-[#2c2825] font-heading text-sm tracking-widest uppercase hover:bg-[#ede7e0] transition-colors flex items-center justify-center gap-2"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                      {t.addToCart}
                    </button>
                  )}

                  {/* Forward to chat */}
                  <button
                    onClick={() => { forwardPostToChat(post); onClose(); }}
                    title={lang === "ru" ? "Переслать в чат" : lang === "en" ? "Forward to chat" : "Přeposlat do chatu"}
                    className="py-3.5 px-4 bg-[#f5f0eb] border-2 border-[#e8e0d8] text-[#8a8178] hover:border-[#2c2825] hover:text-[#2c2825] transition-colors flex items-center justify-center"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 10 20 15 15 20" />
                      <path d="M4 4v7a4 4 0 0 0 4 4h12" />
                    </svg>
                  </button>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {showAddModal && (
      <AddToCartModal
        post={post}
        onAdd={(qty) => {
          addItem(post, qty);
          setAddedToCart(true);
          setTimeout(() => setAddedToCart(false), 15_000);
        }}
        onClose={() => setShowAddModal(false)}
      />
    )}

    {showBuyNowModal && (
      <BuyNowModal
        post={post}
        onClose={() => setShowBuyNowModal(false)}
      />
    )}
    </>
  );
}
