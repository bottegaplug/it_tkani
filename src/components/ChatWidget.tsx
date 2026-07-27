"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useChat, type CartSnapshot } from "@/context/ChatContext";
import { useLang } from "@/context/LanguageContext";

interface AttachedPost {
  id: string;
  title: string;
  price?: string;
  image?: string;
  sku?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  is_admin: boolean;
  attached_post: AttachedPost | null;
  attached_cart: CartSnapshot | null;
  is_read: boolean;
  created_at: string;
}

const LABELS = {
  ru: {
    tab: "Чат",
    loginTitle: "Войти в чат",
    registerTitle: "Регистрация",
    nickLabel: "Никнейм",
    nickPlaceholder: "Ваш никнейм...",
    passLabel: "Пароль",
    passPlaceholder: "Минимум 4 символа",
    loginBtn: "Войти",
    registerBtn: "Зарегистрироваться",
    switchToRegister: "Нет аккаунта? Зарегистрироваться",
    switchToLogin: "Уже есть аккаунт? Войти",
    errTaken: "Этот никнейм занят",
    errNotFound: "Никнейм не найден",
    errWrongPass: "Неверный пароль",
    errShortPass: "Пароль минимум 4 символа",
    placeholder: "Напишите сообщение...",
    adminLabel: "Администратор",
    forwarded: "Переслал ткань:",
    viewProduct: "Смотреть товар →",
    queued: "Отправится после входа:",
    cartTitle: "Корзина",
    cartTotal: "Итого",
    cartQueued: "Корзина отправится после входа",
    deletedNotice: "Чат был закрыт администратором. Зарегистрируйтесь заново, чтобы продолжить.",
  },
  en: {
    tab: "Chat",
    loginTitle: "Sign in to chat",
    registerTitle: "Register",
    nickLabel: "Nickname",
    nickPlaceholder: "Your nickname...",
    passLabel: "Password",
    passPlaceholder: "At least 4 characters",
    loginBtn: "Sign in",
    registerBtn: "Register",
    switchToRegister: "No account? Register",
    switchToLogin: "Have an account? Sign in",
    errTaken: "This nickname is taken",
    errNotFound: "Nickname not found",
    errWrongPass: "Wrong password",
    errShortPass: "Password must be at least 4 characters",
    placeholder: "Write a message...",
    adminLabel: "Admin",
    forwarded: "Forwarded fabric:",
    viewProduct: "View product →",
    queued: "Will be sent after sign-in:",
    cartTitle: "Cart",
    cartTotal: "Total",
    cartQueued: "Cart will be sent after sign-in",
    deletedNotice: "This chat was closed by the admin. Register again to continue.",
  },
  cs: {
    tab: "Chat",
    loginTitle: "Přihlásit se",
    registerTitle: "Registrace",
    nickLabel: "Přezdívka",
    nickPlaceholder: "Vaše přezdívka...",
    passLabel: "Heslo",
    passPlaceholder: "Alespoň 4 znaky",
    loginBtn: "Přihlásit se",
    registerBtn: "Zaregistrovat se",
    switchToRegister: "Nemáte účet? Zaregistrujte se",
    switchToLogin: "Máte účet? Přihlaste se",
    errTaken: "Tato přezdívka je obsazena",
    errNotFound: "Přezdívka nenalezena",
    errWrongPass: "Špatné heslo",
    errShortPass: "Heslo musí mít alespoň 4 znaky",
    placeholder: "Napište zprávu...",
    adminLabel: "Administrátor",
    forwarded: "Přeposlal látku:",
    viewProduct: "Zobrazit produkt →",
    queued: "Odešle se po přihlášení:",
    cartTitle: "Košík",
    cartTotal: "Celkem",
    cartQueued: "Košík se odešle po přihlášení",
    deletedNotice: "Chat byl uzavřen administrátorem. Zaregistrujte se znovu.",
  },
};

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatWidget() {
  const { chatUser, setChatUser, isOpen, openChat, closeChat, pendingPost, clearPendingPost, pendingCart, clearPendingCart } = useChat();
  const { lang } = useLang();
  const lbl = LABELS[lang] ?? LABELS.en;

  // "login" | "register" | "chat"
  const [view, setView] = useState<"login" | "register" | "chat">(chatUser ? "chat" : "login");
  const [nick, setNick] = useState("");
  const [pass, setPass] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletedNotice, setDeletedNotice] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setView(chatUser ? "chat" : "login");
  }, [chatUser]);

  const fetchMessages = useCallback(async () => {
    if (!chatUser) return;
    try {
      const res = await fetch(`/api/chat?action=messages&userId=${chatUser.id}`);
      if (res.status === 410) {
        // Admin deleted this account — sign out instead of failing silently
        setChatUser(null);
        setMessages([]);
        setDeletedNotice(true);
        return;
      }
      if (res.ok) setMessages(await res.json());
    } catch { /* ignore */ }
  }, [chatUser, setChatUser]);

  useEffect(() => {
    if (isOpen && chatUser) {
      fetchMessages();
      pollRef.current = setInterval(fetchMessages, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isOpen, chatUser, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-send pending forwarded post — only once the user is signed in.
  // Until then the post stays queued and the auth screen explains why.
  useEffect(() => {
    if (!pendingPost || !chatUser || !isOpen) return;
    const post = pendingPost;
    clearPendingPost();
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send",
        userId: chatUser.id,
        content: "",
        attachedPost: { id: post.id, title: post.title, price: post.price, image: post.images?.[0], sku: post.sku },
      }),
    })
      .then(() => fetchMessages())
      .catch(() => { /* network hiccup — message simply isn't sent */ });
  }, [pendingPost, chatUser, isOpen, clearPendingPost, fetchMessages]);

  // Same for a forwarded cart snapshot
  useEffect(() => {
    if (!pendingCart || !chatUser || !isOpen) return;
    const cart = pendingCart;
    clearPendingCart();
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", userId: chatUser.id, content: "", attachedCart: cart }),
    })
      .then(() => fetchMessages())
      .catch(() => { /* ignore */ });
  }, [pendingCart, chatUser, isOpen, clearPendingCart, fetchMessages]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const n = nick.trim(), p = pass.trim();
    if (!n || !p) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", nickname: n, password: p }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error === "not_found" ? lbl.errNotFound : data.error === "wrong_password" ? lbl.errWrongPass : data.error);
        return;
      }
      setChatUser({ id: data.id, nickname: data.nickname });
      setPass("");
      setDeletedNotice(false);
    } finally { setSubmitting(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const n = nick.trim(), p = pass.trim();
    if (!n || !p) return;
    if (p.length < 4) { setFormError(lbl.errShortPass); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", nickname: n, password: p }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error === "taken" ? lbl.errTaken : data.error === "short_password" ? lbl.errShortPass : data.error);
        return;
      }
      setChatUser({ id: data.id, nickname: data.nickname });
      setPass("");
      setDeletedNotice(false);
    } finally { setSubmitting(false); }
  };

  const handleSend = async () => {
    if (!chatUser || !input.trim()) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", userId: chatUser.id, content: text }),
      });
      if (res.status === 410) {
        setChatUser(null);
        setMessages([]);
        setDeletedNotice(true);
        return;
      }
      await fetchMessages();
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const switchView = (v: "login" | "register") => {
    setView(v);
    setFormError("");
    setPass("");
  };

  // Plain helper — NOT a component. Defining a component inside the render body
  // would remount the form on every keystroke and steal focus.
  const renderAuthForm = (mode: "login" | "register") => (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-14 h-14 bg-[#f5f0eb] flex items-center justify-center mb-5" style={{ borderRadius: 12 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8a8178" strokeWidth="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <h3 className="font-heading text-xl font-semibold text-[#2c2825] mb-6">
        {mode === "login" ? lbl.loginTitle : lbl.registerTitle}
      </h3>

      {/* Account was removed by the admin */}
      {deletedNotice && (
        <div className="w-full mb-4 p-3 bg-amber-50 border border-amber-200" style={{ borderRadius: 8 }}>
          <p className="text-xs text-amber-800 leading-relaxed">{lbl.deletedNotice}</p>
        </div>
      )}

      {/* Queued fabric — explains why sign-in is needed right now */}
      {pendingPost && (
        <div className="w-full mb-4 p-2.5 bg-[#f5f0eb] border border-[#e8e0d8] flex items-center gap-2.5" style={{ borderRadius: 8 }}>
          {pendingPost.images?.[0] && (
            <img src={pendingPost.images[0]} alt="" className="w-10 h-10 object-cover shrink-0" style={{ borderRadius: 4 }} />
          )}
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-widest text-[#8a8178] mb-0.5">{lbl.queued}</p>
            <p className="text-xs font-medium text-[#2c2825] truncate">{pendingPost.title}</p>
          </div>
        </div>
      )}

      {/* Queued cart */}
      {pendingCart && pendingCart.items.length > 0 && (
        <div className="w-full mb-4 p-2.5 bg-[#f5f0eb] border border-[#e8e0d8] flex items-center gap-2.5" style={{ borderRadius: 8 }}>
          <div className="w-10 h-10 bg-white flex items-center justify-center shrink-0" style={{ borderRadius: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a8178" strokeWidth="1.6">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-widest text-[#8a8178] mb-0.5">{lbl.cartQueued}</p>
            <p className="text-xs font-medium text-[#2c2825]">
              {lbl.cartTitle} · {pendingCart.items.length}{pendingCart.total ? ` · ${pendingCart.total}` : ""}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="w-full space-y-3">
        <div>
          <label className="block text-xs text-[#8a8178] mb-1">{lbl.nickLabel}</label>
          <input
            type="text"
            value={nick}
            onChange={(e) => { setNick(e.target.value); setFormError(""); }}
            placeholder={lbl.nickPlaceholder}
            maxLength={30}
            autoFocus
            className="w-full py-2.5 px-3 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] placeholder-[#b8b0a8] focus:outline-none focus:border-[#8a8178]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#8a8178] mb-1">{lbl.passLabel}</label>
          <input
            type="password"
            value={pass}
            onChange={(e) => { setPass(e.target.value); setFormError(""); }}
            placeholder={lbl.passPlaceholder}
            className="w-full py-2.5 px-3 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] placeholder-[#b8b0a8] focus:outline-none focus:border-[#8a8178]"
          />
        </div>
        {formError && <p className="text-xs text-red-500">{formError}</p>}
        <button
          type="submit"
          disabled={submitting || !nick.trim() || !pass.trim()}
          className="w-full py-3 bg-[#2c2825] text-white font-heading text-sm tracking-wide hover:bg-[#3d3632] transition-colors disabled:opacity-50"
        >
          {submitting ? "..." : mode === "login" ? lbl.loginBtn : lbl.registerBtn}
        </button>
        <button
          type="button"
          onClick={() => switchView(mode === "login" ? "register" : "login")}
          className="w-full text-xs text-[#8a8178] hover:text-[#2c2825] transition-colors text-center pt-1"
        >
          {mode === "login" ? lbl.switchToRegister : lbl.switchToLogin}
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Tab button */}
      {!isOpen && (
        <button
          onClick={openChat}
          className="fixed right-4 bottom-6 z-[70] w-13 h-13 bg-[#2c2825] text-white shadow-lg hover:bg-[#3d3632] transition-colors flex items-center justify-center"
          style={{ borderRadius: "50%", width: 52, height: 52 }}
          aria-label={lbl.tab}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[65] bg-black/20 panel-overlay" onClick={closeChat} />
          <div className="fixed right-0 top-0 h-full w-full max-w-[360px] z-[70] bg-white flex flex-col shadow-2xl panel-slide-right">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#e8e0d8] shrink-0 bg-[#2c2825] text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/10 flex items-center justify-center" style={{ borderRadius: 6 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold font-heading tracking-wide">IT Tkani</p>
                  {chatUser && <p className="text-[10px] text-white/60 uppercase tracking-widest">{chatUser.nickname}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {chatUser && (
                  <button
                    onClick={() => { setChatUser(null); setView("login"); setMessages([]); setNick(""); }}
                    className="text-[10px] text-white/50 hover:text-white/80 transition-colors uppercase tracking-wider"
                    title="Выйти"
                  >
                    ↩
                  </button>
                )}
                <button onClick={closeChat} className="p-1 text-white/60 hover:text-white transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {view === "login" && renderAuthForm("login")}
            {view === "register" && renderAuthForm("register")}

            {/* Chat view */}
            {view === "chat" && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#faf9f7]">
                  {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full py-10">
                      <p className="text-sm text-[#b8b0a8] text-center">
                        {lang === "ru" ? "Напишите нам, мы ответим скоро" : lang === "en" ? "Write to us, we'll reply soon" : "Napište nám, brzy odpovíme"}
                      </p>
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.is_admin ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[82%] flex flex-col ${msg.is_admin ? "items-start" : "items-end"}`}>
                        {msg.is_admin && (
                          <p className="text-[9px] uppercase tracking-widest text-[#8a8178] mb-1 ml-0.5">{lbl.adminLabel}</p>
                        )}
                        {msg.attached_post && (
                          <div className={`flex items-center gap-2.5 p-2.5 mb-1 w-full border ${msg.is_admin ? "bg-white border-[#e8e0d8]" : "bg-[#2c2825]/5 border-[#2c2825]/10"}`} style={{ borderRadius: 8 }}>
                            {msg.attached_post.image && (
                              <img src={msg.attached_post.image} alt="" className="w-10 h-10 object-cover shrink-0" style={{ borderRadius: 4 }} />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-[9px] uppercase tracking-widest text-[#8a8178] mb-0.5">{lbl.forwarded}</p>
                              {msg.attached_post.sku && <p className="text-[10px] text-[#8a8178] font-mono">[{msg.attached_post.sku}]</p>}
                              <p className="text-xs font-medium text-[#2c2825] truncate">{msg.attached_post.title}</p>
                              {msg.attached_post.price && <p className="text-[11px] text-[#8a8178]">{msg.attached_post.price}</p>}
                            </div>
                          </div>
                        )}

                        {/* Forwarded cart */}
                        {msg.attached_cart && msg.attached_cart.items?.length > 0 && (
                          <div className="w-full mb-1 bg-white border border-[#e8e0d8] overflow-hidden" style={{ borderRadius: 8 }}>
                            <div className="flex items-center gap-1.5 px-2.5 py-2 bg-[#f5f0eb] border-b border-[#e8e0d8]">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8a8178" strokeWidth="2">
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
                              </svg>
                              <p className="text-[9px] uppercase tracking-widest text-[#8a8178]">
                                {lbl.cartTitle} · {msg.attached_cart.items.length}
                              </p>
                            </div>
                            <div className="divide-y divide-[#f0ebe5]">
                              {msg.attached_cart.items.map((ci, i) => (
                                <div key={i} className="flex items-center gap-2 px-2.5 py-2">
                                  {ci.image && <img src={ci.image} alt="" className="w-8 h-8 object-cover shrink-0" style={{ borderRadius: 3 }} />}
                                  <div className="min-w-0 flex-1">
                                    {ci.sku && <p className="text-[9px] text-[#b8b0a8] font-mono">[{ci.sku}]</p>}
                                    <p className="text-[11px] font-medium text-[#2c2825] truncate">{ci.title}</p>
                                    <p className="text-[10px] text-[#8a8178]">{ci.quantity} м{ci.price ? ` × ${ci.price.replace(/\/.*/, "")}` : ""}</p>
                                  </div>
                                  {ci.lineTotal && <span className="text-[11px] font-medium text-[#2c2825] shrink-0">{ci.lineTotal}</span>}
                                </div>
                              ))}
                            </div>
                            {msg.attached_cart.total && (
                              <div className="flex items-center justify-between px-2.5 py-2 bg-[#f5f0eb] border-t border-[#e8e0d8]">
                                <span className="text-[10px] uppercase tracking-widest text-[#8a8178]">{lbl.cartTotal}</span>
                                <span className="text-xs font-semibold text-[#2c2825]">{msg.attached_cart.total}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {msg.content && (
                          <div className={`px-3 py-2 text-sm leading-relaxed ${
                            msg.is_admin ? "bg-white text-[#2c2825] border border-[#e8e0d8]" : "bg-[#2c2825] text-white"
                          }`} style={{ borderRadius: msg.is_admin ? "0 10px 10px 10px" : "10px 0 10px 10px" }}>
                            {msg.content}
                          </div>
                        )}
                        <p className="text-[9px] text-[#b8b0a8] mt-0.5 mx-0.5">{timeLabel(msg.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <div className="shrink-0 border-t border-[#e8e0d8] p-3 bg-white flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={lbl.placeholder}
                    rows={1}
                    className="flex-1 py-2.5 px-3 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] placeholder-[#b8b0a8] focus:outline-none focus:border-[#8a8178] resize-none leading-relaxed"
                    style={{ borderRadius: 8, maxHeight: 100, overflowY: "auto" }}
                    onInput={(e) => {
                      const t = e.currentTarget;
                      t.style.height = "auto";
                      t.style.height = Math.min(t.scrollHeight, 100) + "px";
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    className="w-10 h-10 bg-[#2c2825] text-white flex items-center justify-center hover:bg-[#3d3632] transition-colors disabled:opacity-40 shrink-0"
                    style={{ borderRadius: 8 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
