import { NextRequest, NextResponse } from "next/server";
import { isConfigured } from "@/lib/supabase";

interface OrderItem {
  id: string;
  sku?: string;
  title: string;
  quantity: number;
  price?: string;
}

interface CustomerMeta {
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  country?: string;
  comment?: string;
}

/** IT-XXXXXXXX — last 8 alphanum chars of Stripe session ID */
function generateOrderNumber(sessionId: string): string {
  const clean = sessionId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return "IT-" + clean.slice(-8);
}

async function sendTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

async function saveOrder(
  orderNumber: string,
  sessionId: string,
  customer: CustomerMeta,
  items: OrderItem[]
) {
  if (!isConfigured) {
    console.error("saveOrder: Supabase not configured");
    return;
  }
  const { supabase } = await import("@/lib/supabase");

  const { error } = await supabase.from("orders").upsert(
    {
      order_number: orderNumber,
      stripe_session_id: sessionId,
      customer_name: customer.name || "",
      customer_phone: customer.phone || "",
      customer_email: customer.email || "",
      customer_city: customer.city || "",
      customer_address: customer.address || "",
      customer_postal: customer.postalCode || "",
      customer_country: customer.country || "",
      customer_comment: customer.comment || "",
      items,
      status: "pending",
    },
    { onConflict: "stripe_session_id" }
  );

  if (error) {
    console.error("saveOrder Supabase error:", error.code, error.message);
    throw new Error(`Supabase saveOrder: ${error.message}`);
  }

  console.log("saveOrder OK:", orderNumber);
}

async function deductStock(items: OrderItem[]) {
  if (!isConfigured) return;
  const { supabase } = await import("@/lib/supabase");

  for (const item of items) {
    if (!item.id || !item.quantity) continue;
    const { data: post } = await supabase
      .from("posts")
      .select("stock_meters")
      .eq("id", item.id)
      .single();

    if (post && post.stock_meters != null) {
      const newStock = Math.max(0, post.stock_meters - item.quantity);
      await supabase.from("posts").update({ stock_meters: newStock }).eq("id", item.id);
    }
  }
}

const EMAIL_I18N = {
  ru: {
    subtitle: "Ткани из Италии",
    heading: "Заказ принят ✓",
    orderLabel: "Номер заказа:",
    greeting: (name?: string) => `Здравствуйте${name ? `, ${name}` : ""}!`,
    body: "Ваш заказ получен и принят в работу. Мы свяжемся с вами в ближайшее время для уточнения деталей доставки.",
    itemsTitle: "Состав заказа",
    addressTitle: "Адрес доставки",
    contactUs: "По всем вопросам свяжитесь с нами:",
    unit: "м",
  },
  en: {
    subtitle: "Italian Fabrics",
    heading: "Order Confirmed ✓",
    orderLabel: "Order number:",
    greeting: (name?: string) => `Hello${name ? `, ${name}` : ""}!`,
    body: "Your order has been received and is being processed. We will contact you shortly to confirm the delivery details.",
    itemsTitle: "Order summary",
    addressTitle: "Delivery address",
    contactUs: "If you have any questions, please contact us:",
    unit: "m",
  },
  cs: {
    subtitle: "Italské látky",
    heading: "Objednávka přijata ✓",
    orderLabel: "Číslo objednávky:",
    greeting: (name?: string) => `Dobrý den${name ? `, ${name}` : ""}!`,
    body: "Vaše objednávka byla přijata a zpracovává se. Brzy vás kontaktujeme ohledně podrobností doručení.",
    itemsTitle: "Přehled objednávky",
    addressTitle: "Doručovací adresa",
    contactUs: "Pokud máte jakékoli dotazy, kontaktujte nás:",
    unit: "m",
  },
};

function orderConfirmationHtml(
  orderNumber: string,
  customer: CustomerMeta,
  items: OrderItem[],
  lang: "ru" | "en" | "cs" = "ru"
): string {
  const i18n = EMAIL_I18N[lang] || EMAIL_I18N.ru;

  const itemRows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:6px 0;color:#2c2825;font-size:13px;">${i.sku ? `<span style="color:#8a8178">[${i.sku}]</span> ` : ""}${i.title}</td>
          <td style="padding:6px 0;color:#8a8178;font-size:13px;text-align:right;white-space:nowrap;">${i.quantity} ${i18n.unit}${i.price ? ` · ${i.price}` : ""}</td>
        </tr>`
    )
    .join("");

  const addressParts = [customer.city, customer.address, customer.postalCode, customer.country].filter(Boolean);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${i18n.heading} ${orderNumber}</title></head>
<body style="margin:0;padding:24px;background:#faf9f7;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e0d8;padding:40px;">
    <p style="margin:0 0 2px;font-size:26px;font-weight:600;color:#2c2825;letter-spacing:0.04em;">IT Tkani</p>
    <p style="margin:0 0 32px;font-size:11px;color:#8a8178;text-transform:uppercase;letter-spacing:0.2em;">${i18n.subtitle}</p>

    <h2 style="margin:0 0 6px;font-size:20px;color:#2c2825;">${i18n.heading}</h2>
    <p style="margin:0 0 24px;font-size:13px;color:#8a8178;">${i18n.orderLabel} <strong style="color:#2c2825;font-size:15px;">${orderNumber}</strong></p>

    <p style="margin:0 0 24px;font-size:14px;color:#2c2825;line-height:1.7;">
      ${i18n.greeting(customer.name)}<br>
      ${i18n.body}
    </p>

    <div style="background:#f5f0eb;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0 0 12px;font-size:11px;color:#8a8178;text-transform:uppercase;letter-spacing:0.15em;">${i18n.itemsTitle}</p>
      <table style="width:100%;border-collapse:collapse;">${itemRows}</table>
    </div>

    ${addressParts.length ? `
    <div style="margin:0 0 24px;">
      <p style="margin:0 0 6px;font-size:11px;color:#8a8178;text-transform:uppercase;letter-spacing:0.15em;">${i18n.addressTitle}</p>
      <p style="margin:0;font-size:13px;color:#2c2825;line-height:1.6;">${addressParts.join(", ")}</p>
    </div>` : ""}

    ${customer.comment ? `<p style="margin:0 0 24px;font-size:13px;color:#8a8178;font-style:italic;">💬 ${customer.comment}</p>` : ""}

    <div style="border-top:1px solid #e8e0d8;padding-top:20px;margin-top:8px;">
      <p style="margin:0;font-size:12px;color:#8a8178;line-height:1.8;">
        ${i18n.contactUs}<br>
        <a href="https://t.me/it_tkani_admin" style="color:#2c2825;">Telegram</a> ·
        <a href="https://wa.me/79851858584" style="color:#2c2825;">WhatsApp</a> ·
        <a href="https://www.instagram.com/it_tkani/" style="color:#2c2825;">Instagram</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

const EMAIL_SUBJECTS: Record<string, string> = {
  ru: "принят",
  en: "confirmed",
  cs: "přijata",
};

async function sendCustomerConfirmation(
  orderNumber: string,
  customer: CustomerMeta,
  items: OrderItem[],
  lang: "ru" | "en" | "cs" = "ru"
) {
  if (!customer.email) return;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "IT Tkani <noreply@ittkani.com>";
  if (!apiKey) {
    console.error("Resend: RESEND_API_KEY is not set");
    return;
  }

  const subjectVerb = EMAIL_SUBJECTS[lang] || EMAIL_SUBJECTS.ru;

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [customer.email],
      subject: `${lang === "ru" ? "Заказ" : lang === "en" ? "Order" : "Objednávka"} ${orderNumber} ${subjectVerb} — IT Tkani`,
      html: orderConfirmationHtml(orderNumber, customer, items, lang),
    }),
  });

  const resData = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error("Resend error:", resp.status, JSON.stringify(resData));
  } else {
    console.log("Resend OK:", resData?.id);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: "No sessionId" }, { status: 400 });

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secretKey, { apiVersion: "2026-03-25.dahlia" });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Not paid" }, { status: 400 });
    }

    const meta = session.metadata || {};

    const customer: CustomerMeta = {
      name: meta.customer_name,
      phone: meta.customer_phone,
      email: meta.customer_email,
      city: meta.customer_city,
      address: meta.customer_address,
      postalCode: meta.customer_postal,
      country: meta.customer_country,
      comment: meta.customer_comment,
    };

    const customerLang = (meta.customer_lang || "ru") as "ru" | "en" | "cs";

    // Increment promo code usage if used
    if (meta.promo_code && isConfigured) {
      const { supabase } = await import("@/lib/supabase");
      try { await supabase.rpc("increment_promo_uses", { promo_code_val: meta.promo_code }); } catch { /* ignore */ }
    }

    let items: OrderItem[] = [];
    try { items = JSON.parse(meta.items || "[]"); } catch {}

    const orderNumber = generateOrderNumber(sessionId);

    // Run in parallel — allSettled so one failure doesn't block the others
    const [stockResult, saveResult, emailResult] = await Promise.allSettled([
      deductStock(items),
      saveOrder(orderNumber, sessionId, customer, items),
      sendCustomerConfirmation(orderNumber, customer, items, customerLang),
    ]);
    if (stockResult.status === "rejected") console.error("deductStock failed:", stockResult.reason);
    if (saveResult.status === "rejected") console.error("saveOrder failed:", saveResult.reason);
    if (emailResult.status === "rejected") console.error("sendEmail failed:", emailResult.reason);

    // Telegram notification
    const itemLines = items
      .map((i) => `• ${i.sku ? `[${i.sku}] ` : ""}${i.title} — ${i.quantity} м${i.price ? ` (${i.price})` : ""}`)
      .join("\n");

    const deliveryLine = [customer.city, customer.address, customer.postalCode, customer.country]
      .filter(Boolean).join(", ");

    const msg =
      `🛍 <b>НОВЫЙ ЗАКАЗ</b>\n` +
      `🔖 <b>Номер: ${orderNumber}</b>\n\n` +
      `👤 <b>Покупатель:</b>\n${customer.name || "—"}\n📱 ${customer.phone || "—"}\n📧 ${customer.email || "—"}\n\n` +
      `📍 <b>Доставка:</b>\n${deliveryLine || "—"}` +
      (customer.comment ? `\n💬 ${customer.comment}` : "") +
      `\n\n🧵 <b>Товары:</b>\n${itemLines || "—"}` +
      `\n\n💳 Оплачено через Stripe`;

    await sendTelegram(msg);

    return NextResponse.json({ success: true, orderNumber });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Notify error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
