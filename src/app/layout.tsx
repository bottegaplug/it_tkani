import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IT Tkani — Итальянские ткани премиум класса",
  description:
    "Каталог итальянских тканей премиум класса. Шёлк, кашемир, шерсть, хлопок от лучших итальянских фабрик. Доставка по России.",
  keywords: [
    "итальянские ткани",
    "ткани из Италии",
    "шёлк",
    "кашемир",
    "шерсть",
    "купить ткань",
    "IT Tkani",
  ],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "IT Tkani — Итальянские ткани премиум класса",
    description:
      "Каталог итальянских тканей премиум класса. Шёлк, кашемир, шерсть, хлопок от лучших итальянских фабрик.",
    type: "website",
    locale: "ru_RU",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
