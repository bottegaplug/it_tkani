"use client";

import { useLang } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";

const CardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="0" />
    <path d="M1 10h22" />
  </svg>
);

const MessageIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const BankIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export default function PaymentSection() {
  const { lang } = useLang();
  const { openCart } = useCart();

  const content = {
    ru: {
      title: "Оплата",
      subtitle: "Несколько удобных способов оплаты на выбор. Принимаем карты со всего мира.",
      methods: [
        {
          icon: <CardIcon />,
          title: "Банковская карта онлайн",
          desc: "Оплата через защищённый сервис Stripe. Принимаем Visa, Mastercard, карты большинства стран мира. Деньги списываются мгновенно — заказ сразу уходит в работу.",
          badge: "Рекомендуем",
          action: { label: "Открыть корзину и оплатить", type: "cart" as const },
        },
        {
          icon: <MessageIcon />,
          title: "Через мессенджер",
          desc: "Напишите нам в Telegram или WhatsApp — согласуем детали заказа и пришлём реквизиты. Удобно при больших заказах или нестандартных запросах.",
          badge: null,
          action: null,
        },
        {
          icon: <BankIcon />,
          title: "Банковский перевод",
          desc: "Доступен для юридических лиц и крупных заказов. Реквизиты высылаем по запросу. Оплата по счёту.",
          badge: null,
          action: null,
        },
      ],
      secureTitle: "Безопасность платежей",
      secureText: "Мы не храним данные банковских карт. Все транзакции обрабатываются через Stripe — один из самых надёжных платёжных провайдеров в мире. Соответствует стандарту PCI DSS.",
      faqTitle: "Частые вопросы",
      faqs: [
        { q: "Когда спишутся деньги?", a: "Сразу при оформлении заказа онлайн." },
        { q: "Можно ли вернуть деньги?", a: "Да, в течение 14 дней при возврате товара надлежащего качества. Уточните детали у менеджера." },
        { q: "Есть ли рассрочка?", a: "По запросу возможна оплата частями — уточните в мессенджере." },
        { q: "Принимаете карты иностранных банков?", a: "Да, принимаем карты Visa и Mastercard большинства стран." },
      ],
    },
    en: {
      title: "Payment",
      subtitle: "Multiple convenient payment options. We accept cards from around the world.",
      methods: [
        {
          icon: <CardIcon />,
          title: "Bank card online",
          desc: "Secure payment via Stripe. We accept Visa, Mastercard and cards from most countries worldwide. Funds are charged instantly — your order is processed right away.",
          badge: "Recommended",
          action: { label: "Open cart & pay", type: "cart" as const },
        },
        {
          icon: <MessageIcon />,
          title: "Via messenger",
          desc: "Message us on Telegram or WhatsApp — we'll confirm the order details and send payment instructions. Ideal for large orders or custom requests.",
          badge: null,
          action: null,
        },
        {
          icon: <BankIcon />,
          title: "Bank transfer",
          desc: "Available for legal entities and large orders. We'll send bank details on request. Invoice payment.",
          badge: null,
          action: null,
        },
      ],
      secureTitle: "Payment security",
      secureText: "We do not store any card details. All transactions are processed through Stripe — one of the world's most trusted payment providers. PCI DSS compliant.",
      faqTitle: "Frequently asked questions",
      faqs: [
        { q: "When will I be charged?", a: "Immediately upon placing the order online." },
        { q: "Can I get a refund?", a: "Yes, within 14 days if the fabric is returned in original condition. Contact our manager for details." },
        { q: "Is instalment payment available?", a: "Available on request — please ask via messenger." },
        { q: "Do you accept foreign bank cards?", a: "Yes, we accept Visa and Mastercard from most countries." },
      ],
    },
    cs: {
      title: "Platba",
      subtitle: "Několik pohodlných způsobů platby. Přijímáme karty z celého světa.",
      methods: [
        {
          icon: <CardIcon />,
          title: "Bankovní karta online",
          desc: "Bezpečná platba přes Stripe. Přijímáme Visa, Mastercard a karty z většiny zemí světa. Peníze jsou strženy okamžitě — objednávka se zpracovává ihned.",
          badge: "Doporučujeme",
          action: { label: "Otevřít košík a zaplatit", type: "cart" as const },
        },
        {
          icon: <MessageIcon />,
          title: "Přes messenger",
          desc: "Napište nám na Telegram nebo WhatsApp — domluvíme se na detailech a zašleme platební údaje. Vhodné pro větší objednávky nebo nestandardní požadavky.",
          badge: null,
          action: null,
        },
        {
          icon: <BankIcon />,
          title: "Bankovní převod",
          desc: "K dispozici pro právnické osoby a větší objednávky. Bankovní údaje zašleme na vyžádání. Platba na základě faktury.",
          badge: null,
          action: null,
        },
      ],
      secureTitle: "Bezpečnost plateb",
      secureText: "Neukládáme žádné platební údaje. Všechny transakce zpracovává Stripe — jeden z nejdůvěryhodnějších platebních poskytovatelů na světě. Splňuje standard PCI DSS.",
      faqTitle: "Časté dotazy",
      faqs: [
        { q: "Kdy mi budou strženy peníze?", a: "Okamžitě při objednávce online." },
        { q: "Mohu získat vrácení peněz?", a: "Ano, do 14 dnů při vrácení zboží v původním stavu. Podrobnosti u správce." },
        { q: "Je dostupné splátky?", a: "Na vyžádání — zeptejte se přes messenger." },
        { q: "Přijímáte zahraniční bankovní karty?", a: "Ano, přijímáme Visa a Mastercard z většiny zemí." },
      ],
    },
  };

  const c = content[lang] ?? content.ru;

  return (
    <div className="max-w-2xl py-8">
      <h2 className="font-heading text-3xl font-semibold text-[#2c2825] mb-2 tracking-wide">
        {c.title}
      </h2>
      <p className="text-sm text-[#8a8178] mb-10 leading-relaxed">{c.subtitle}</p>

      {/* Payment methods */}
      <div className="space-y-5 mb-12">
        {c.methods.map((method) => (
          <div key={method.title} className="flex gap-5 p-5 border border-[#e8e0d8] bg-white">
            <div className="w-10 h-10 flex items-center justify-center border border-[#e8e0d8] text-[#2c2825] shrink-0 mt-0.5">
              {method.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <h3 className="font-heading text-base font-semibold text-[#2c2825]">
                  {method.title}
                </h3>
                {method.badge && (
                  <span className="text-[10px] bg-[#2c2825] text-white px-2 py-0.5 uppercase tracking-wider">
                    {method.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-[#2c2825]/75 leading-relaxed mb-3">{method.desc}</p>
              {method.action?.type === "cart" && (
                <button
                  onClick={openCart}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2c2825] text-white text-sm font-heading tracking-wide hover:bg-[#3d3632] transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="0" />
                    <path d="M1 10h22" />
                  </svg>
                  {method.action.label}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Security */}
      <div className="flex items-start gap-3 p-4 bg-[#f5f0eb] border-l-2 border-[#2c2825] mb-10">
        <div className="text-[#2c2825] mt-0.5 shrink-0">
          <ShieldIcon />
        </div>
        <div>
          <p className="text-xs text-[#8a8178] uppercase tracking-[0.15em] mb-1">{c.secureTitle}</p>
          <p className="text-sm text-[#2c2825]/80 leading-relaxed">{c.secureText}</p>
        </div>
      </div>

      {/* FAQ */}
      <div>
        <p className="text-xs text-[#8a8178] uppercase tracking-[0.15em] mb-5">{c.faqTitle}</p>
        <div className="space-y-4">
          {c.faqs.map((faq) => (
            <div key={faq.q} className="border-b border-[#f0ebe5] pb-4 last:border-0 last:pb-0">
              <p className="text-sm font-semibold text-[#2c2825] mb-1">{faq.q}</p>
              <p className="text-sm text-[#8a8178] leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
