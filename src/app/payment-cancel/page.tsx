export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* X icon */}
        <div className="w-20 h-20 mx-auto mb-8 flex items-center justify-center border-2 border-[#e8e0d8]">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8a8178" strokeWidth="1.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </div>

        <p className="text-[11px] tracking-[0.22em] uppercase text-[#b8b0a8] mb-3">IT Tkani</p>
        <h1 className="font-heading text-3xl font-semibold text-[#2c2825] mb-4">
          Оплата отменена
        </h1>
        <p className="text-sm text-[#8a8178] leading-relaxed mb-8">
          Вы можете попробовать снова или связаться с нами через мессенджер.
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
