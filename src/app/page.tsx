"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Post } from "@/types";
import Header, { type Tab } from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Gallery from "@/components/Gallery";
import PostModal from "@/components/PostModal";
import CartDrawer from "@/components/CartDrawer";
import AboutSection from "@/components/AboutSection";
import DeliverySection from "@/components/DeliverySection";
import PaymentSection from "@/components/PaymentSection";
import EmailCaptureModal from "@/components/EmailCaptureModal";
import Footer from "@/components/Footer";
import { useLang } from "@/context/LanguageContext";
import { NOVELTIES_KEY } from "@/lib/categories";

const PAGE_SIZE = 12;

function normalizeYo(str: string): string {
  return str.replace(/[ёЁ]/g, (ch) => (ch === "ё" ? "е" : "Е"));
}

export default function Home() {
  const { t } = useLang();
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("catalog");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/posts");
      if (res.ok) {
        const data = await res.json();
        setAllPosts(data);

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

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    counts[NOVELTIES_KEY] = allPosts.filter((p) => p.is_new).length;
    allPosts.forEach((p) => {
      (p.categories || []).forEach((cat) => {
        counts[cat] = (counts[cat] || 0) + 1;
      });
    });
    return counts;
  }, [allPosts]);

  // Filter posts by selected categories + search
  const filteredPosts = useMemo(() => {
    let filtered = [...allPosts];

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) => {
        return selectedCategories.some((cat) => {
          if (cat === NOVELTIES_KEY) return p.is_new;
          return (p.categories || []).includes(cat);
        });
      });
    }

    if (searchQuery.trim()) {
      const q = normalizeYo(searchQuery.trim().toLowerCase());
      filtered = filtered.filter((p) =>
        normalizeYo(p.title.toLowerCase()).includes(q)
      );
    }

    return filtered;
  }, [allPosts, selectedCategories, searchQuery]);

  const paginatedPosts = useMemo(() => {
    return filteredPosts.slice(0, (page + 1) * PAGE_SIZE);
  }, [filteredPosts, page]);

  const hasMore = paginatedPosts.length < filteredPosts.length;

  useEffect(() => {
    setPage(0);
  }, [selectedCategories, searchQuery]);

  const loadMore = useCallback(() => {
    if (loading) return;
    setPage((prev) => prev + 1);
  }, [loading]);

  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const resetCategories = () => setSelectedCategories([]);

  const isCatalog = activeTab === "catalog";

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 flex gap-8 mt-6 pb-6">
        {/* Sidebar only visible in catalog */}
        {isCatalog && (
          <Sidebar
            selectedCategories={selectedCategories}
            categoryCounts={categoryCounts}
            onToggleCategory={toggleCategory}
            onReset={resetCategories}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 min-w-0">
          {activeTab === "about" && <AboutSection />}
          {activeTab === "delivery" && <DeliverySection />}
          {activeTab === "payment" && <PaymentSection />}

          {isCatalog && (
            <>
              <Gallery
                posts={paginatedPosts}
                onPostClick={(post) => {
                  setSelectedPost(post);
                  window.history.replaceState(null, "", `/?post=${post.id}`);
                }}
              />

              {hasMore && (
                <>
                  <div ref={sentinelRef} className="h-1" />
                  <div className="flex justify-center py-12">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="px-8 py-3 bg-[#2c2825] text-white font-heading text-lg tracking-wide hover:bg-[#3d3632] transition-colors disabled:opacity-50"
                    >
                      {loading ? t.loading : t.loadMore}
                    </button>
                  </div>
                </>
              )}

              {loading && (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[#e8e0d8] border-t-[#2c2825] rounded-full animate-spin" />
                </div>
              )}
            </>
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
        />
      )}

      <CartDrawer />

      <Footer />

      <EmailCaptureModal />
    </div>
  );
}
