"use client";

import { useLang } from "@/context/LanguageContext";

interface DeliveryBlock {
  icon: React.ReactNode;
  title: string;
  lines: string[];
}

const TruckIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" />
    <path d="M16 8h4l3 4v5h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const PlaneIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4c-1 0-1.5.5-3.5 2.5L9 8 2.8 6.2c-.5-.1-.9.4-.6.9L4.5 11l-1 2.5 2.5-1L10 14l1.8 4.6c.3.5.9.5 1.1.1l1.5-2.5 3 1z" />
  </svg>
);

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

export default function DeliverySection() {
  const { lang } = useLang();

  const content = {
    ru: {
      title: "Доставка",
      subtitle: "Отправляем по всему миру. Бережно упаковываем каждый рулон ткани.",
      blocks: [
        {
          icon: <TruckIcon />,
          title: "По России",
          lines: [
            "СДЭК — 2–5 рабочих дней",
            "Почта России — 5–14 дней",
            "Стоимость рассчитывается индивидуально в зависимости от веса и региона",
          ],
        },
        {
          icon: <PlaneIcon />,
          title: "Международная доставка",
          lines: [
            "EMS / Почта России — 10–30 дней",
            "СDЭК International — 7–20 дней",
            "DHL / FedEx — по запросу",
            "Доставка в страны СНГ, Европу и другие регионы",
          ],
        },
      ] as DeliveryBlock[],
      note: "Точные сроки и стоимость доставки уточняйте у менеджера в мессенджере. Все ткани тщательно упаковываются в защитную плёнку.",
      timeLabel: "Время обработки заказа",
      timeValue: "1–2 рабочих дня после подтверждения оплаты",
    },
    en: {
      title: "Delivery",
      subtitle: "We ship worldwide. Every fabric roll is carefully packed.",
      blocks: [
        {
          icon: <TruckIcon />,
          title: "Within Russia",
          lines: [
            "CDEK — 2–5 business days",
            "Russian Post — 5–14 days",
            "Shipping cost calculated based on weight and destination",
          ],
        },
        {
          icon: <PlaneIcon />,
          title: "International shipping",
          lines: [
            "EMS / Russian Post — 10–30 days",
            "CDEK International — 7–20 days",
            "DHL / FedEx — on request",
            "Available to CIS countries, Europe and worldwide",
          ],
        },
      ] as DeliveryBlock[],
      note: "For exact delivery times and costs, please contact us via messenger. All fabrics are carefully packed in protective wrap.",
      timeLabel: "Order processing time",
      timeValue: "1–2 business days after payment confirmation",
    },
    cs: {
      title: "Doručení",
      subtitle: "Zasíláme po celém světě. Každý váleček látky pečlivě zabalíme.",
      blocks: [
        {
          icon: <TruckIcon />,
          title: "Rusko",
          lines: [
            "CDEK — 2–5 pracovních dnů",
            "Ruská pošta — 5–14 dní",
            "Cena dopravy se počítá dle váhy a destinace",
          ],
        },
        {
          icon: <PlaneIcon />,
          title: "Mezinárodní doručení",
          lines: [
            "EMS / Ruská pošta — 10–30 dní",
            "CDEK International — 7–20 dní",
            "DHL / FedEx — na vyžádání",
            "Doručení do zemí SNS, Evropy a celého světa",
          ],
        },
      ] as DeliveryBlock[],
      note: "Přesné termíny a ceny dopravy si ověřte u správce přes messenger. Všechny látky jsou pečlivě zabaleny do ochranné fólie.",
      timeLabel: "Doba zpracování objednávky",
      timeValue: "1–2 pracovní dny po potvrzení platby",
    },
  };

  const c = content[lang] ?? content.ru;

  return (
    <div className="max-w-2xl py-8">
      <h2 className="font-heading text-3xl font-semibold text-[#2c2825] mb-2 tracking-wide">
        {c.title}
      </h2>
      <p className="text-sm text-[#8a8178] mb-10 leading-relaxed">{c.subtitle}</p>

      <div className="space-y-8">
        {c.blocks.map((block) => (
          <div key={block.title} className="flex gap-5">
            <div className="w-10 h-10 flex items-center justify-center border border-[#e8e0d8] text-[#2c2825] shrink-0 mt-0.5">
              {block.icon}
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-[#2c2825] mb-2">
                {block.title}
              </h3>
              <ul className="space-y-1.5">
                {block.lines.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#2c2825]/80 leading-relaxed">
                    <span className="text-[#8a8178] mt-0.5 shrink-0">—</span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Processing time */}
      <div className="mt-10 flex items-start gap-3 p-4 bg-[#f5f0eb] border-l-2 border-[#2c2825]">
        <div className="text-[#2c2825] mt-0.5 shrink-0">
          <ClockIcon />
        </div>
        <div>
          <p className="text-xs text-[#8a8178] uppercase tracking-[0.15em] mb-1">{c.timeLabel}</p>
          <p className="text-sm text-[#2c2825] font-medium">{c.timeValue}</p>
        </div>
      </div>

      {/* Note */}
      <p className="mt-6 text-xs text-[#8a8178] leading-relaxed border-t border-[#e8e0d8] pt-5">
        {c.note}
      </p>
    </div>
  );
}
