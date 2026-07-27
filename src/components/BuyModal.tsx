"use client";

import { useState, useEffect } from "react";
import type { Post } from "@/types";
import { useLang } from "@/context/LanguageContext";

interface BuyModalProps {
  post: Post;
  onClose: () => void;
}

export default function BuyModal({ post, onClose }: BuyModalProps) {
  const [step, setStep] = useState<"quantity" | "contact">("quantity");
  const [quantity, setQuantity] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const { lang, t } = useLang();
  const displayTitle = (lang !== "ru" && post.translations?.[lang]?.title) || post.title;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const postLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/?post=${post.id}`
      : "";

  const message = `${t.greeting} ${postLink}. ${t.quantity} ${quantity || t.notSpecified}`;

  const hasPrice = !!post.price?.trim();

  const handlePayOnline = async () => {
    setPaying(true);
    setPayError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: displayTitle,
          price: post.price,
          quantity,
          imageUrl: post.images?.[0] ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setPayError(data.error || "Ошибка при создании оплаты");
        return;
      }
      window.location.href = data.url;
    } catch {
      setPayError("Ошибка соединения");
    } finally {
      setPaying(false);
    }
  };

  const contacts = [
    {
      name: "Telegram",
      getHref: () => `https://t.me/it_tkani_admin?text=${encodeURIComponent(message)}`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      ),
    },
    {
      name: "WhatsApp",
      getHref: () => `https://wa.me/79851858584?text=${encodeURIComponent(message)}`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
      ),
    },
  ];

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("contact");
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center modal-overlay"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div
        className="relative w-full max-w-md mx-4 bg-white modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e8e0d8]">
          <h3 className="font-heading text-2xl font-semibold text-[#2c2825]">
            {step === "quantity" ? t.specifyQuantity : t.chooseContact}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-[#8a8178] hover:text-[#2c2825] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {step === "quantity" ? (
            <form onSubmit={handleNext}>
              <p className="text-sm text-[#8a8178] mb-4">{t.howMuch}</p>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={t.quantityPlaceholder}
                className="w-full py-3 px-4 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] placeholder-[#8a8178] focus:outline-none focus:border-[#8a8178] mb-4"
                autoFocus
                required
              />
              <button
                type="submit"
                className="w-full py-3 bg-[#2c2825] text-white font-heading text-base tracking-wide hover:bg-[#3d3632] transition-colors"
              >
                {t.next}
              </button>
            </form>
          ) : (
            <>
              <p className="text-sm text-[#8a8178] mb-2">{t.item}</p>
              <p className="text-sm font-medium text-[#2c2825] mb-1">{displayTitle}</p>
              <p className="text-sm text-[#8a8178] mb-5">{t.quantity} {quantity}</p>

              {/* ── Messenger contacts ── */}
              <p className="text-sm text-[#8a8178] mb-3">{t.contactHint}</p>
              <div className="flex flex-col gap-3">
                {contacts.map((contact) => (
                  <a
                    key={contact.name}
                    href={contact.getHref()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 px-5 py-4 border border-[#e8e0d8] text-[#2c2825] hover:bg-[#f5f0eb] transition-colors"
                  >
                    {contact.icon}
                    <span className="font-medium">{contact.name}</span>
                  </a>
                ))}
              </div>

              {/* ── Stripe online payment ── */}
              {hasPrice && (
                <div className="mt-4">
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-[#e8e0d8]" />
                    <span className="text-xs text-[#b8b0a8] uppercase tracking-widest">или</span>
                    <div className="flex-1 h-px bg-[#e8e0d8]" />
                  </div>

                  <button
                    onClick={handlePayOnline}
                    disabled={paying}
                    className="w-full py-4 border-2 border-[#2c2825] text-[#2c2825] font-heading text-base tracking-wide hover:bg-[#2c2825] hover:text-white transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {paying ? (
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    ) : (
                      <>
                        {/* Card icon */}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <rect x="1" y="4" width="22" height="16" rx="0" />
                          <path d="M1 10h22" />
                        </svg>
                        Оплатить картой
                      </>
                    )}
                  </button>

                  {payError && (
                    <p className="text-xs text-red-400 mt-2 text-center">{payError}</p>
                  )}

                  <p className="text-[11px] text-[#b8b0a8] text-center mt-2">
                    Безопасная оплата · Stripe
                  </p>
                </div>
              )}

              <button
                onClick={() => setStep("quantity")}
                className="w-full mt-4 py-2 text-sm text-[#8a8178] hover:text-[#2c2825] transition-colors"
              >
                {t.back}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
