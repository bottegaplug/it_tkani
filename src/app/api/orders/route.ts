import { NextRequest, NextResponse } from "next/server";
import { isConfigured } from "@/lib/supabase";

function isAuthed(req: NextRequest) {
  return req.cookies.get("admin_auth")?.value === "authenticated";
}

function shippingEmailHtml(
  orderNumber: string,
  customerName: string,
  trackingNumber: string,
  carrier: string,
  items: { sku?: string; title: string; quantity: number; price?: string }[]
): string {
  const itemRows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:6px 0;color:#2c2825;font-size:13px;">${i.sku ? `<span style="color:#8a8178">[${i.sku}]</span> ` : ""}${i.title}</td>
          <td style="padding:6px 0;color:#8a8178;font-size:13px;text-align:right;">${i.quantity} м</td>
        </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Заказ ${orderNumber} отправлен</title></head>
<body style="margin:0;padding:24px;background:#faf9f7;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e0d8;padding:40px;">
    <p style="margin:0 0 2px;font-size:26px;font-weight:600;color:#2c2825;letter-spacing:0.04em;">IT Tkani</p>
    <p style="margin:0 0 32px;font-size:11px;color:#8a8178;text-transform:uppercase;letter-spacing:0.2em;">Ткани из Италии</p>

    <h2 style="margin:0 0 6px;font-size:20px;color:#2c2825;">Ваш заказ отправлен 📦</h2>
    <p style="margin:0 0 24px;font-size:13px;color:#8a8178;">Номер заказа: <strong style="color:#2c2825;font-size:15px;">${orderNumber}</strong></p>

    <p style="margin:0 0 24px;font-size:14px;color:#2c2825;line-height:1.7;">
      Здравствуйте${customerName ? `, ${customerName}` : ""}!<br>
      Ваш заказ передан в службу доставки. Ниже — данные для отслеживания посылки.
    </p>

    <div style="background:#f5f0eb;padding:20px 24px;margin:0 0 24px;border-left:3px solid #2c2825;">
      <p style="margin:0 0 8px;font-size:11px;color:#8a8178;text-transform:uppercase;letter-spacing:0.15em;">Информация о доставке</p>
      <p style="margin:0 0 4px;font-size:14px;color:#2c2825;">Служба доставки: <strong>${carrier}</strong></p>
      <p style="margin:0;font-size:16px;color:#2c2825;">Трек-номер: <strong style="font-family:monospace;letter-spacing:0.05em;">${trackingNumber}</strong></p>
    </div>

    <p style="margin:0 0 24px;font-size:13px;color:#8a8178;line-height:1.6;">
      Введите трек-номер на сайте службы доставки для отслеживания посылки.<br>
      Среднее время доставки по России: 2–7 дней.
    </p>

    ${items.length ? `
    <div style="margin:0 0 24px;">
      <p style="margin:0 0 10px;font-size:11px;color:#8a8178;text-transform:uppercase;letter-spacing:0.15em;">Состав заказа</p>
      <table style="width:100%;border-collapse:collapse;">${itemRows}</table>
    </div>` : ""}

    <div style="border-top:1px solid #e8e0d8;padding-top:20px;margin-top:8px;">
      <p style="margin:0;font-size:12px;color:#8a8178;line-height:1.8;">
        Вопросы по доставке:<br>
        <a href="https://t.me/it_tkani_admin" style="color:#2c2825;">Telegram</a> ·
        <a href="https://wa.me/79851858584" style="color:#2c2825;">WhatsApp</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// DELETE /api/orders — delete an order (admin only)
export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!isConfigured) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  const { supabase } = await import("@/lib/supabase");
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// GET /api/orders — list all orders (admin only)
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isConfigured) {
    return NextResponse.json([]);
  }

  const { supabase } = await import("@/lib/supabase");
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PUT /api/orders — mark as shipped + send tracking email to customer
export async function PUT(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, trackingNumber, carrier } = body;

  if (!id || !trackingNumber || !carrier) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!isConfigured) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { supabase } = await import("@/lib/supabase");

  // Fetch order to get customer email + details
  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Update order
  const { error: updateErr } = await supabase
    .from("orders")
    .update({ tracking_number: trackingNumber, tracking_carrier: carrier, status: "shipped" })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Send email to customer
  if (order.customer_email) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL || "IT Tkani <noreply@ittkani.com>";

    if (apiKey) {
      const items = Array.isArray(order.items) ? order.items : [];
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from,
          to: [order.customer_email],
          subject: `Заказ ${order.order_number} отправлен — IT Tkani`,
          html: shippingEmailHtml(
            order.order_number,
            order.customer_name,
            trackingNumber,
            carrier,
            items
          ),
        }),
      });
    }
  }

  return NextResponse.json({ success: true });
}
