"use client";

import { useState, useEffect, useCallback } from "react";
import type { Post } from "@/types";
import { uploadFile } from "@/lib/upload-client";
import { FABRIC_CATEGORIES } from "@/lib/categories";

interface AttachedPost {
  id: string;
  title: string;
  price?: string;
  image?: string;
  sku?: string;
}

interface CartSnapshotItem {
  id: string;
  title: string;
  sku?: string;
  price?: string;
  image?: string;
  quantity: number;
  lineTotal?: string;
}

interface CartSnapshot {
  items: CartSnapshotItem[];
  total?: string;
}

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  is_admin: boolean;
  attached_post: AttachedPost | null;
  attached_cart: CartSnapshot | null;
  is_read: boolean;
  created_at: string;
}

interface ChatUser {
  id: string;
  nickname: string;
  created_at: string;
  last_message: { content: string; attached_post: AttachedPost | null; attached_cart: CartSnapshot | null; created_at: string; is_admin: boolean } | null;
  unread_count: number;
}

interface PromoCode {
  id: string;
  code: string;
  discount_percent: number;
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number;
  is_active: boolean;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  stripe_session_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_city: string;
  customer_address: string;
  customer_postal: string;
  customer_country: string;
  customer_comment: string;
  items: { sku?: string; title: string; quantity: number; price?: string }[];
  status: "pending" | "shipped" | "delivered";
  tracking_number?: string;
  tracking_carrier?: string;
  created_at: string;
}

const CARRIERS = ["СДЭК", "Почта России", "DHL", "EMS", "FedEx", "Boxberry", "Другое"];

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [adminTab, setAdminTab] = useState<"posts" | "orders" | "promo" | "chats">("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState<Post | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);

  // Promo codes state
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [promosLoading, setPromosLoading] = useState(false);
  const [promoForm, setPromoForm] = useState({ code: "", discount_percent: "", expires_at: "", max_uses: "" });
  const [promoSaving, setPromoSaving] = useState(false);
  const [promoError, setPromoError] = useState("");

  // Chats state
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatReply, setChatReply] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [shippingOrderId, setShippingOrderId] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingCarrier, setTrackingCarrier] = useState(CARRIERS[0]);
  const [shippingError, setShippingError] = useState("");
  const [shippingSending, setShippingSending] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isNew, setIsNew] = useState(false);
  const [isDiscounted, setIsDiscounted] = useState(false);
  const [price, setPrice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [sku, setSku] = useState("");
  const [stockMeters, setStockMeters] = useState<string>("");
  const [adminSearch, setAdminSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translations, setTranslations] = useState<{
    en?: { title: string; description: string };
    cs?: { title: string; description: string };
  }>({});

  const checkAuth = useCallback(async () => {
    const res = await fetch("/api/auth");
    if (res.ok) setAuthenticated(true);
  }, []);

  const fetchPosts = useCallback(async () => {
    const res = await fetch("/api/posts?admin=1");
    if (res.ok) {
      const data = await res.json();
      setPosts(data);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        console.error("fetchOrders error:", res.status, await res.text().catch(() => ""));
      }
    } catch (err) {
      console.error("fetchOrders network error:", err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const fetchPromos = useCallback(async () => {
    setPromosLoading(true);
    try {
      const res = await fetch("/api/promo");
      if (res.ok) setPromos(await res.json());
    } finally {
      setPromosLoading(false);
    }
  }, []);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError("");
    if (!promoForm.code.trim() || !promoForm.discount_percent) {
      setPromoError("Заполните код и скидку");
      return;
    }
    setPromoSaving(true);
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          code: promoForm.code.trim().toUpperCase(),
          discount_percent: parseInt(promoForm.discount_percent),
          expires_at: promoForm.expires_at || null,
          max_uses: promoForm.max_uses ? parseInt(promoForm.max_uses) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setPromoError(data.error || "Ошибка"); return; }
      setPromoForm({ code: "", discount_percent: "", expires_at: "", max_uses: "" });
      fetchPromos();
    } catch { setPromoError("Ошибка соединения"); }
    finally { setPromoSaving(false); }
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm("Удалить промокод?")) return;
    await fetch("/api/promo", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchPromos();
  };

  const handleTogglePromo = async (id: string, is_active: boolean) => {
    await fetch("/api/promo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active }),
    });
    fetchPromos();
  };

  const fetchChatUsers = useCallback(async () => {
    setChatsLoading(true);
    try {
      const res = await fetch("/api/chat?action=users");
      if (res.ok) setChatUsers(await res.json());
    } finally {
      setChatsLoading(false);
    }
  }, []);

  const fetchChatMessages = useCallback(async (userId: string) => {
    const res = await fetch(`/api/chat?action=messages&userId=${userId}`);
    if (res.ok) setChatMessages(await res.json());
  }, []);

  const openChatWith = useCallback(async (user: ChatUser) => {
    setActiveChatUserId(user.id);
    await fetchChatMessages(user.id);
    // Mark as read
    fetch("/api/chat", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) });
    setChatUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, unread_count: 0 } : u));
  }, [fetchChatMessages]);

  const handleSendReply = async () => {
    if (!activeChatUserId || !chatReply.trim()) return;
    setChatSending(true);
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", userId: activeChatUserId, content: chatReply.trim(), isAdmin: true }),
      });
      setChatReply("");
      await fetchChatMessages(activeChatUserId);
    } finally {
      setChatSending(false);
    }
  };

  const handleDeleteChat = async (userId: string) => {
    if (!confirm("Удалить весь чат с этим пользователем?")) return;
    await fetch("/api/chat", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    if (activeChatUserId === userId) { setActiveChatUserId(null); setChatMessages([]); }
    fetchChatUsers();
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Удалить заказ ${orderNumber}? Это действие нельзя отменить.`)) return;
    try {
      const res = await fetch("/api/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId }),
      });
      if (res.ok) fetchOrders();
    } catch {
      // ignore
    }
  };

  const handleSendTracking = async (orderId: string) => {
    if (!trackingNumber.trim()) {
      setShippingError("Введите трек-номер");
      return;
    }
    setShippingSending(true);
    setShippingError("");
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, trackingNumber: trackingNumber.trim(), carrier: trackingCarrier }),
      });
      if (!res.ok) {
        const d = await res.json();
        setShippingError(d.error || "Ошибка");
        return;
      }
      setShippingOrderId(null);
      setTrackingNumber("");
      setTrackingCarrier(CARRIERS[0]);
      fetchOrders();
    } catch {
      setShippingError("Ошибка соединения");
    } finally {
      setShippingSending(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authenticated) {
      fetchPosts();
      fetchOrders();
      fetchPromos();
      fetchChatUsers();
    }
  }, [authenticated, fetchPosts, fetchOrders, fetchPromos, fetchChatUsers]);

  // Poll chat messages when a conversation is open
  useEffect(() => {
    if (!activeChatUserId) return;
    const id = setInterval(() => fetchChatMessages(activeChatUserId), 3000);
    return () => clearInterval(id);
  }, [activeChatUserId, fetchChatMessages]);

  // Poll chat users list for unread badge
  useEffect(() => {
    if (!authenticated) return;
    const id = setInterval(fetchChatUsers, 8000);
    return () => clearInterval(id);
  }, [authenticated, fetchChatUsers]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthenticated(true);
    } else {
      setAuthError("Неверный пароль");
    }
  };

  const logout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setAuthenticated(false);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImages([]);
    setVideos([]);
    setCategories([]);
    setIsNew(false);
    setIsDiscounted(false);
    setPrice("");
    setSku("");
    setStockMeters("");
    setTranslations({});
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (post: Post) => {
    setEditing(post);
    setTitle(post.title);
    setDescription(post.description);
    setImages(post.images || []);
    setVideos(post.videos || []);
    setCategories(post.categories || []);
    setIsNew(post.is_new);
    setIsDiscounted(!!post.is_discounted);
    setPrice(post.price || "");
    setSku(post.sku || "");
    setStockMeters(post.stock_meters != null ? String(post.stock_meters) : "");
    setTranslations(post.translations || {});
    setShowForm(true);
  };

  const handleTranslate = async () => {
    if (!title.trim() && !description.trim()) return;
    setTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (res.ok) {
        const data = await res.json();
        setTranslations(data);
      }
    } finally {
      setTranslating(false);
    }
  };

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const startNew = () => {
    resetForm();
    setShowForm(true);
  };

  const uploadFiles = async (files: FileList, type: "image" | "video") => {
    setUploading(true);
    setUploadError("");
    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadFile(files[i]);
        newUrls.push(url);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Неизвестная ошибка";
        setUploadError(`Ошибка загрузки ${files[i].name}: ${msg}`);
      }
    }

    if (type === "image") {
      setImages((prev) => [...prev, ...newUrls]);
    } else {
      setVideos((prev) => [...prev, ...newUrls]);
    }
    setUploading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    await uploadFiles(e.target.files, "image");
    e.target.value = "";
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    await uploadFiles(e.target.files, "video");
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const savePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const body = {
      ...(editing ? { id: editing.id } : {}),
      title,
      description,
      images,
      videos,
      tags: [],
      categories,
      is_new: isNew,
      is_discounted: isDiscounted,
      price,
      sku: sku.trim() || null,
      stock_meters: stockMeters !== "" ? parseFloat(stockMeters) : null,
      translations,
    };

    const res = await fetch("/api/posts", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      resetForm();
      fetchPosts();
    }
    setSaving(false);
  };

  const deletePost = async (id: string) => {
    if (!confirm("Удалить эту запись?")) return;

    await fetch("/api/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchPosts();
  };

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center px-4">
        <form onSubmit={login} className="w-full max-w-sm bg-white p-8 border border-[#e8e0d8]">
          <h1 className="font-heading text-3xl font-semibold text-[#2c2825] mb-1 text-center">
            IT Tkani
          </h1>
          <p className="text-sm text-[#8a8178] text-center mb-8">Панель администратора</p>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className="w-full py-3 px-4 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] placeholder-[#8a8178] focus:outline-none focus:border-[#8a8178] mb-4"
            autoFocus
          />

          {authError && (
            <p className="text-red-600 text-sm mb-4">{authError}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-[#2c2825] text-white font-heading text-base tracking-wide hover:bg-[#3d3632] transition-colors"
          >
            Войти
          </button>
        </form>
      </div>
    );
  }

  // Admin panel
  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Admin header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e8e0d8]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <a href="/" className="font-heading text-2xl font-semibold text-[#2c2825]">
              IT Tkani
            </a>
            <span className="text-xs text-[#8a8178] border border-[#e8e0d8] px-2 py-1 uppercase tracking-wider">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            {adminTab === "posts" && (
              <button
                onClick={startNew}
                className="px-5 py-2 bg-[#2c2825] text-white text-sm font-heading tracking-wide hover:bg-[#3d3632] transition-colors"
              >
                + Новая запись
              </button>
            )}
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-[#8a8178] border border-[#e8e0d8] hover:bg-[#f5f0eb] transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Tab switcher */}
      <div className="border-b border-[#e8e0d8] bg-white">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 flex gap-1 pt-2">
          {(["posts", "orders", "promo", "chats"] as const).map((tab) => {
            const totalUnread = chatUsers.reduce((s, u) => s + u.unread_count, 0);
            const label =
              tab === "posts" ? "Товары" :
              tab === "orders" ? `Заказы${orders.length ? ` (${orders.length})` : ""}` :
              tab === "promo" ? `Промокоды${promos.length ? ` (${promos.length})` : ""}` :
              `Чаты${totalUnread ? ` (${totalUnread})` : ""}`;
            return (
              <button
                key={tab}
                onClick={() => { setAdminTab(tab); if (tab === "chats") fetchChatUsers(); }}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors relative ${
                  adminTab === tab ? "border-[#2c2825] text-[#2c2825]" : "border-transparent text-[#8a8178] hover:text-[#2c2825]"
                }`}
              >
                {label}
                {tab === "chats" && totalUnread > 0 && adminTab !== "chats" && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
        {/* ── ORDERS TAB ── */}
        {adminTab === "orders" && (
          <div>
            {ordersLoading && (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-[#e8e0d8] border-t-[#2c2825] rounded-full animate-spin" />
              </div>
            )}

            {!ordersLoading && orders.length === 0 && (
              <div className="space-y-6">
                <div className="text-center py-10">
                  <p className="font-heading text-2xl text-[#8a8178] mb-2">Заказов пока нет</p>
                  <p className="text-sm text-[#b8b0a8]">Заказы появятся здесь после первой оплаты через Stripe</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-5 rounded">
                  <p className="text-sm font-semibold text-amber-800 mb-2">⚠️ Если заказы не появляются — нужно создать таблицу в Supabase</p>
                  <p className="text-xs text-amber-700 mb-3">Перейдите в Supabase → SQL Editor и выполните этот запрос:</p>
                  <pre className="bg-white border border-amber-200 text-xs text-[#2c2825] p-3 overflow-x-auto leading-relaxed whitespace-pre-wrap">{`CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  stripe_session_id text UNIQUE,
  customer_name text DEFAULT '',
  customer_phone text DEFAULT '',
  customer_email text DEFAULT '',
  customer_city text DEFAULT '',
  customer_address text DEFAULT '',
  customer_postal text DEFAULT '',
  customer_country text DEFAULT '',
  customer_comment text DEFAULT '',
  items jsonb DEFAULT '[]',
  status text DEFAULT 'pending',
  tracking_number text,
  tracking_carrier text,
  created_at timestamptz DEFAULT now()
);

-- ВАЖНО: отключить RLS, иначе запись не работает
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;`}</pre>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {orders.map((order) => {
                const isShipping = shippingOrderId === order.id;
                const isShipped = order.status === "shipped" || order.status === "delivered";
                const addressParts = [order.customer_city, order.customer_address, order.customer_postal, order.customer_country].filter(Boolean);
                const waPhone = order.customer_phone.replace(/\D/g, "");
                const waText = encodeURIComponent(
                  `Здравствуйте, ${order.customer_name}! Ваш заказ ${order.order_number} отправлен.\nСлужба доставки: ${order.tracking_carrier || ""}\nТрек-номер: ${order.tracking_number || ""}`
                );

                return (
                  <div key={order.id} className="bg-white border border-[#e8e0d8]">
                    {/* Order header */}
                    <div className="flex items-start gap-4 p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono font-bold text-[#2c2825] text-base">{order.order_number}</span>
                          <span className={`text-[10px] px-2 py-0.5 uppercase tracking-wider font-medium ${
                            isShipped ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {isShipped ? "Отправлен" : "Ожидает отправки"}
                          </span>
                          <span className="text-xs text-[#b8b0a8]">
                            {new Date(order.created_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        {/* Customer */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5 mt-2">
                          <p className="text-sm text-[#2c2825] font-medium">{order.customer_name || "—"}</p>
                          <p className="text-sm text-[#8a8178]">{order.customer_email || "—"}</p>
                          <p className="text-sm text-[#8a8178]">{order.customer_phone || "—"}</p>
                          {addressParts.length > 0 && (
                            <p className="text-sm text-[#8a8178] sm:col-span-2">{addressParts.join(", ")}</p>
                          )}
                          {order.customer_comment && (
                            <p className="text-xs text-[#b8b0a8] italic sm:col-span-2">💬 {order.customer_comment}</p>
                          )}
                        </div>

                        {/* Items */}
                        {order.items?.length > 0 && (
                          <div className="mt-3 space-y-0.5">
                            {order.items.map((item, i) => (
                              <p key={i} className="text-xs text-[#8a8178]">
                                • {item.sku ? <span className="font-mono">[{item.sku}]</span> : ""} {item.title} — {item.quantity} м{item.price ? ` (${item.price})` : ""}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Tracking info (if shipped) */}
                        {isShipped && order.tracking_number && (
                          <div className="mt-3 flex items-center gap-2 text-sm">
                            <span className="text-[#8a8178]">📦 {order.tracking_carrier}:</span>
                            <span className="font-mono font-semibold text-[#2c2825]">{order.tracking_number}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 shrink-0">
                        {!isShipped && (
                          <button
                            onClick={() => {
                              setShippingOrderId(isShipping ? null : order.id);
                              setTrackingNumber("");
                              setShippingError("");
                            }}
                            className="px-3 py-1.5 text-sm bg-[#2c2825] text-white hover:bg-[#3d3632] transition-colors"
                          >
                            Отправить
                          </button>
                        )}
                        {waPhone && isShipped && (
                          <a
                            href={`https://wa.me/${waPhone}?text=${waText}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-sm text-center border border-[#e8e0d8] text-[#2c2825] hover:bg-[#f5f0eb] transition-colors"
                          >
                            WA ещё раз
                          </a>
                        )}
                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteOrder(order.id, order.order_number)}
                          title="Удалить заказ"
                          className="self-end p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Shipping form */}
                    {isShipping && (
                      <div className="border-t border-[#e8e0d8] bg-[#faf9f7] p-4">
                        <p className="text-sm font-medium text-[#2c2825] mb-3">Данные отправки</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex-1">
                            <label className="block text-xs text-[#8a8178] mb-1">Служба доставки</label>
                            <select
                              value={trackingCarrier}
                              onChange={(e) => setTrackingCarrier(e.target.value)}
                              className="w-full py-2 px-3 bg-white border border-[#e8e0d8] text-sm text-[#2c2825] focus:outline-none focus:border-[#8a8178]"
                            >
                              {CARRIERS.map((c) => <option key={c}>{c}</option>)}
                            </select>
                          </div>
                          <div className="flex-[2]">
                            <label className="block text-xs text-[#8a8178] mb-1">Трек-номер *</label>
                            <input
                              type="text"
                              value={trackingNumber}
                              onChange={(e) => { setTrackingNumber(e.target.value); setShippingError(""); }}
                              placeholder="Например: 1234567890"
                              className="w-full py-2 px-3 bg-white border border-[#e8e0d8] text-sm font-mono text-[#2c2825] focus:outline-none focus:border-[#8a8178]"
                              autoFocus
                            />
                          </div>
                        </div>

                        {shippingError && <p className="text-xs text-red-500 mt-2">{shippingError}</p>}

                        <div className="flex flex-wrap gap-2 mt-3">
                          <button
                            onClick={() => handleSendTracking(order.id)}
                            disabled={shippingSending}
                            className="px-5 py-2 bg-[#2c2825] text-white text-sm hover:bg-[#3d3632] transition-colors disabled:opacity-50"
                          >
                            {shippingSending ? "Отправляю..." : "📧 Отправить email клиенту"}
                          </button>
                          {waPhone && trackingNumber && (
                            <a
                              href={`https://wa.me/${waPhone}?text=${encodeURIComponent(
                                `Здравствуйте, ${order.customer_name}! Ваш заказ ${order.order_number} отправлен.\nСлужба доставки: ${trackingCarrier}\nТрек-номер: ${trackingNumber}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-5 py-2 border border-[#e8e0d8] text-sm text-[#2c2825] hover:bg-[#f5f0eb] transition-colors"
                            >
                              💬 Открыть WhatsApp
                            </a>
                          )}
                          <button
                            onClick={() => { setShippingOrderId(null); setShippingError(""); }}
                            className="px-4 py-2 text-sm text-[#8a8178] hover:text-[#2c2825] transition-colors"
                          >
                            Отмена
                          </button>
                        </div>
                        <p className="text-xs text-[#b8b0a8] mt-2">
                          Email будет отправлен на: <strong>{order.customer_email || "—"}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CHATS TAB ── */}
        {adminTab === "chats" && (
          <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[400px]">
            {/* Users list */}
            <div className="w-64 shrink-0 bg-white border border-[#e8e0d8] flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-[#e8e0d8] flex items-center justify-between">
                <span className="text-sm font-medium text-[#2c2825]">Диалоги</span>
                <button onClick={fetchChatUsers} className="text-[#8a8178] hover:text-[#2c2825] transition-colors" title="Обновить">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {chatsLoading && chatUsers.length === 0 && (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border-2 border-[#e8e0d8] border-t-[#2c2825] rounded-full animate-spin" />
                  </div>
                )}
                {!chatsLoading && chatUsers.length === 0 && (
                  <div className="text-center py-8 px-4">
                    <p className="text-sm text-[#b8b0a8]">Чатов пока нет</p>
                    <div className="mt-4 bg-amber-50 border border-amber-200 p-3 text-left">
                      <p className="text-[10px] font-semibold text-amber-800 mb-1">⚠️ Нужна таблица в Supabase</p>
                      <pre className="text-[9px] text-amber-700 whitespace-pre-wrap overflow-x-auto">{`CREATE TABLE chat_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES chat_users(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  is_admin boolean NOT NULL DEFAULT false,
  attached_post jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE chat_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;`}</pre>
                    </div>
                  </div>
                )}
                {chatUsers.map((u) => {
                  const isActive = activeChatUserId === u.id;
                  const lastText = u.last_message
                    ? (u.last_message.content
                        || (u.last_message.attached_cart ? `🛒 Корзина · ${u.last_message.attached_cart.items?.length ?? 0}` : "")
                        || (u.last_message.attached_post ? "📎 Ткань" : ""))
                    : "Нет сообщений";
                  return (
                    <button
                      key={u.id}
                      onClick={() => openChatWith(u)}
                      className={`w-full text-left px-4 py-3 border-b border-[#f0ebe5] transition-colors ${
                        isActive ? "bg-[#f5f0eb]" : "hover:bg-[#faf9f7]"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm font-medium truncate flex-1 ${u.unread_count > 0 ? "text-[#2c2825]" : "text-[#2c2825]"}`}>
                          {u.nickname}
                        </span>
                        {u.unread_count > 0 && (
                          <span className="bg-[#2c2825] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                            {u.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8a8178] truncate">{lastText}</p>
                      {u.last_message && (
                        <p className="text-[9px] text-[#b8b0a8] mt-0.5">
                          {new Date(u.last_message.created_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 bg-white border border-[#e8e0d8] flex flex-col overflow-hidden">
              {!activeChatUserId ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-[#b8b0a8] text-sm">Выберите диалог слева</p>
                </div>
              ) : (() => {
                const activeUser = chatUsers.find((u) => u.id === activeChatUserId);
                return (
                  <>
                    {/* Chat header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-[#e8e0d8] shrink-0">
                      <div>
                        <p className="font-medium text-[#2c2825]">{activeUser?.nickname}</p>
                        <p className="text-xs text-[#8a8178]">
                          {activeUser?.created_at && `Зарегистрирован ${new Date(activeUser.created_at).toLocaleDateString("ru-RU")}`}
                        </p>
                      </div>
                      <button
                        onClick={() => activeChatUserId && handleDeleteChat(activeChatUserId)}
                        title="Удалить чат"
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#faf9f7]">
                      {chatMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.is_admin ? "justify-end" : "justify-start"}`}>
                          <div className={`${msg.attached_cart ? "max-w-[90%] w-[420px]" : "max-w-[75%]"} flex flex-col ${msg.is_admin ? "items-end" : "items-start"}`}>
                            {!msg.is_admin && (
                              <p className="text-[9px] uppercase tracking-widest text-[#8a8178] mb-1">{activeUser?.nickname}</p>
                            )}
                            {msg.attached_post && (
                              <a
                                href={`/?post=${msg.attached_post.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2.5 mb-1 bg-white border border-[#e8e0d8] w-full hover:border-[#2c2825] hover:bg-[#faf9f7] transition-colors group"
                                style={{ borderRadius: 8 }}
                              >
                                {msg.attached_post.image && (
                                  <img src={msg.attached_post.image} alt="" className="w-10 h-10 object-cover shrink-0" style={{ borderRadius: 4 }} />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-[9px] uppercase tracking-widest text-[#8a8178] mb-0.5">Ткань:</p>
                                  {msg.attached_post.sku && <p className="text-[10px] text-[#8a8178] font-mono">[{msg.attached_post.sku}]</p>}
                                  <p className="text-xs font-medium text-[#2c2825] truncate">{msg.attached_post.title}</p>
                                  {msg.attached_post.price && <p className="text-[11px] text-[#8a8178]">{msg.attached_post.price}</p>}
                                </div>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8a8178" strokeWidth="2" className="shrink-0 group-hover:stroke-[#2c2825] transition-colors">
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                                </svg>
                              </a>
                            )}

                            {/* Forwarded cart — each row links to the product */}
                            {msg.attached_cart && msg.attached_cart.items?.length > 0 && (
                              <div className="w-full mb-1 bg-white border border-[#e8e0d8] overflow-hidden" style={{ borderRadius: 8 }}>
                                <div className="flex items-center gap-1.5 px-3 py-2 bg-[#f5f0eb] border-b border-[#e8e0d8]">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8a8178" strokeWidth="2">
                                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
                                  </svg>
                                  <p className="text-[10px] uppercase tracking-widest text-[#8a8178]">
                                    Корзина клиента · {msg.attached_cart.items.length} поз.
                                  </p>
                                </div>
                                <div className="divide-y divide-[#f0ebe5]">
                                  {msg.attached_cart.items.map((ci, i) => (
                                    <a
                                      key={i}
                                      href={`/?post=${ci.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#faf9f7] transition-colors group/row"
                                    >
                                      {ci.image && <img src={ci.image} alt="" className="w-9 h-9 object-cover shrink-0" style={{ borderRadius: 3 }} />}
                                      <div className="min-w-0 flex-1">
                                        {ci.sku && <p className="text-[9px] text-[#b8b0a8] font-mono">[{ci.sku}]</p>}
                                        <p className="text-xs font-medium text-[#2c2825] truncate">{ci.title}</p>
                                        <p className="text-[10px] text-[#8a8178]">{ci.quantity} м{ci.price ? ` × ${ci.price.replace(/\/.*/, "")}` : ""}</p>
                                      </div>
                                      {ci.lineTotal && <span className="text-xs font-medium text-[#2c2825] shrink-0">{ci.lineTotal}</span>}
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#c8c0b8" strokeWidth="2" className="shrink-0 group-hover/row:stroke-[#2c2825] transition-colors">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                                      </svg>
                                    </a>
                                  ))}
                                </div>
                                {msg.attached_cart.total && (
                                  <div className="flex items-center justify-between px-3 py-2.5 bg-[#f5f0eb] border-t border-[#e8e0d8]">
                                    <span className="text-[10px] uppercase tracking-widest text-[#8a8178]">Итого</span>
                                    <span className="text-sm font-semibold text-[#2c2825]">{msg.attached_cart.total}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {msg.content && (
                              <div className={`px-3 py-2 text-sm leading-relaxed ${
                                msg.is_admin
                                  ? "bg-[#2c2825] text-white"
                                  : "bg-white text-[#2c2825] border border-[#e8e0d8]"
                              }`} style={{ borderRadius: msg.is_admin ? "10px 0 10px 10px" : "0 10px 10px 10px" }}>
                                {msg.content}
                              </div>
                            )}
                            <p className="text-[9px] text-[#b8b0a8] mt-0.5">
                              {new Date(msg.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Reply input */}
                    <div className="shrink-0 border-t border-[#e8e0d8] p-3 bg-white flex gap-2 items-end">
                      <textarea
                        value={chatReply}
                        onChange={(e) => setChatReply(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                        placeholder="Ответить..."
                        rows={1}
                        className="flex-1 py-2 px-3 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] placeholder-[#b8b0a8] focus:outline-none focus:border-[#8a8178] resize-none"
                        style={{ borderRadius: 6 }}
                        onInput={(e) => {
                          const t = e.currentTarget;
                          t.style.height = "auto";
                          t.style.height = Math.min(t.scrollHeight, 100) + "px";
                        }}
                      />
                      <button
                        onClick={handleSendReply}
                        disabled={chatSending || !chatReply.trim()}
                        className="w-9 h-9 bg-[#2c2825] text-white flex items-center justify-center hover:bg-[#3d3632] transition-colors disabled:opacity-40 shrink-0"
                        style={{ borderRadius: 6 }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>
                        </svg>
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── PROMO TAB ── */}
        {adminTab === "promo" && (
          <div className="space-y-6">
            {/* Create form */}
            <div className="bg-white border border-[#e8e0d8] p-6">
              <h2 className="font-heading text-xl font-semibold text-[#2c2825] mb-4">Новый промокод</h2>
              <form onSubmit={handleCreatePromo} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#8a8178] mb-1">Код *</label>
                    <input
                      type="text"
                      value={promoForm.code}
                      onChange={(e) => setPromoForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                      placeholder="SUMMER20"
                      className="w-full py-2.5 px-3 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] font-mono uppercase tracking-widest focus:outline-none focus:border-[#8a8178]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8a8178] mb-1">Скидка (%) *</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={promoForm.discount_percent}
                      onChange={(e) => setPromoForm((p) => ({ ...p, discount_percent: e.target.value }))}
                      placeholder="15"
                      className="w-full py-2.5 px-3 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] focus:outline-none focus:border-[#8a8178]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8a8178] mb-1">
                      Дата окончания
                      <span className="ml-1 text-[#b8b0a8]">(оставьте пустым — бессрочно)</span>
                    </label>
                    <input
                      type="date"
                      value={promoForm.expires_at}
                      onChange={(e) => setPromoForm((p) => ({ ...p, expires_at: e.target.value }))}
                      className="w-full py-2.5 px-3 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] focus:outline-none focus:border-[#8a8178]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8a8178] mb-1">
                      Макс. использований
                      <span className="ml-1 text-[#b8b0a8]">(оставьте пустым — без лимита)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={promoForm.max_uses}
                      onChange={(e) => setPromoForm((p) => ({ ...p, max_uses: e.target.value }))}
                      placeholder="∞"
                      className="w-full py-2.5 px-3 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] focus:outline-none focus:border-[#8a8178]"
                    />
                  </div>
                </div>
                {promoError && <p className="text-xs text-red-500">{promoError}</p>}
                <button
                  type="submit"
                  disabled={promoSaving}
                  className="px-6 py-2.5 bg-[#2c2825] text-white text-sm font-heading tracking-wide hover:bg-[#3d3632] transition-colors disabled:opacity-50"
                >
                  {promoSaving ? "Сохранение..." : "Создать промокод"}
                </button>
              </form>
            </div>

            {/* Promo list */}
            {promosLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#e8e0d8] border-t-[#2c2825] rounded-full animate-spin" />
              </div>
            ) : promos.length === 0 ? (
              <div className="text-center py-10 bg-white border border-[#e8e0d8]">
                <p className="text-[#8a8178]">Промокодов пока нет</p>
                <div className="mt-4 bg-amber-50 border border-amber-200 p-4 text-left max-w-xl mx-auto">
                  <p className="text-xs font-semibold text-amber-800 mb-2">⚠️ Если промокоды не создаются — нужно создать таблицу в Supabase</p>
                  <pre className="bg-white border border-amber-200 text-xs text-[#2c2825] p-3 overflow-x-auto leading-relaxed whitespace-pre-wrap">{`CREATE TABLE promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_percent integer NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  expires_at timestamptz,
  max_uses integer,
  uses_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION increment_promo_uses(promo_code_val text)
RETURNS void AS $$
  UPDATE promo_codes SET uses_count = uses_count + 1 WHERE code = promo_code_val;
$$ LANGUAGE sql;`}</pre>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {promos.map((promo) => {
                  const expired = promo.expires_at && new Date(promo.expires_at) < new Date();
                  const usedUp = promo.max_uses !== null && promo.uses_count >= promo.max_uses;
                  const statusColor = !promo.is_active ? "bg-gray-100 text-gray-500" : expired ? "bg-red-100 text-red-600" : usedUp ? "bg-orange-100 text-orange-600" : "bg-emerald-100 text-emerald-700";
                  const statusLabel = !promo.is_active ? "Отключён" : expired ? "Истёк" : usedUp ? "Исчерпан" : "Активен";

                  return (
                    <div key={promo.id} className="bg-white border border-[#e8e0d8] p-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono font-bold text-[#2c2825] text-base tracking-wider">{promo.code}</span>
                          <span className={`text-[10px] px-2 py-0.5 uppercase tracking-wider font-medium ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[#8a8178]">
                          <span>Скидка: <strong className="text-[#2c2825]">−{promo.discount_percent}%</strong></span>
                          <span>Использований: <strong className="text-[#2c2825]">{promo.uses_count}{promo.max_uses ? ` / ${promo.max_uses}` : ""}</strong></span>
                          {promo.expires_at && (
                            <span>До: <strong className={expired ? "text-red-500" : "text-[#2c2825]"}>
                              {new Date(promo.expires_at).toLocaleDateString("ru-RU")}
                            </strong></span>
                          )}
                          {!promo.expires_at && !promo.max_uses && <span className="text-[#b8b0a8]">бессрочный · без лимита</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Toggle active */}
                        <button
                          onClick={() => handleTogglePromo(promo.id, !promo.is_active)}
                          title={promo.is_active ? "Отключить" : "Включить"}
                          className={`relative w-10 h-5 transition-colors ${promo.is_active ? "bg-[#2c2825]" : "bg-[#e8e0d8]"}`}
                        >
                          <span
                            className="absolute top-[2px] left-[2px] w-[16px] h-[16px] bg-white transition-transform"
                            style={{ transform: promo.is_active ? "translateX(20px)" : "translateX(0)" }}
                          />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDeletePromo(promo.id)}
                          title="Удалить"
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── POSTS TAB ── */}
        {adminTab === "posts" && <>

        {/* Post form */}
        {showForm && (
          <div className="bg-white border border-[#e8e0d8] p-6 lg:p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl font-semibold text-[#2c2825]">
                {editing ? "Редактировать запись" : "Новая запись"}
              </h2>
              <button
                onClick={resetForm}
                className="p-1 text-[#8a8178] hover:text-[#2c2825]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={savePost} className="space-y-5">
              <div>
                <label className="block text-sm text-[#2c2825] mb-1.5">Название</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full py-2.5 px-4 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] focus:outline-none focus:border-[#8a8178]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#2c2825] mb-1.5">Описание</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full py-2.5 px-4 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] focus:outline-none focus:border-[#8a8178] resize-y"
                />
              </div>

              {/* Auto-translate */}
              <div className="border border-[#e8e0d8] p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#2c2825]">Переводы (EN / CZ)</span>
                  <button
                    type="button"
                    onClick={handleTranslate}
                    disabled={translating || (!title.trim() && !description.trim())}
                    className="flex items-center gap-2 px-4 py-2 bg-[#2c2825] text-white text-sm hover:bg-[#3d3632] transition-colors disabled:opacity-40"
                  >
                    {translating ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Перевожу...
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m5 8 6 6M4 14l6-6 2-2M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6" />
                        </svg>
                        Перевести автоматически
                      </>
                    )}
                  </button>
                </div>

                {/* EN */}
                <div className="space-y-2">
                  <p className="text-xs text-[#8a8178] uppercase tracking-widest">English</p>
                  <input
                    type="text"
                    value={translations.en?.title || ""}
                    onChange={(e) => setTranslations((prev) => ({ ...prev, en: { ...prev.en, title: e.target.value, description: prev.en?.description || "" } }))}
                    placeholder="Title EN"
                    className="w-full py-2 px-3 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] placeholder-[#8a8178] focus:outline-none focus:border-[#8a8178]"
                  />
                  <textarea
                    value={translations.en?.description || ""}
                    onChange={(e) => setTranslations((prev) => ({ ...prev, en: { title: prev.en?.title || "", description: e.target.value } }))}
                    placeholder="Description EN"
                    rows={3}
                    className="w-full py-2 px-3 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] placeholder-[#8a8178] focus:outline-none focus:border-[#8a8178] resize-y"
                  />
                </div>

                {/* CS */}
                <div className="space-y-2">
                  <p className="text-xs text-[#8a8178] uppercase tracking-widest">Čeština</p>
                  <input
                    type="text"
                    value={translations.cs?.title || ""}
                    onChange={(e) => setTranslations((prev) => ({ ...prev, cs: { ...prev.cs, title: e.target.value, description: prev.cs?.description || "" } }))}
                    placeholder="Title CZ"
                    className="w-full py-2 px-3 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] placeholder-[#8a8178] focus:outline-none focus:border-[#8a8178]"
                  />
                  <textarea
                    value={translations.cs?.description || ""}
                    onChange={(e) => setTranslations((prev) => ({ ...prev, cs: { title: prev.cs?.title || "", description: e.target.value } }))}
                    placeholder="Description CZ"
                    rows={3}
                    className="w-full py-2 px-3 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] placeholder-[#8a8178] focus:outline-none focus:border-[#8a8178] resize-y"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#2c2825] mb-1.5">Цена</label>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="€150/м"
                    className="w-full py-2.5 px-4 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] placeholder-[#8a8178] focus:outline-none focus:border-[#8a8178]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#2c2825] mb-1.5">Артикул (SKU)</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="SILK-001"
                    className="w-full py-2.5 px-4 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] placeholder-[#8a8178] focus:outline-none focus:border-[#8a8178]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#2c2825] mb-1.5">
                  Остаток на складе (м)
                  <span className="ml-2 text-xs text-[#8a8178]">оставьте пустым — без ограничений</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={stockMeters}
                  onChange={(e) => setStockMeters(e.target.value)}
                  placeholder="Например: 3.35"
                  className="w-full py-2.5 px-4 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] placeholder-[#8a8178] focus:outline-none focus:border-[#8a8178]"
                />
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
                  {uploadError}
                </div>
              )}

              {/* Photos */}
              <div>
                <label className="block text-sm text-[#2c2825] mb-1.5">
                  Фотографии ({images.length})
                </label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {images.map((url, i) => (
                    <div key={i} className="relative w-24 h-24 bg-[#f5f0eb]">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 border border-[#e8e0d8] text-sm text-[#8a8178] hover:bg-[#f5f0eb] transition-colors cursor-pointer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {uploading ? "Загрузка..." : "Загрузить фото"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Videos */}
              <div>
                <label className="block text-sm text-[#2c2825] mb-1.5">
                  Видео ({videos.length})
                </label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {videos.map((url, i) => (
                    <div key={i} className="relative w-32 h-24 bg-[#1a1a1a]">
                      <video src={url} className="w-full h-full object-cover" muted />
                      <button
                        type="button"
                        onClick={() => removeVideo(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white" opacity="0.7">
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 border border-[#e8e0d8] text-sm text-[#8a8178] hover:bg-[#f5f0eb] transition-colors cursor-pointer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                  {uploading ? "Загрузка..." : "Загрузить видео"}
                  <input
                    type="file"
                    accept="video/*,video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm,.avi"
                    multiple
                    onChange={handleVideoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm text-[#2c2825] mb-3">
                  Категории ткани
                  {categories.length > 0 && (
                    <span className="ml-2 text-xs text-[#8a8178]">выбрано: {categories.length}</span>
                  )}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FABRIC_CATEGORIES.filter((c) => c !== "Новинки").map((cat) => {
                    const active = categories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm border transition-colors text-left ${
                          active
                            ? "bg-[#2c2825] text-white border-[#2c2825]"
                            : "bg-white text-[#2c2825] border-[#e8e0d8] hover:bg-[#f5f0eb]"
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 ${
                          active ? "border-white" : "border-[#8a8178]"
                        }`}>
                          {active && (
                            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1.5 5l2.5 2.5 4.5-4.5" />
                            </svg>
                          )}
                        </span>
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Is New toggle — fixed */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isNew}
                  onClick={() => setIsNew(!isNew)}
                  className={`relative w-11 h-6 rounded-none transition-colors ${
                    isNew ? "bg-[#2c2825]" : "bg-[#e8e0d8]"
                  }`}
                >
                  <span
                    className="absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white transition-transform"
                    style={{ transform: isNew ? "translateX(20px)" : "translateX(0)" }}
                  />
                </button>
                <span className="text-sm text-[#2c2825]">Новинка</span>
              </label>

              {/* Discount toggle — shows a red ribbon on the product card */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isDiscounted}
                  onClick={() => setIsDiscounted(!isDiscounted)}
                  className={`relative w-11 h-6 rounded-none transition-colors ${
                    isDiscounted ? "bg-[#CE2B37]" : "bg-[#e8e0d8]"
                  }`}
                >
                  <span
                    className="absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white transition-transform"
                    style={{ transform: isDiscounted ? "translateX(20px)" : "translateX(0)" }}
                  />
                </button>
                <span className="text-sm text-[#2c2825]">
                  Скидка
                  <span className="ml-2 text-xs text-[#8a8178]">лента на карточке товара</span>
                </span>
              </label>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-[#2c2825] text-white font-heading text-base tracking-wide hover:bg-[#3d3632] transition-colors disabled:opacity-50"
                >
                  {saving ? "Сохранение..." : editing ? "Сохранить" : "Создать"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-[#e8e0d8] text-sm text-[#8a8178] hover:bg-[#f5f0eb] transition-colors"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts list */}
        <div className="space-y-3">
          {/* Search bar */}
          {posts.length > 0 && (
            <div className="relative mb-2">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8178] pointer-events-none"
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="Поиск по артикулу или названию..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#e8e0d8] text-sm text-[#2c2825] placeholder-[#b8b0a8] focus:outline-none focus:border-[#8a8178]"
              />
              {adminSearch && (
                <button
                  onClick={() => setAdminSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b8b0a8] hover:text-[#2c2825]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {posts.length === 0 && !showForm && (
            <div className="text-center py-16">
              <p className="font-heading text-2xl text-[#8a8178] mb-3">Нет записей</p>
              <button
                onClick={startNew}
                className="px-6 py-3 bg-[#2c2825] text-white font-heading tracking-wide hover:bg-[#3d3632] transition-colors"
              >
                Создать первую запись
              </button>
            </div>
          )}

          {(() => {
            const q = adminSearch.trim().toLowerCase();
            const filtered = q
              ? posts.filter(
                  (p) =>
                    p.title.toLowerCase().includes(q) ||
                    (p.sku && p.sku.toLowerCase().includes(q))
                )
              : posts;

            if (q && filtered.length === 0) {
              return (
                <div className="text-center py-10">
                  <p className="text-[#8a8178]">Ничего не найдено по запросу «{adminSearch}»</p>
                </div>
              );
            }

            return filtered.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-[#e8e0d8] p-4 flex items-center gap-4"
            >
              {/* Thumbnail */}
              <div className="w-16 h-16 bg-[#f5f0eb] shrink-0">
                {post.images?.[0] ? (
                  <img
                    src={post.images[0]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#8a8178] text-xs">
                    —
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-heading text-lg text-[#2c2825] truncate">
                    {post.title}
                  </h3>
                  {post.is_new && (
                    <span className="text-[10px] bg-[#2c2825] text-white px-1.5 py-0.5 uppercase tracking-wider shrink-0">
                      New
                    </span>
                  )}
                  {post.is_discounted && (
                    <span className="text-[10px] bg-[#CE2B37] text-white px-1.5 py-0.5 uppercase tracking-wider shrink-0">
                      Скидка
                    </span>
                  )}
                  {post.stock_meters === 0 && (
                    <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 uppercase tracking-wider shrink-0">
                      Нет в наличии
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {post.sku && (
                    <span className="text-xs font-mono text-[#2c2825] bg-[#f5f0eb] px-1.5 py-0.5">
                      {post.sku}
                    </span>
                  )}
                  {post.stock_meters != null && (
                    <span className={`text-xs font-medium ${post.stock_meters === 0 ? "text-red-500" : "text-emerald-700"}`}>
                      {post.stock_meters === 0 ? "0 м" : `${post.stock_meters} м`}
                    </span>
                  )}
                  {post.price && (
                    <span className="text-xs text-[#2c2825]">{post.price}</span>
                  )}
                  <span className="text-xs text-[#8a8178]">
                    {post.images?.length || 0} фото
                  </span>
                  {(post.videos?.length || 0) > 0 && (
                    <span className="text-xs text-[#8a8178]">
                      {post.videos.length} видео
                    </span>
                  )}
                  {(post.categories?.length || 0) > 0 && (
                    <span className="text-xs text-[#8a8178] truncate max-w-[200px]">
                      {post.categories.join(", ")}
                    </span>
                  )}
                  <span className="text-xs text-[#b8b0a8]">
                    {new Date(post.created_at).toLocaleDateString("ru-RU")}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => startEdit(post)}
                  className="px-3 py-1.5 text-sm text-[#2c2825] border border-[#e8e0d8] hover:bg-[#f5f0eb] transition-colors"
                >
                  Изменить
                </button>
                <button
                  onClick={() => deletePost(post.id)}
                  className="px-3 py-1.5 text-sm text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                >
                  Удалить
                </button>
              </div>
            </div>
            ));
          })()}
        </div>

        </> /* end posts tab */}
      </div>
    </div>
  );
}
