import { NextRequest, NextResponse } from "next/server";

function isAuthed(req: NextRequest) {
  return req.cookies.get("admin_auth")?.value === "authenticated";
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  // 1. Check env vars
  results.env = {
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    resend_key: !!process.env.RESEND_API_KEY,
    resend_from: process.env.RESEND_FROM_EMAIL || "(not set)",
    stripe_secret: !!process.env.STRIPE_SECRET_KEY,
    telegram_token: !!process.env.TELEGRAM_BOT_TOKEN,
  };

  // 2. Test Supabase — SELECT from orders
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from("orders")
      .select("id")
      .limit(1);

    results.supabase_select = error
      ? { ok: false, error: error.message, code: error.code }
      : { ok: true, rows: data?.length ?? 0 };

    // 3. Test Supabase INSERT
    const testId = "debug-test-" + Date.now();
    const { error: insertErr } = await supabase.from("orders").insert({
      order_number: testId,
      stripe_session_id: testId,
      customer_name: "DEBUG",
      customer_email: "debug@test.com",
      items: [],
      status: "pending",
    });

    if (insertErr) {
      results.supabase_insert = { ok: false, error: insertErr.message, code: insertErr.code };
    } else {
      // Clean up test row
      await supabase.from("orders").delete().eq("order_number", testId);
      results.supabase_insert = { ok: true };
    }
  } catch (e: unknown) {
    results.supabase_error = String(e);
  }

  // 4. Test Resend
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      results.resend = { ok: false, error: "RESEND_API_KEY not set" };
    } else {
      const resp = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const data = await resp.json();
      if (!resp.ok) {
        results.resend = { ok: false, status: resp.status, error: data };
      } else {
        const domains = (data?.data || []).map((d: { name: string; status: string }) => ({
          name: d.name,
          status: d.status,
        }));
        results.resend = { ok: true, domains };
      }
    }
  } catch (e: unknown) {
    results.resend = { ok: false, error: String(e) };
  }

  return NextResponse.json(results, { status: 200 });
}
