"use client";

import type { Post } from "@/types";
import { useLang } from "@/context/LanguageContext";
import type { Lang } from "@/lib/i18n";

function getTitle(post: Post, lang: Lang): string {
  if (lang !== "ru" && post.translations?.[lang]?.title) {
    return post.translations[lang]!.title;
  }
  return post.title;
}

interface GalleryCardProps {
  post: Post;
  onPostClick: (post: Post) => void;
}

function GalleryCard({ post, onPostClick }: GalleryCardProps) {
  const { lang, t, fmtPrice } = useLang();
  const title = getTitle(post, lang);

  return (
    <div
      className="group relative aspect-square bg-[#f5f0eb] overflow-hidden cursor-pointer"
      onClick={() => onPostClick(post)}
    >
      {post.images?.[0] ? (
        <img
          src={post.images[0]}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-[#8a8178] font-heading text-lg">{t.noPhoto}</span>
        </div>
      )}

      {/* New badge */}
      {post.is_new && (
        <div className="absolute top-3 left-3 bg-[#2c2825] text-white text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 font-medium pointer-events-none">
          New
        </div>
      )}

      {/* Discount ribbon — wraps the top-right corner diagonally.
          The outer square clips the band so it reads as folded round the edge. */}
      {post.is_discounted && (
        <div className="absolute top-0 right-0 w-[120px] h-[120px] overflow-hidden pointer-events-none z-10">
          <div
            className="absolute bg-[#a8555c] text-white text-center shadow-md"
            style={{
              width: 180,
              top: 30,
              right: -45,
              transform: "rotate(45deg)",
              paddingTop: 4,
              paddingBottom: 4,
            }}
          >
            <span className="font-heading text-sm tracking-[0.16em] uppercase font-semibold leading-none">
              {lang === "ru" ? "Скидка" : lang === "cs" ? "Sleva" : "Sale"}
            </span>
          </div>
        </div>
      )}

      {/* Title + price overlay on hover */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <p className="text-white text-sm font-medium truncate">{title}</p>
        {post.price && (
          <p className="text-xs mt-0.5 flex items-center gap-1.5">
            {post.is_discounted && post.old_price && (
              <span className="text-[#e8a0a6] line-through">
                {fmtPrice(post.old_price)}
              </span>
            )}
            <span className="text-white/80">
              {fmtPrice(post.price)}
            </span>
          </p>
        )}
      </div>

      {/* Hover dim */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
    </div>
  );
}

interface GalleryProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
}

export default function Gallery({ posts, onPostClick }: GalleryProps) {
  const { t } = useLang();

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="font-heading text-2xl text-[#8a8178] mb-2">{t.nothingYet}</p>
        <p className="text-sm text-[#8a8178]/70">{t.recordsWillAppear}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {posts.map((post) => (
        <GalleryCard key={post.id} post={post} onPostClick={onPostClick} />
      ))}
    </div>
  );
}
