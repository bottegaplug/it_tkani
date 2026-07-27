import { NextRequest, NextResponse } from "next/server";
import { isConfigured } from "@/lib/supabase";

function isAuthed(req: NextRequest) {
  return req.cookies.get("admin_auth")?.value === "authenticated";
}

// POST /api/promo — validate a promo code (public)
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Admin: create promo code
  if (body.action === "create") {
    if (!isAuthed(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { code, discount_percent, expires_at, max_uses } = body;
    if (!code || !discount_percent) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (!isConfigured) return NextResponse.json({ error: "DB not configured" }, { status: 500 });
    const { supabase } = await import("@/lib/supabase");
    const { data, error } = await supabase.from("promo_codes").insert({
      code: code.trim().toUpperCase(),
      discount_percent,
      expires_at: expires_at || null,
      max_uses: max_uses || null,
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Public: validate promo code
  const { code } = body;
  if (!code) return NextResponse.json({ valid: false, message: "No code" }, { status: 400 });
  if (!isConfigured) return NextResponse.json({ valid: false, message: "Service unavailable" });

  const { supabase } = await import("@/lib/supabase");
  const { data: promo, error } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .eq("is_active", true)
    .single();

  if (error || !promo) {
    return NextResponse.json({ valid: false, message: "Invalid promo code" });
  }

  // Check expiry
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, message: "Promo code expired" });
  }

  // Check usage limit
  if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) {
    return NextResponse.json({ valid: false, message: "Promo code usage limit reached" });
  }

  return NextResponse.json({
    valid: true,
    discount_percent: promo.discount_percent,
    message: `-${promo.discount_percent}% discount applied`,
  });
}

// GET /api/promo — list all promo codes (admin)
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isConfigured) return NextResponse.json([]);
  const { supabase } = await import("@/lib/supabase");
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/promo — delete promo code (admin)
export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!isConfigured) return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  const { supabase } = await import("@/lib/supabase");
  const { error } = await supabase.from("promo_codes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// PATCH /api/promo — toggle active (admin)
export async function PATCH(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, is_active } = await req.json();
  if (!isConfigured) return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  const { supabase } = await import("@/lib/supabase");
  const { error } = await supabase.from("promo_codes").update({ is_active }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
