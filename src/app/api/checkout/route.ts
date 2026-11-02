import { NextRequest, NextResponse } from "next/server";
import { parseRub, convertFromRub, CURRENCY_BY_LANG, type Lang, type Currency, type Rates } from "@/lib/currency";
import { getRates } from "@/lib/rates-server";

interface CartItemPayload {
  postId: string;
  sku?: string;
  title: string;
  quantity: number;
  price?: string;
  cutIndex?: number;
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
  shippingRub?: number;
}

// Prices are stored in rubles; the customer is charged in the currency of the
// site version they were looking at, so the amount matches what they saw.
function chargeCurrency(lang?: string): Currency {
  return CURRENCY_BY_LANG[(lang as Lang) ?? "ru"] ?? "rub";
}

/** Rubles → minor units (cents/haléře/копейки) of the charge currency */
function rubToMinorUnits(rub: number, lang: string | undefined, rates: Rates): number {
  return Math.round(convertFromRub(rub, (lang as Lang) ?? "ru", rates) * 100);
}

// Stripe's per-amount ceiling, in minor units
const STRIPE_MAX_MINOR = 999_999_99;

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

    // Every amount is summed in rubles, then converted once to the currency
    // the customer was shown — so the charge matches the displayed price.
    const currency = chargeCurrency(customer.lang);
    const rates = await getRates();
    const discountMult = customer.discountPercent
      ? 1 - customer.discountPercent / 100
      : 1;

    const lineItems = [];

    for (const item of items) {
      const qty = Math.min(Math.max(item.quantity || 1, 0.1), 500);
      const perMeterRub = parseRub(item.price);
      const lineRub = perMeterRub != null ? perMeterRub * qty * discountMult : 0;
      const unitAmount = perMeterRub != null ? rubToMinorUnits(lineRub, customer.lang, rates) : 100;

      if (unitAmount > STRIPE_MAX_MINOR) {
        return NextResponse.json({ error: "amount_too_large" }, { status: 400 });
      }

      lineItems.push({
        price_data: {
          currency,
          product_data: {
            name: item.sku ? `[${item.sku}] ${item.title}` : item.title,
            ...(item.imageUrl ? { images: [item.imageUrl] } : {}),
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      });
    }

    const discountedLineItems = lineItems;

    // Add shipping as a line item
    if (customer.shippingRub && customer.shippingRub > 0) {
      const shippingLabel =
        customer.lang === "ru" ? "Доставка" :
        customer.lang === "cs" ? "Doprava" : "Shipping";
      discountedLineItems.push({
        price_data: {
          currency,
          product_data: { name: shippingLabel },
          unit_amount: rubToMinorUnits(customer.shippingRub, customer.lang, rates),
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
      cut: i.cutIndex,
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
