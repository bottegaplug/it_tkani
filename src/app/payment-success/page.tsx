"use client";

import { useEffect, useState } from "react";

export default function PaymentSuccess() {
  const [notified, setNotified] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    if (notified) return;
    setNotified(true);

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    localStorage.removeItem("ittkani_cart_v2");

    if (sessionId) {
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.orderNumber) setOrderNumber(data.orderNumber);
        })
        .catch(() => {});
    }
  }, [notified]);

  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-8 flex items-center justify-center border-2 border-[#2c2825]">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2c2825" strokeWidth="1.5" strokeLinecap="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <p className="text-[11px] tracking-[0.22em] uppercase text-[#b8b0a8] mb-3">IT Tkani</p>
        <h1 className="font-heading text-3xl font-semibold text-[#2c2825] mb-3">
          Оплата прошла успешно
        </h1>
        {orderNumber && (
          <p className="text-sm text-[#8a8178] mb-2">
            Номер заказа: <span className="font-mono font-semibold text-[#2c2825] text-base">{orderNumber}</span>
          </p>
        )}
        <p className="text-sm text-[#8a8178] leading-relaxed mb-8">
          Подтверждение отправлено на вашу почту. Мы свяжемся с вами в ближайшее время для уточнения деталей доставки.
        </p>
        <a
          href="/"
          className="inline-block px-10 py-3 bg-[#2c2825] text-white font-heading text-base tracking-wide hover:bg-[#3d3632] transition-colors"
        >
          Вернуться в каталог
        </a>
      </div>
    </div>
  );
}
