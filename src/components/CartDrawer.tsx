"use client";

import { useState, useMemo } from "react";
import { useCart } from "@/context/CartContext";
import { useLang } from "@/context/LanguageContext";
import { useChat } from "@/context/ChatContext";
import type { Lang } from "@/lib/i18n";
import type { Post } from "@/types";
import { COUNTRIES, getCountryLabel, isValidPhone, isValidEmail } from "@/lib/countries";
import { getShippingEur, shippingZoneLabel, formatShippingCost } from "@/lib/shipping";
import { EUR_TO_CZK } from "@/lib/currency";

// Parse "€150/м", "5 000 ₽", "450 Kč" → { amount, symbol, currency }
function parsePricePerMeter(raw: string): { amount: number; symbol: string; currency: string } | null {
  if (!raw) return null;
  const s = raw.replace(/\s/g, "");
  let currency = "rub", symbol = "₽";
  if (/€|eur/i.test(s)) { currency = "eur"; symbol = "€"; }
  else if (/\$|usd/i.test(s)) { currency = "usd"; symbol = "$"; }
  else if (/kč|czk/i.test(s)) { currency = "czk"; symbol = "Kč"; }
  const match = s.match(/\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const amount = parseFloat(match[0].replace(",", "."));
  if (!amount || amount <= 0) return null;
  return { amount, symbol, currency };
}

function formatMoney(amount: number, symbol: string, currency: string): string {
  const rounded = Math.round(amount);
  const n = rounded.toLocaleString("ru-RU"); // "1 500"
  return currency === "eur" || currency === "usd" ? `${symbol}${rounded.toLocaleString("en-US")}` : `${n} ${symbol}`;
}

function getTitle(post: Post, lang: Lang): string {
  if (lang !== "ru" && post.translations?.[lang]?.title) {
    return post.translations[lang]!.title;
  }
  return post.title;
}

const TelegramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

interface ContactForm {
  name: string;
  phone: string;
  email: string;
  countryCode: string;
  city: string;
  deliveryAddress: string;
  postalCode: string;
  comment: string;
}

interface FieldErrors {
  phone?: string;
  email?: string;
  general?: string;
}

export default function CartDrawer() {
  const { items, removeItem, isCartOpen, closeCart, stockIssues, lastAdded, clearLastAdded, openCart } = useCart();
  const { lang, t } = useLang();
  const { forwardCartToChat } = useChat();
  const [view, setView] = useState<"cart" | "checkout">("cart");
  const [contact, setContact] = useState<ContactForm>({
    name: "",
    phone: "",
    email: "",
    countryCode: "",
    city: "",
    deliveryAddress: "",
    postalCode: "",
    comment: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [copied, setCopied] = useState(false);

  // Promo code state
  const [promoInput, setPromoInput] = useState("");
  const [promoCode, setPromoCode] = useState(""); // applied code
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMsg, setPromoMsg] = useState("");
  const [promoValid, setPromoValid] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);

  const issueIds = new Set(stockIssues.map((s) => s.postId));
  const selectedCountry = COUNTRIES.find((c) => c.code === contact.countryCode);

  // Compute per-item line totals and grand total
  const priceInfo = useMemo(() => {
    const lines: (string | null)[] = [];
    let total = 0;
    let currency = "";
    let symbol = "";
    let canSum = true;

    for (const item of items) {
      const parsed = item.post.price ? parsePricePerMeter(item.post.price) : null;
      if (!parsed) {
        lines.push(null);
        canSum = false;
        continue;
      }
      if (currency && parsed.currency !== currency) canSum = false;
      currency = parsed.currency;
      symbol = parsed.symbol;
      const lineTotal = parsed.amount * item.quantity;
      total += lineTotal;
      lines.push(formatMoney(lineTotal, parsed.symbol, parsed.currency));
    }

    return {
      lines,
      total: canSum && currency ? formatMoney(total, symbol, currency) : null,
      totalEur: canSum && currency === "eur" ? total : null,
      currency,
    };
  }, [items]);

  // Shipping cost based on selected country
  const shippingEur = contact.countryCode ? getShippingEur(contact.countryCode) : 0;
  const countryName = selectedCountry ? getCountryLabel(selectedCountry, lang) : "";

  const handleCountryChange = (code: string) => {
    const country = COUNTRIES.find((c) => c.code === code);
    const dialCode = country?.dialCode ?? "";
    setContact((prev) => {
      const wasDialCode = COUNTRIES.some((c) => prev.phone === c.dialCode || prev.phone === c.dialCode + " ");
      const newPhone = !prev.phone || wasDialCode ? dialCode + " " : prev.phone;
      return { ...prev, countryCode: code, phone: newPhone };
    });
    setFieldErrors((e) => ({ ...e, general: undefined }));
  };

  const buildCartMessage = (withContact = false) => {
    const lines = items.map((item) => {
      const title = getTitle(item.post, lang);
      const skuPart = item.post.sku ? `[${item.post.sku}] ` : "";
      return `• ${skuPart}${title} — ${item.quantity}м`;
    });
    let msg = `Добрый день! Хочу заказать:\n${lines.join("\n")}`;
    if (withContact) {
      if (contact.name) msg += `\n\nИмя: ${contact.name}`;
      if (contact.phone) msg += `\nТелефон: ${contact.phone}`;
      if (contact.email) msg += `\nEmail: ${contact.email}`;
      const addrParts = [contact.city, contact.deliveryAddress, contact.postalCode, countryName].filter(Boolean);
      if (addrParts.length) msg += `\nАдрес: ${addrParts.join(", ")}`;
      if (contact.comment) msg += `\nКомментарий: ${contact.comment}`;
    }
    return msg;
  };

  const validateContact = (): boolean => {
    const errors: FieldErrors = {};
    const required: (keyof ContactForm)[] = ["name", "countryCode", "city", "deliveryAddress", "postalCode"];
    const allFilled = required.every((f) => contact[f].trim().length > 0)
      && contact.phone.trim().length > 0
      && contact.email.trim().length > 0;

    if (!allFilled) errors.general = t.fillAllFields;
    if (contact.phone && !isValidPhone(contact.phone)) errors.phone = t.invalidPhone;
    if (contact.email && !isValidEmail(contact.email)) errors.email = t.invalidEmail;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoMsg("");
    setPromoValid(false);
    setDiscountPercent(0);
    setPromoCode("");
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromoValid(true);
        setDiscountPercent(data.discount_percent);
        setPromoCode(promoInput.trim().toUpperCase());
        setPromoMsg(data.message || `-${data.discount_percent}%`);
      } else {
        setPromoMsg(data.message || (lang === "ru" ? "Неверный код" : lang === "cs" ? "Neplatný kód" : "Invalid code"));
      }
    } catch {
      setPromoMsg(lang === "ru" ? "Ошибка проверки" : lang === "cs" ? "Chyba ověření" : "Verification error");
    } finally {
      setPromoLoading(false);
    }
  };

  const updateContact = (field: keyof ContactForm, value: string) => {
    setContact((prev) => ({ ...prev, [field]: value }));
    if (field === "phone") setFieldErrors((e) => ({ ...e, phone: undefined, general: undefined }));
    else if (field === "email") setFieldErrors((e) => ({ ...e, email: undefined, general: undefined }));
    else setFieldErrors((e) => ({ ...e, general: undefined }));
  };

  const handlePayByCard = async () => {
    if (!validateContact()) return;
    setPaying(true);
    setPayError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            postId: item.post.id,
            sku: item.post.sku || "",
            title: getTitle(item.post, lang),
            quantity: item.quantity,
            price: item.post.price || "",
            imageUrl: item.post.images?.[0] ?? null,
          })),
          customer: {
            name: contact.name,
            phone: contact.phone,
            email: contact.email,
            country: countryName,
            city: contact.city,
            address: contact.deliveryAddress,
            postalCode: contact.postalCode,
            comment: contact.comment,
            lang,
            promoCode: promoCode || undefined,
            discountPercent: discountPercent || undefined,
            shippingEur: shippingEur > 0 ? shippingEur : undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        const errKey = data.error as string;
        setPayError(errKey === "amount_too_large" ? t.amountTooLarge : data.error || t.paymentError);
        return;
      }
      window.location.href = data.url;
    } catch {
      setPayError(t.connectionError);
    } finally {
      setPaying(false);
    }
  };

  const handleMessenger = (type: "tg" | "wa", withContact = false) => {
    if (withContact && !validateContact()) return;
    const msg = buildCartMessage(withContact);
    const encoded = encodeURIComponent(msg);
    const url =
      type === "tg"
        ? `https://t.me/it_tkani_admin?text=${encoded}`
        : `https://wa.me/79851858584?text=${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSendCartToChat = () => {
    if (items.length === 0) return;
    forwardCartToChat({
      items: items.map((item, i) => ({
        id: item.post.id,
        title: getTitle(item.post, lang),
        sku: item.post.sku || undefined,
        price: item.post.price || undefined,
        image: item.post.images?.[0] || undefined,
        quantity: item.quantity,
        lineTotal: priceInfo.lines[i] || undefined,
      })),
      total: priceInfo.total || undefined,
    });
    closeCart();
  };

  const handleCopy = async () => {
    if (!validateContact()) return;
    try {
      await navigator.clipboard.writeText(buildCartMessage(true));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const inputClass = (hasError?: boolean) =>
    `w-full py-2.5 px-3 bg-[#f5f0eb] border text-sm text-[#2c2825] focus:outline-none focus:border-[#8a8178] ${
      hasError ? "border-red-400" : "border-[#e8e0d8]"
    }`;

  // Toast — visible even when drawer is closed
  const toastTitle = lastAdded ? getTitle(lastAdded.post, lang) : "";
  const toast = lastAdded ? (
    <div className="fixed top-5 right-4 z-[80] w-[300px] toast-in">
      <div
        className="flex items-center gap-3 px-3.5 py-3 rounded-2xl shadow-[0_8px_32px_rgba(44,40,37,0.14)] border border-white/60"
        style={{ background: "rgba(250,249,247,0.82)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      >
        {/* Thumbnail */}
        <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#ede7e0] shrink-0">
          {lastAdded.post.images?.[0] ? (
            <img src={lastAdded.post.images[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a8178" strokeWidth="1.5">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
              </svg>
            </div>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[9px] uppercase tracking-[0.16em] text-[#8a8178] mb-0.5 font-medium">
            {lang === "ru" ? "Добавлено в корзину" : lang === "en" ? "Added to cart" : "Přidáno do košíku"}
          </p>
          <p className="text-sm font-semibold text-[#2c2825] truncate leading-tight">{toastTitle}</p>
          <p className="text-xs text-[#8a8178] mt-0.5">{lastAdded.qty} {t.metersUnit}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button
            onClick={clearLastAdded}
            className="w-5 h-5 rounded-full bg-[#e8e0d8]/80 flex items-center justify-center text-[#8a8178] hover:bg-[#ddd6ce] hover:text-[#2c2825] transition-colors"
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={() => { clearLastAdded(); openCart(); }}
            className="text-[9px] uppercase tracking-[0.12em] font-medium text-[#2c2825]/70 hover:text-[#2c2825] transition-colors whitespace-nowrap"
          >
            {lang === "ru" ? "В корзину →" : lang === "en" ? "View →" : "Košík →"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (!isCartOpen) return toast;

  return (
    <>
      {toast}
      {/* Backdrop */}
      <div className="fixed inset-0 z-[55] bg-black/40 panel-overlay" onClick={closeCart} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-[60] bg-white flex flex-col shadow-2xl panel-slide-right">
        {view === "cart" ? (
          <>
            {/* Cart header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e0d8] shrink-0">
              <h2 className="font-heading text-xl font-semibold text-[#2c2825]">
                {t.cart} ({items.length})
              </h2>
              <button onClick={closeCart} className="p-1.5 text-[#8a8178] hover:text-[#2c2825] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cart body */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-[#e8e0d8] mb-4">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <p className="font-heading text-xl text-[#8a8178] mb-1">{t.cartEmpty}</p>
                  <p className="text-sm text-[#b8b0a8]">{t.cartEmptyHint}</p>
                </div>
              ) : (
                <div className="divide-y divide-[#f0ebe5]">
                  {items.map((item) => {
                    const title = getTitle(item.post, lang);
                    const hasIssue = issueIds.has(item.post.id);
                    return (
                      <div key={item.post.id} className={`flex gap-3 p-4 ${hasIssue ? "bg-red-50" : ""}`}>
                        {item.post.images?.[0] && (
                          <img src={item.post.images[0]} alt={title}
                            className="w-16 h-16 object-cover bg-[#f5f0eb] shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#2c2825] truncate">{title}</p>
                          {item.post.sku && (
                            <p className="text-xs text-[#8a8178] mt-0.5">SKU: {item.post.sku}</p>
                          )}
                          <p className="text-xs text-[#8a8178] mt-0.5">{item.quantity} {t.metersUnit}</p>
                          {item.post.price && (
                            <p className="text-xs text-[#2c2825] mt-0.5">{item.post.price}</p>
                          )}
                          {hasIssue && (
                            <p className="text-xs text-red-500 mt-0.5">{t.stockIssueText}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.post.id)}
                          className="text-[#b8b0a8] hover:text-red-500 transition-colors shrink-0 p-1"
                          title={t.removeItem}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6 6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cart footer */}
            {items.length > 0 && (
              <div className="shrink-0">
                {/* Total — full-width bordered row */}
                {priceInfo.total && (
                  <div className="flex items-center justify-between px-5 py-4 border-t border-b border-[#e8e0d8]">
                    <span className="text-base text-[#2c2825] tracking-wide">
                      {lang === "ru" ? "Итого" : lang === "en" ? "Total" : "Celkem"}
                    </span>
                    <span className="font-heading text-xl font-semibold text-[#2c2825]">{priceInfo.total}</span>
                  </div>
                )}

                <div className="p-5 space-y-3">
                <button
                  onClick={() => setView("checkout")}
                  className="w-full py-3 bg-[#2c2825] text-white font-heading text-base tracking-wide hover:bg-[#3d3632] transition-colors"
                >
                  {t.checkoutOrder}
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[#e8e0d8]" />
                  <span className="text-[10px] text-[#b8b0a8] uppercase tracking-widest">{t.orWriteUs}</span>
                  <div className="flex-1 h-px bg-[#e8e0d8]" />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleMessenger("tg", false)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-[#e8e0d8] text-[#2c2825] hover:bg-[#f5f0eb] transition-colors text-sm"
                  >
                    <TelegramIcon />
                    Telegram
                  </button>
                  <button
                    onClick={() => handleMessenger("wa", false)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-[#e8e0d8] text-[#2c2825] hover:bg-[#f5f0eb] transition-colors text-sm"
                  >
                    <WhatsAppIcon />
                    WhatsApp
                  </button>
                </div>

                {/* Send whole cart into the site chat */}
                <button
                  onClick={handleSendCartToChat}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#e8e0d8] text-[#2c2825] hover:bg-[#f5f0eb] transition-colors text-sm"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  {lang === "ru" ? "Отправить в чат" : lang === "cs" ? "Odeslat do chatu" : "Send to chat"}
                </button>
                </div>{/* end p-5 */}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Checkout header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e0d8] shrink-0">
              <button onClick={() => setView("cart")} className="text-sm text-[#8a8178] hover:text-[#2c2825] transition-colors">
                ← {t.cart}
              </button>
              <button onClick={closeCart} className="p-1.5 text-[#8a8178] hover:text-[#2c2825] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Checkout body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Items summary */}
              <div className="bg-[#f5f0eb] p-3 space-y-2">
                {items.map((item, i) => {
                  const title = getTitle(item.post, lang);
                  const lineTotal = priceInfo.lines[i];
                  return (
                    <div key={item.post.id} className="flex justify-between text-sm gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[#2c2825] truncate">{title}</p>
                        <p className="text-xs text-[#8a8178]">{item.quantity} {t.metersUnit}{item.post.price ? ` × ${item.post.price.replace(/\/.*/, "")}` : ""}</p>
                      </div>
                      {lineTotal && (
                        <span className="text-[#2c2825] font-medium shrink-0">{lineTotal}</span>
                      )}
                    </div>
                  );
                })}

                {/* Breakdown: subtotal / shipping / discount / total */}
                {priceInfo.totalEur != null ? (
                  <div className="pt-2 border-t border-[#e8e0d8] space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#8a8178]">{lang === "ru" ? "Подытог" : lang === "en" ? "Subtotal" : "Mezisoučet"}</span>
                      <span className="text-[#2c2825]">€{priceInfo.totalEur.toLocaleString("en-US")}</span>
                    </div>
                    {contact.countryCode && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#8a8178]">
                          {lang === "ru" ? "Доставка" : lang === "en" ? "Shipping" : "Doprava"}
                          {" "}
                          <span className="text-[10px]">({shippingZoneLabel(contact.countryCode, lang)})</span>
                        </span>
                        <span className="text-[#2c2825]">{formatShippingCost(shippingEur, lang)}</span>
                      </div>
                    )}
                    {promoValid && discountPercent > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-700">{promoCode} −{discountPercent}%</span>
                        <span className="text-green-700">−€{(priceInfo.totalEur * discountPercent / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-1 border-t border-[#e8e0d8]">
                      <span className="font-heading font-semibold text-[#2c2825]">{lang === "ru" ? "Итого" : lang === "en" ? "Total" : "Celkem"}</span>
                      <span className="font-heading font-semibold text-[#2c2825]">
                        €{(
                          priceInfo.totalEur * (1 - discountPercent / 100) + (contact.countryCode ? shippingEur : 0)
                        ).toLocaleString("en-US", { maximumFractionDigits: 2 })}
                        {lang === "cs" && (
                          <span className="text-xs text-[#8a8178] ml-1">
                            (≈ {Math.ceil((priceInfo.totalEur * (1 - discountPercent / 100) + (contact.countryCode ? shippingEur : 0)) * EUR_TO_CZK * 10) / 10} Kč)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ) : priceInfo.total ? (
                  <div className="flex justify-between text-sm pt-2 border-t border-[#e8e0d8]">
                    <span className="text-[#8a8178]">{lang === "ru" ? "Итого" : lang === "en" ? "Total" : "Celkem"}</span>
                    <span className="font-heading font-semibold text-[#2c2825]">{priceInfo.total}</span>
                  </div>
                ) : null}
              </div>

              {/* Contact form */}
              <div>
                <p className="text-sm font-medium text-[#2c2825] mb-3">{t.contactFormTitle}</p>
                <div className="space-y-3">

                  {/* Name */}
                  <div>
                    <label className="block text-xs text-[#8a8178] mb-1">{t.yourName} *</label>
                    <input type="text" value={contact.name} onChange={(e) => updateContact("name", e.target.value)}
                      className={inputClass()} />
                  </div>

                  {/* Country select */}
                  <div>
                    <label className="block text-xs text-[#8a8178] mb-1">{t.country} *</label>
                    <select
                      value={contact.countryCode}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className={`${inputClass()} appearance-none`}
                    >
                      <option value="">{t.selectCountry}</option>
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {getCountryLabel(c, lang)} ({c.dialCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs text-[#8a8178] mb-1">{t.yourPhone} *</label>
                    <input
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => updateContact("phone", e.target.value)}
                      placeholder={selectedCountry ? `${selectedCountry.dialCode} …` : "+420 123 456 789"}
                      className={inputClass(!!fieldErrors.phone)}
                    />
                    {fieldErrors.phone && <p className="text-xs text-red-500 mt-0.5">{fieldErrors.phone}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs text-[#8a8178] mb-1">{t.yourEmail} *</label>
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(e) => updateContact("email", e.target.value)}
                      placeholder="example@email.com"
                      className={inputClass(!!fieldErrors.email)}
                    />
                    {fieldErrors.email && <p className="text-xs text-red-500 mt-0.5">{fieldErrors.email}</p>}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs text-[#8a8178] mb-1">{t.city} *</label>
                    <input type="text" value={contact.city} onChange={(e) => updateContact("city", e.target.value)}
                      className={inputClass()} />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-xs text-[#8a8178] mb-1">{t.deliveryAddress} *</label>
                    <input type="text" value={contact.deliveryAddress} onChange={(e) => updateContact("deliveryAddress", e.target.value)}
                      className={inputClass()} />
                  </div>

                  {/* Postal */}
                  <div>
                    <label className="block text-xs text-[#8a8178] mb-1">{t.postalCode} *</label>
                    <input type="text" value={contact.postalCode} onChange={(e) => updateContact("postalCode", e.target.value)}
                      className={inputClass()} />
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-xs text-[#8a8178] mb-1">{t.comment}</label>
                    <textarea
                      value={contact.comment}
                      onChange={(e) => updateContact("comment", e.target.value)}
                      placeholder={t.commentPlaceholder}
                      rows={2}
                      className="w-full py-2.5 px-3 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] placeholder-[#8a8178] focus:outline-none focus:border-[#8a8178] resize-none"
                    />
                  </div>

                  {/* Promo code */}
                  <div>
                    <label className="block text-xs text-[#8a8178] mb-1">
                      {lang === "ru" ? "Промокод" : lang === "cs" ? "Promo kód" : "Promo code"}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => {
                          setPromoInput(e.target.value.toUpperCase());
                          if (promoValid) { setPromoValid(false); setPromoCode(""); setDiscountPercent(0); setPromoMsg(""); }
                        }}
                        placeholder={lang === "ru" ? "ВВЕДИТЕ КОД" : lang === "cs" ? "ZADEJTE KÓD" : "ENTER CODE"}
                        className="flex-1 py-2.5 px-3 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] focus:outline-none focus:border-[#8a8178] uppercase tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={promoLoading || !promoInput.trim()}
                        className="px-4 py-2.5 bg-[#2c2825] text-white text-xs uppercase tracking-wider hover:bg-[#3d3632] transition-colors disabled:opacity-50 shrink-0"
                      >
                        {promoLoading ? "…" : (lang === "ru" ? "Применить" : lang === "cs" ? "Použít" : "Apply")}
                      </button>
                    </div>
                    {promoMsg && (
                      <p className={`text-xs mt-1 ${promoValid ? "text-green-700" : "text-red-500"}`}>
                        {promoMsg}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {fieldErrors.general && (
                <p className="text-xs text-red-500">{fieldErrors.general}</p>
              )}

              {/* Pay by card */}
              <button
                onClick={handlePayByCard}
                disabled={paying}
                className="w-full py-4 bg-[#2c2825] text-white font-heading text-base tracking-wide hover:bg-[#3d3632] transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {paying ? (
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="1" y="4" width="22" height="16" rx="0" />
                      <path d="M1 10h22" />
                    </svg>
                    {t.payByCard}
                  </>
                )}
              </button>
              {payError && <p className="text-xs text-red-400 text-center">{payError}</p>}

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#e8e0d8]" />
                <span className="text-[10px] text-[#b8b0a8] uppercase tracking-widest">{t.orWriteUs}</span>
                <div className="flex-1 h-px bg-[#e8e0d8]" />
              </div>

              {/* Messengers */}
              <div className="flex flex-col gap-2 pb-4">
                <button
                  onClick={() => handleMessenger("tg", true)}
                  className="flex items-center gap-3 px-5 py-3 border border-[#e8e0d8] text-[#2c2825] hover:bg-[#f5f0eb] transition-colors text-sm"
                >
                  <TelegramIcon />
                  Telegram
                </button>
                <button
                  onClick={() => handleMessenger("wa", true)}
                  className="flex items-center gap-3 px-5 py-3 border border-[#e8e0d8] text-[#2c2825] hover:bg-[#f5f0eb] transition-colors text-sm"
                >
                  <WhatsAppIcon />
                  WhatsApp
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-3 px-5 py-3 border border-[#e8e0d8] text-[#2c2825] hover:bg-[#f5f0eb] transition-colors text-sm"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="9" y="9" width="13" height="13" rx="0" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  {copied ? t.copied : t.copyForVk}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
