"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Post } from "@/types";

interface PostModalProps {
  post: Post;
  onClose: () => void;
  onBuy: () => void;
}

type MediaItem = { type: "image"; url: string } | { type: "video"; url: string };

export default function PostModal({ post, onClose, onBuy }: PostModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

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

  return (
    <div
      className="fixed inset-0 z-50 modal-overlay"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />

      {/* Mobile: full-screen scrollable. Desktop: centered flex */}
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

          {/* Media carousel (images + videos) */}
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
              <span className="text-white/50 font-heading text-xl">Нет фото</span>
            )}
          </div>

          {/* Info panel */}
          <div className="w-full lg:w-[40%] lg:overflow-y-auto p-6 lg:p-8 flex flex-col">
            <p className="text-xs text-[#8a8178] mb-3">
              {new Date(post.created_at).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>

            <h2 className="font-heading text-2xl font-semibold text-[#2c2825] mb-2">
              {post.title}
            </h2>

            {post.price && (
              <p className="text-lg font-heading font-semibold text-[#2c2825] mb-4">
                {post.price}
              </p>
            )}

            <div className="text-sm text-[#2c2825]/80 leading-relaxed whitespace-pre-wrap mb-6">
              {post.description}
            </div>

            {post.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-[#8a8178] border border-[#e8e0d8] px-2 py-1"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto pt-4">
              <button
                onClick={onBuy}
                className="w-full py-3 bg-[#2c2825] text-white font-heading text-base tracking-wide hover:bg-[#3d3632] transition-colors"
              >
                Купить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
