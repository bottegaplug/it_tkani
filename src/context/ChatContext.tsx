"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { Post } from "@/types";

interface ChatUser {
  id: string;
  nickname: string;
}

/** A cart snapshot forwarded into the chat */
export interface CartSnapshotItem {
  id: string;
  title: string;
  sku?: string;
  price?: string;
  image?: string;
  quantity: number;
  lineTotal?: string;
}

export interface CartSnapshot {
  items: CartSnapshotItem[];
  total?: string;
}

interface ChatContextType {
  chatUser: ChatUser | null;
  setChatUser: (u: ChatUser | null) => void;
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  pendingPost: Post | null;
  forwardPostToChat: (post: Post) => void;
  clearPendingPost: () => void;
  pendingCart: CartSnapshot | null;
  forwardCartToChat: (cart: CartSnapshot) => void;
  clearPendingCart: () => void;
}

const ChatContext = createContext<ChatContextType>({
  chatUser: null,
  setChatUser: () => {},
  isOpen: false,
  openChat: () => {},
  closeChat: () => {},
  pendingPost: null,
  forwardPostToChat: () => {},
  clearPendingPost: () => {},
  pendingCart: null,
  forwardCartToChat: () => {},
  clearPendingCart: () => {},
});

export function ChatProvider({ children }: { children: ReactNode }) {
  // Start null on both server and client — restore after mount to avoid hydration mismatch
  const [chatUser, setChatUserState] = useState<ChatUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingPost, setPendingPost] = useState<Post | null>(null);
  const [pendingCart, setPendingCart] = useState<CartSnapshot | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("ittkani_chat_user");
      if (stored) setChatUserState(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const setChatUser = useCallback((u: ChatUser | null) => {
    setChatUserState(u);
    if (u) localStorage.setItem("ittkani_chat_user", JSON.stringify(u));
    else localStorage.removeItem("ittkani_chat_user");
  }, []);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);

  const forwardPostToChat = useCallback((post: Post) => {
    setPendingPost(post);
    setIsOpen(true);
  }, []);

  const clearPendingPost = useCallback(() => setPendingPost(null), []);

  const forwardCartToChat = useCallback((cart: CartSnapshot) => {
    setPendingCart(cart);
    setIsOpen(true);
  }, []);

  const clearPendingCart = useCallback(() => setPendingCart(null), []);

  return (
    <ChatContext.Provider
      value={{
        chatUser, setChatUser, isOpen, openChat, closeChat,
        pendingPost, forwardPostToChat, clearPendingPost,
        pendingCart, forwardCartToChat, clearPendingCart,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
