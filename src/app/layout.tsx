import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import { ChatProvider } from "@/context/ChatContext";
import StockNotification from "@/components/StockNotification";
import ChatWidget from "@/components/ChatWidget";
import CookieBanner from "@/components/CookieBanner";

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
      <body className="antialiased">
        <LanguageProvider>
          <CartProvider>
            <ChatProvider>
              {children}
              <StockNotification />
              <ChatWidget />
              <CookieBanner />
            </ChatProvider>
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
