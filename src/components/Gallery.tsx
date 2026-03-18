"use client";

import type { Post } from "@/types";

interface GalleryProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
}

export default function Gallery({ posts, onPostClick }: GalleryProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="font-heading text-2xl text-[#8a8178] mb-2">Пока ничего нет</p>
        <p className="text-sm text-[#8a8178]/70">Записи появятся здесь после добавления</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {posts.map((post) => (
        <div
          key={post.id}
          onClick={() => onPostClick(post)}
          className="group cursor-pointer relative aspect-square bg-[#f5f0eb] overflow-hidden"
        >
          {post.images?.[0] ? (
            <img
              src={post.images[0]}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[#8a8178] font-heading text-lg">Нет фото</span>
            </div>
          )}

          {/* Photo count badge */}
          {post.images?.length > 1 && (
            <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="0" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
              {post.images.length}
            </div>
          )}

          {/* New badge */}
          {post.is_new && (
            <div className="absolute top-3 left-3 bg-[#2c2825] text-white text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 font-medium">
              New
            </div>
          )}

          {/* Title + price overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <p className="text-white text-sm font-medium truncate">{post.title}</p>
            {post.price && (
              <p className="text-white/80 text-xs mt-0.5">{post.price}</p>
            )}
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
        </div>
      ))}
    </div>
  );
}
