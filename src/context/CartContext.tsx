"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import type { Post } from "@/types";

export interface CartItem {
  post: Post;
  quantity: number;
}

export interface StockIssue {
  postId: string;
  title: string;
  requested: number;
  available: number | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (post: Post, qty: number) => void;
  removeItem: (postId: string) => void;
  updateQuantity: (postId: string, qty: number) => void;
  clearCart: () => void;
  totalUniqueItems: number;
  stockIssues: StockIssue[];
  hasStockIssue: boolean;
  dismissStockIssue: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  lastAdded: { post: Post; qty: number } | null;
  clearLastAdded: () => void;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalUniqueItems: 0,
  stockIssues: [],
  hasStockIssue: false,
  dismissStockIssue: () => {},
  isCartOpen: false,
  openCart: () => {},
  closeCart: () => {},
  lastAdded: null,
  clearLastAdded: () => {},
});

const CART_KEY = "ittkani_cart_v2";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [stockIssues, setStockIssues] = useState<StockIssue[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<{ post: Post; qty: number } | null>(null);
  const lastAddedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stockCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setItems(loadCart());
  }, []);

  // Persist to localStorage whenever items change
  useEffect(() => {
    saveCart(items);
  }, [items]);

  const checkStock = useCallback(async (currentItems: CartItem[]) => {
    if (currentItems.length === 0) {
      setStockIssues([]);
      return;
    }
    try {
      const res = await fetch("/api/posts");
      if (!res.ok) return;
      const posts: Post[] = await res.json();
      const postMap = new Map(posts.map((p) => [p.id, p]));

      const issues: StockIssue[] = [];
      for (const item of currentItems) {
        const fresh = postMap.get(item.post.id);
        if (!fresh) continue;
        if (fresh.stock_meters == null) continue; // unlimited
        if (item.quantity > fresh.stock_meters) {
          issues.push({
            postId: item.post.id,
            title: item.post.title,
            requested: item.quantity,
            available: fresh.stock_meters,
          });
        }
      }
      setStockIssues(issues);
      if (issues.length > 0) setDismissed(false);
    } catch {
      // ignore network errors
    }
  }, []);

  // Stock polling every 60s
  useEffect(() => {
    checkStock(items);
    stockCheckRef.current = setInterval(() => {
      checkStock(items);
    }, 60_000);
    return () => {
      if (stockCheckRef.current) clearInterval(stockCheckRef.current);
    };
  }, [items, checkStock]);

  const clearLastAdded = useCallback(() => setLastAdded(null), []);

  const addItem = useCallback((post: Post, qty: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.post.id === post.id);
      if (existing) {
        return prev.map((i) =>
          i.post.id === post.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [...prev, { post, quantity: qty }];
    });
    // Show toast
    setLastAdded({ post, qty });
    if (lastAddedTimerRef.current) clearTimeout(lastAddedTimerRef.current);
    lastAddedTimerRef.current = setTimeout(() => setLastAdded(null), 3000);
  }, []);

  const removeItem = useCallback((postId: string) => {
    setItems((prev) => prev.filter((i) => i.post.id !== postId));
    setStockIssues((prev) => prev.filter((s) => s.postId !== postId));
  }, []);

  const updateQuantity = useCallback((postId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.post.id !== postId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.post.id === postId ? { ...i, quantity: qty } : i))
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setStockIssues([]);
  }, []);

  const dismissStockIssue = useCallback(() => {
    setDismissed(true);
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const totalUniqueItems = items.length;
  const hasStockIssue = stockIssues.length > 0 && !dismissed;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalUniqueItems,
        stockIssues,
        hasStockIssue,
        dismissStockIssue,
        isCartOpen,
        openCart,
        closeCart,
        lastAdded,
        clearLastAdded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
