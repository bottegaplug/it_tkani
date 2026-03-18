"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Post, Tag } from "@/types";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Gallery from "@/components/Gallery";
import PostModal from "@/components/PostModal";
import BuyModal from "@/components/BuyModal";

const PAGE_SIZE = 12;

/** Normalize ё → е for search comparison */
function normalizeYo(str: string): string {
  return str.replace(/[ёЁ]/g, (ch) => (ch === "ё" ? "е" : "Е"));
}

function extractTags(posts: Post[]): Tag[] {
  const tagCount: Record<string, number> = {};
  posts.forEach((post) => {
    post.tags?.forEach((tag: string) => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });
  return Object.entries(tagCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export default function Home() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"catalog" | "new">("catalog");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Fetch all posts from API once
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/posts");
      if (res.ok) {
        const data = await res.json();
        setAllPosts(data);
        setTags(extractTags(data));

        // Open post from URL ?post=ID
        const params = new URLSearchParams(window.location.search);
        const postId = params.get("post");
        if (postId) {
          const found = data.find((p: Post) => p.id === postId);
          if (found) setSelectedPost(found);
        }
      }
    } catch {
      // API may not be ready
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Filter posts client-side with ё/е normalization
  const filteredPosts = useMemo(() => {
    let filtered = [...allPosts];

    if (activeTab === "new") {
      filtered = filtered.filter((p) => p.is_new);
    }
    if (searchQuery.trim()) {
      const q = normalizeYo(searchQuery.trim().toLowerCase());
      filtered = filtered.filter((p) =>
        normalizeYo(p.title.toLowerCase()).includes(q)
      );
    }
    if (selectedTags.length > 0) {
      filtered = filtered.filter((p) =>
        selectedTags.every((t) => p.tags?.includes(t))
      );
    }
    return filtered;
  }, [allPosts, activeTab, searchQuery, selectedTags]);

  // Paginated slice
  const paginatedPosts = useMemo(() => {
    return filteredPosts.slice(0, (page + 1) * PAGE_SIZE);
  }, [filteredPosts, page]);

  const hasMore = paginatedPosts.length < filteredPosts.length;

  // Reset page on filter change
  useEffect(() => {
    setPage(0);
  }, [activeTab, searchQuery, selectedTags]);

  const loadMore = useCallback(() => {
    if (loading) return;
    setPage((prev) => prev + 1);
  }, [loading]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!hasMore) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const resetTags = () => setSelectedTags([]);

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 flex gap-8 mt-6 pb-12">
        <Sidebar
          tags={tags}
          selectedTags={selectedTags}
          onToggleTag={toggleTag}
          onReset={resetTags}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0">
          <Gallery posts={paginatedPosts} onPostClick={(post) => {
            setSelectedPost(post);
            window.history.replaceState(null, "", `/?post=${post.id}`);
          }} />

          {hasMore && (
            <>
              {/* Invisible sentinel for infinite scroll */}
              <div ref={sentinelRef} className="h-1" />
              <div className="flex justify-center py-12">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-8 py-3 bg-[#2c2825] text-white font-heading text-lg tracking-wide hover:bg-[#3d3632] transition-colors disabled:opacity-50"
                >
                  {loading ? "Загрузка..." : "Загрузить ещё"}
                </button>
              </div>
            </>
          )}

          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#e8e0d8] border-t-[#2c2825] rounded-full animate-spin" />
            </div>
          )}
        </main>
      </div>

      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => {
            setSelectedPost(null);
            window.history.replaceState(null, "", "/");
          }}
          onBuy={() => setShowBuyModal(true)}
        />
      )}

      {showBuyModal && (
        <BuyModal onClose={() => setShowBuyModal(false)} />
      )}
    </div>
  );
}
