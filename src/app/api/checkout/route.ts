import { NextRequest, NextResponse } from "next/server";

interface CartItemPayload {
  postId: string;
  sku?: string;
  title: string;
  quantity: number;
  price?: string;
  imageUrl?: string | null;
}

interface CustomerPayload {
  name?: string;
  phone?: string;
  email?: string;
  country?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  comment?: string;
  lang?: string;
  promoCode?: string;
  discountPercent?: number;
  shippingEur?: number;
}

// Parse price string → { amountCents, currency }
// Handles: "5000 руб/м", "€120", "3 500 ₽", "450 Kč"
function parsePrice(raw: string): { amountCents: number; currency: string } | null {
  if (!raw) return null;
  const s = raw.replace(/\s/g, "");

  let currency = "rub";
  if (/€|eur/i.test(s)) currency = "eur";
  else if (/\$|usd/i.test(s)) currency = "usd";
  else if (/kč|czk/i.test(s)) currency = "czk";
  else if (/руб|₽|rub/i.test(s)) currency = "rub";

  const match = s.match(/[\d]+(?:[.,]\d+)?/);
  if (!match) return null;
  const amount = parseFloat(match[0].replace(",", "."));
  if (isNaN(amount) || amount <= 0) return null;

  return { amountCents: Math.round(amount * 100), currency };
}

// Stripe max amounts per currency (in minor units)
const STRIPE_MAX: Record<string, number> = {
  rub: 999_999_99,
  eur: 999_999_99,
  usd: 999_999_99,
  czk: 999_999_99,
};

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  try {
    const body = await req.json();

    // Support both cart (items array) and legacy single-item format
    let items: CartItemPayload[] = [];
    let customer: CustomerPayload = {};

    if (Array.isArray(body.items)) {
      items = body.items;
      customer = body.customer || {};
    } else {
      // Legacy single-item: { title, price, quantity, imageUrl }
      items = [
        {
          postId: "",
          title: body.title,
          quantity: parseFloat(String(body.quantity).replace(",", ".")) || 1,
          price: body.price,
          imageUrl: body.imageUrl,
        },
      ];
    }

    if (items.length === 0) {
      return NextResponse.json({ error: "No items" }, { status: 400 });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secretKey, { apiVersion: "2026-03-25.dahlia" });

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (req.headers.get("origin") ?? "http://localhost:3000");

    // Build line items — all items must use same currency
    // Detect currency from first item with a price
    let currency = "eur";
    const lineItems = [];

    for (const item of items) {
      const qty = Math.min(Math.max(item.quantity || 1, 0.1), 500);

      if (item.price) {
        const parsed = parsePrice(item.price);
        if (parsed) {
          currency = parsed.currency;
          const totalCents = Math.round(parsed.amountCents * qty);
          const max = STRIPE_MAX[currency] ?? 999_999_99;
          if (totalCents > max) {
            return NextResponse.json(
              { error: "amount_too_large" },
              { status: 400 }
            );
          }
          lineItems.push({
            price_data: {
              currency,
              product_data: {
                name: item.sku ? `[${item.sku}] ${item.title}` : item.title,
                ...(item.imageUrl ? { images: [item.imageUrl] } : {}),
              },
              unit_amount: totalCents,
            },
            quantity: 1,
          });
          continue;
        }
      }

      // No parseable price — use 1 EUR placeholder
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: item.sku ? `[${item.sku}] ${item.title}` : item.title,
            ...(item.imageUrl ? { images: [item.imageUrl] } : {}),
          },
          unit_amount: 100, // 1 EUR placeholder
        },
        quantity: 1,
      });
    }

    // Apply discount to line items
    const discountMult = customer.discountPercent
      ? 1 - customer.discountPercent / 100
      : 1;
    const discountedLineItems = lineItems.map((li) => ({
      ...li,
      price_data: {
        ...li.price_data,
        unit_amount: Math.round(li.price_data.unit_amount * discountMult),
      },
    }));

    // Add shipping as a line item
    if (customer.shippingEur && customer.shippingEur > 0) {
      const shippingLabel =
        customer.lang === "ru" ? "Доставка" :
        customer.lang === "cs" ? "Doprava" : "Shipping";
      discountedLineItems.push({
        price_data: {
          currency: "eur",
          product_data: { name: shippingLabel },
          unit_amount: Math.round(customer.shippingEur * 100),
        },
        quantity: 1,
      });
    }

    // Build metadata (Stripe metadata values must be strings, max 500 chars each)
    const metaItems = items.map((i) => ({
      id: i.postId,
      sku: i.sku || "",
      title: i.title,
      quantity: i.quantity,
      price: i.price || "",
    }));

    const metadata: Record<string, string> = {
      items: JSON.stringify(metaItems).slice(0, 499),
      customer_name: customer.name || "",
      customer_phone: customer.phone || "",
      customer_email: customer.email || "",
      customer_city: customer.city || "",
      customer_address: customer.address || "",
      customer_postal: customer.postalCode || "",
      customer_country: customer.country || "",
      customer_comment: (customer.comment || "").slice(0, 499),
      customer_lang: customer.lang || "ru",
      promo_code: customer.promoCode || "",
      discount_percent: String(customer.discountPercent || 0),
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: discountedLineItems,
      mode: "payment",
      success_url: `${siteUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/payment-cancel`,
      metadata,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
