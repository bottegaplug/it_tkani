"use client";

import { useState, useEffect, useRef } from "react";
import { useLang } from "@/context/LanguageContext";

const STORAGE_KEY = "ittkani_subscribed";
const PROMO_CODE = "IT5";

// Strict email validation
function isValidEmail(email: string): boolean {
  // Must have exactly one @, a domain with a dot, no spaces, reasonable length
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) return false;
  const parts = trimmed.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (local.length === 0 || local.length > 64) return false;
  if (!domain.includes(".")) return false;
  return true;
}

export default function EmailCaptureModal() {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    // Don't save to localStorage — popup will show again on next visit
    setVisible(false);
  };

  const triggerShake = () => {
    setShake(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setShake(true));
    });
    setTimeout(() => setShake(false), 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError(t.emailPopupInvalid);
      triggerShake();
      inputRef.current?.focus();
      return;
    }
    setError("");
    setLoading(true);
    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
    } catch {
      // fail silently — show success anyway
    }
    setLoading(false);
    setSubmitted(true);
    localStorage.setItem(STORAGE_KEY, "1");
    setTimeout(() => setVisible(false), 5000);
  };

  if (!visible) return null;

  return (
    <div className="email-popup-overlay fixed inset-0 z-[70] flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(44,40,37,0.5)", backdropFilter: "blur(3px)" }}
      onClick={handleClose}
    >
      <div
        className="email-popup-card relative w-full max-w-sm bg-[#faf9f7]"
        style={{ boxShadow: "0 20px 60px rgba(44,40,37,0.25), 0 4px 16px rgba(44,40,37,0.1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent line */}
        <div className="h-[3px] w-full bg-[#2c2825]" />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-[#b8b0a8] hover:text-[#2c2825] transition-colors duration-200"
          aria-label="Close"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="px-8 pt-7 pb-8">
          {!submitted ? (
            <>
              {/* Label */}
              <p className="text-[10px] tracking-[0.22em] uppercase text-[#b8b0a8] mb-4">
                IT Tkani
              </p>

              {/* Title */}
              <h2 className="font-heading text-[26px] font-semibold text-[#2c2825] leading-tight mb-2">
                {t.emailPopupTitle}
              </h2>

              {/* Description */}
              <p className="text-[13px] text-[#8a8178] leading-relaxed mb-7">
                {t.emailPopupText}
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder={t.emailPopupPlaceholder}
                    className={`w-full py-3 px-4 bg-white border text-[13px] text-[#2c2825] placeholder-[#c8c0b8] focus:outline-none transition-colors duration-200 ${
                      error
                        ? "border-red-300 focus:border-red-400"
                        : "border-[#e8e0d8] focus:border-[#8a8178]"
                    } ${shake ? "input-shake" : ""}`}
                    autoFocus
                  />
                  {/* Email icon inside input */}
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#d0c8c0] pointer-events-none"
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="0" />
                    <path d="m2 4 10 9 10-9" />
                  </svg>
                </div>

                {/* Error message */}
                {error && (
                  <p className="text-[11px] text-red-400 mt-1.5 pl-1 flex items-center gap-1">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4M12 16h.01" />
                    </svg>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-3.5 bg-[#2c2825] text-white font-heading text-[15px] tracking-[0.08em] hover:bg-[#3d3632] active:bg-[#1e1b19] transition-colors duration-200 disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    </span>
                  ) : t.emailPopupButton}
                </button>
              </form>
            </>
          ) : (
            <div className="email-popup-success text-center py-4">
              {/* Animated checkmark */}
              <div className="w-14 h-14 mx-auto mb-5 flex items-center justify-center border-2 border-[#2c2825]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2c2825" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 6 9 17l-5-5"
                    style={{
                      strokeDasharray: 28,
                      strokeDashoffset: 0,
                      animation: "checkDraw 0.4s ease 0.1s both"
                    }}
                  />
                </svg>
              </div>

              <p className="font-heading text-[28px] font-semibold text-[#2c2825] mb-3">
                {t.emailPopupSuccess}
              </p>

              {/* Email icon + message */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8a8178" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="0"/>
                  <path d="m2 4 10 9 10-9"/>
                </svg>
                <p className="text-[13px] text-[#8a8178]">{t.emailPopupSuccessHint}</p>
              </div>

              <p className="text-[12px] text-[#b8b0a8] leading-relaxed px-2">
                {t.emailPopupSuccessCode}
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes checkDraw {
          from { stroke-dashoffset: 28; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
