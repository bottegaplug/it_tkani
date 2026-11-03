import { NextRequest, NextResponse } from "next/server";
import { isConfigured } from "@/lib/supabase";
import { findPostsForSkus, compare, TG_CHANNEL } from "@/lib/telegram-sync";

function isAuthed(req: NextRequest) {
  return req.cookies.get("admin_auth")?.value === "authenticated";
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isConfigured) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const { supabase } = await import("@/lib/supabase");
  const { data, error } = await supabase
    .from("posts")
    .select("sku, title, stock_meters, cuts, is_archived")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Сверяем только активные товары с артикулом — по нему и ищем в канале
  const siteItems = (data || [])
    .filter((p) => p.sku && !p.is_archived)
    .map((p) => ({
      sku: p.sku as string,
      title: p.title as string,
      cuts: Array.isArray(p.cuts) && p.cuts.length
        ? (p.cuts as number[])
        : p.stock_meters != null
          ? [p.stock_meters as number]
          : [],
    }));

  if (siteItems.length === 0) {
    return NextResponse.json({ channel: TG_CHANNEL, rows: [], checkedAt: new Date().toISOString() });
  }

  try {
    const posts = await findPostsForSkus(siteItems.map((i) => i.sku));
    const rows = compare(siteItems, posts);
    return NextResponse.json({ channel: TG_CHANNEL, rows, checkedAt: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("sync-telegram:", message);
    return NextResponse.json({ error: `Не удалось прочитать канал: ${message}` }, { status: 502 });
  }
}
