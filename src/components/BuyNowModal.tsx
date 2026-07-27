"use client";

import { useState, useEffect } from "react";
import type { Post } from "@/types";
import { useLang } from "@/context/LanguageContext";
import { COUNTRIES, getCountryLabel, isValidPhone, isValidEmail } from "@/lib/countries";
import { metersToFtHint } from "@/lib/units";

interface BuyNowModalProps {
  post: Post;
  onClose: () => void;
}

const QTY_REGEX = /^\d*\.?\d{0,1}$/;

const TelegramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
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

export default function BuyNowModal({ post, onClose }: BuyNowModalProps) {
  const { lang, t } = useLang();
  const [step, setStep] = useState<"qty" | "contact">("qty");
  const [qty, setQty] = useState("");
  const [qtyError, setQtyError] = useState("");
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

  const displayTitle = (lang !== "ru" && post.translations?.[lang]?.title) || post.title;

  const stockDisplay = post.stock_meters != null
    ? `${post.stock_meters} ${t.metersUnit}`
    : null;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const selectedCountry = COUNTRIES.find((c) => c.code === contact.countryCode);
  const countryName = selectedCountry ? getCountryLabel(selectedCountry, lang) : "";

  const handleCountryChange = (code: string) => {
    const country = COUNTRIES.find((c) => c.code === code);
    const dialCode = country?.dialCode ?? "";
    setContact((prev) => {
      // Prefill phone with dial code only if phone is empty or was just a previous dial code
      const wasDialCode = COUNTRIES.some((c) => prev.phone === c.dialCode || prev.phone === c.dialCode + " ");
      const newPhone = !prev.phone || wasDialCode ? dialCode + " " : prev.phone;
      return { ...prev, countryCode: code, phone: newPhone };
    });
    setFieldErrors((e) => ({ ...e, general: undefined }));
  };

  const buildMessage = () => {
    const skuPart = post.sku ? `[${post.sku}] ` : "";
    let msg = `Добрый день! Я хочу заказать:\n• ${skuPart}${displayTitle} — ${qty}м — ${post.price || ""}`;
    if (contact.name) msg += `\n\nИмя: ${contact.name}`;
    if (contact.phone) msg += `\nТелефон: ${contact.phone}`;
    if (contact.email) msg += `\nEmail: ${contact.email}`;
    const addrParts = [contact.city, contact.deliveryAddress, contact.postalCode, countryName].filter(Boolean);
    if (addrParts.length) msg += `\nАдрес: ${addrParts.join(", ")}`;
    if (contact.comment) msg += `\nКомментарий: ${contact.comment}`;
    return msg;
  };

  const handleQtySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(qty);
    if (!qty || isNaN(num) || num <= 0) {
      setQtyError(t.enterPositiveNumber);
      return;
    }
    if (post.stock_meters != null && num > post.stock_meters) {
      setQtyError(`${t.maxAvailable}: ${post.stock_meters} ${t.metersUnit}`);
      return;
    }
    setQtyError("");
    setStep("contact");
  };

  const validateContact = (): boolean => {
    const errors: FieldErrors = {};
    const required: (keyof ContactForm)[] = ["name", "countryCode", "city", "deliveryAddress", "postalCode"];
    const allFilled = required.every((f) => contact[f].trim().length > 0)
      && contact.phone.trim().length > 0
      && contact.email.trim().length > 0;

    if (!allFilled) {
      errors.general = t.fillAllFields;
    }
    if (contact.phone && !isValidPhone(contact.phone)) {
      errors.phone = t.invalidPhone;
    }
    if (contact.email && !isValidEmail(contact.email)) {
      errors.email = t.invalidEmail;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
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
          items: [
            {
              postId: post.id,
              sku: post.sku || "",
              title: displayTitle,
              quantity: parseFloat(qty),
              price: post.price || "",
              imageUrl: post.images?.[0] ?? null,
            },
          ],
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

  const handleMessenger = (type: "tg" | "wa") => {
    if (!validateContact()) return;
    const msg = buildMessage();
    const encoded = encodeURIComponent(msg);
    const url =
      type === "tg"
        ? `https://t.me/it_tkani_admin?text=${encoded}`
        : `https://wa.me/79851858584?text=${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopy = async () => {
    if (!validateContact()) return;
    try {
      await navigator.clipboard.writeText(buildMessage());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const updateContact = (field: keyof ContactForm, value: string) => {
    setContact((prev) => ({ ...prev, [field]: value }));
    if (field === "phone") setFieldErrors((e) => ({ ...e, phone: undefined, general: undefined }));
    else if (field === "email") setFieldErrors((e) => ({ ...e, email: undefined, general: undefined }));
    else setFieldErrors((e) => ({ ...e, general: undefined }));
  };

  const inputClass = (hasError?: boolean) =>
    `w-full py-2.5 px-3 bg-[#f5f0eb] border text-sm text-[#2c2825] focus:outline-none focus:border-[#8a8178] ${
      hasError ? "border-red-400" : "border-[#e8e0d8]"
    }`;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 modal-overlay" />
      <div
        className="relative w-full max-w-md mx-4 bg-white max-h-[90vh] overflow-y-auto modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e8e0d8] sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            {step === "contact" && (
              <button
                onClick={() => setStep("qty")}
                className="text-[#8a8178] hover:text-[#2c2825] transition-colors text-sm"
              >
                ← {t.back}
              </button>
            )}
            <h3 className="font-heading text-xl font-semibold text-[#2c2825]">{t.buyNow}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#8a8178] hover:text-[#2c2825] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {step === "qty" ? (
            <>
              {/* Post info */}
              <div className="flex gap-3 mb-5">
                {post.images?.[0] && (
                  <img
                    src={post.images[0]}
                    alt={displayTitle}
                    className="w-16 h-16 object-cover bg-[#f5f0eb] shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#2c2825] truncate">{displayTitle}</p>
                  {post.sku && <p className="text-xs text-[#8a8178] mt-0.5">SKU: {post.sku}</p>}
                  {post.price && <p className="text-sm font-heading text-[#2c2825] mt-0.5">{post.price}</p>}
                  {stockDisplay && (
                    <p className="text-xs text-[#8a8178] mt-0.5">{stockDisplay} {t.inStock}</p>
                  )}
                </div>
              </div>

              <form onSubmit={handleQtySubmit}>
                <label className="block text-sm text-[#2c2825] mb-1.5">{t.quantityMeters}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={qty}
                  onChange={(e) => {
                    if (QTY_REGEX.test(e.target.value)) {
                      setQty(e.target.value);
                      setQtyError("");
                    }
                  }}
                  placeholder="1.5"
                  autoFocus
                  className="w-full py-3 px-4 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] placeholder-[#8a8178] focus:outline-none focus:border-[#8a8178] mb-1"
                />
                {lang === "en" && qty && !isNaN(parseFloat(qty)) && parseFloat(qty) > 0 && (
                  <p className="text-xs text-[#8a8178] mb-1">{metersToFtHint(parseFloat(qty))}</p>
                )}
                {qtyError && <p className="text-xs text-red-500 mb-3">{qtyError}</p>}
                {!qtyError && <div className="mb-3" />}
                <button
                  type="submit"
                  className="w-full py-3 bg-[#2c2825] text-white font-heading text-base tracking-wide hover:bg-[#3d3632] transition-colors"
                >
                  {t.next}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Item summary */}
              <div className="bg-[#f5f0eb] p-3 mb-5 text-sm">
                <p className="font-medium text-[#2c2825]">{displayTitle}</p>
                <p className="text-[#8a8178] text-xs mt-0.5">{qty} {t.metersUnit} · {post.price}</p>
              </div>

              {/* Contact form */}
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
                    className={`${inputClass()} appearance-none bg-[#f5f0eb]`}
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
              </div>

              {fieldErrors.general && (
                <p className="text-xs text-red-500 mt-2">{fieldErrors.general}</p>
              )}

              {/* Pay by card */}
              <button
                onClick={handlePayByCard}
                disabled={paying}
                className="w-full mt-5 py-4 bg-[#2c2825] text-white font-heading text-base tracking-wide hover:bg-[#3d3632] transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
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
              {payError && <p className="text-xs text-red-400 mt-2 text-center">{payError}</p>}

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[#e8e0d8]" />
                <span className="text-xs text-[#b8b0a8] uppercase tracking-widest">{t.orWriteUs}</span>
                <div className="flex-1 h-px bg-[#e8e0d8]" />
              </div>

              {/* Messengers */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleMessenger("tg")}
                  className="flex items-center gap-3 px-5 py-3 border border-[#e8e0d8] text-[#2c2825] hover:bg-[#f5f0eb] transition-colors text-sm"
                >
                  <TelegramIcon />
                  Telegram
                </button>
                <button
                  onClick={() => handleMessenger("wa")}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
