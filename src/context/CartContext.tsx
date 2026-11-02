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
  /** Какой из отрезов ткани выбран (индекс в post.cuts) */
  cutIndex?: number;
}

/**
 * Один товар может лежать в корзине несколько раз — по строке на отрез,
 * поэтому ключом служит пара «товар + отрез», а не один id.
 */
export function cartKey(postId: string, cutIndex?: number): string {
  return cutIndex == null ? postId : `${postId}#${cutIndex}`;
}

export interface StockIssue {
  postId: string;
  title: string;
  requested: number;
  available: number | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (post: Post, qty: number, cutIndex?: number) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, qty: number) => void;
  clearCart: () => void;
  totalUniqueItems: number;
  stockIssues: StockIssue[];
  hasStockIssue: boolean;
  dismissStockIssue: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  lastAdded: { post: Post; qty: number; cutIndex?: number } | null;
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
  const [lastAdded, setLastAdded] = useState<{ post: Post; qty: number; cutIndex?: number } | null>(null);
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
        // A chosen cut is checked against that piece, not the overall total
        const available =
          item.cutIndex != null && fresh.cuts?.[item.cutIndex] != null
            ? fresh.cuts[item.cutIndex]
            : fresh.stock_meters;
        if (available == null) continue; // unlimited
        if (item.quantity > available) {
          issues.push({
            postId: item.post.id,
            title: item.post.title,
            requested: item.quantity,
            available,
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

  const addItem = useCallback((post: Post, qty: number, cutIndex?: number) => {
    const key = cartKey(post.id, cutIndex);
    setItems((prev) => {
      const existing = prev.find((i) => cartKey(i.post.id, i.cutIndex) === key);
      if (existing) {
        return prev.map((i) =>
          cartKey(i.post.id, i.cutIndex) === key ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [...prev, { post, quantity: qty, cutIndex }];
    });
    // Show toast
    setLastAdded({ post, qty, cutIndex });
    if (lastAddedTimerRef.current) clearTimeout(lastAddedTimerRef.current);
    lastAddedTimerRef.current = setTimeout(() => setLastAdded(null), 3000);
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => cartKey(i.post.id, i.cutIndex) !== key));
    setStockIssues((prev) => prev.filter((s) => s.postId !== key.split("#")[0]));
  }, []);

  const updateQuantity = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => cartKey(i.post.id, i.cutIndex) !== key)
        : prev.map((i) => (cartKey(i.post.id, i.cutIndex) === key ? { ...i, quantity: qty } : i))
    );
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
