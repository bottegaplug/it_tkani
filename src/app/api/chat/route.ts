import { NextRequest, NextResponse } from "next/server";
import { isConfigured } from "@/lib/supabase";

function isAdminAuthed(req: NextRequest) {
  return req.cookies.get("admin_auth")?.value === "authenticated";
}

// GET ?action=users  → admin list of all chats
// GET ?action=messages&userId=X  → messages for user
// GET ?action=unread  → total unread count for admin badge
export async function GET(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  const { supabase } = await import("@/lib/supabase");
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "users") {
    if (!isAdminAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: users, error } = await supabase
      .from("chat_users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const enriched = await Promise.all(
      (users || []).map(async (u) => {
        const { data: lastMsg } = await supabase
          .from("chat_messages")
          .select("content, attached_post, attached_cart, created_at, is_admin")
          .eq("user_id", u.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { count: unread } = await supabase
          .from("chat_messages")
          .select("*", { count: "exact", head: true })
          .eq("user_id", u.id)
          .eq("is_admin", false)
          .eq("is_read", false);

        return { ...u, last_message: lastMsg, unread_count: unread ?? 0 };
      })
    );

    return NextResponse.json(enriched);
  }

  if (action === "messages") {
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "No userId" }, { status: 400 });

    // The admin may have deleted this account — tell the client to sign out
    const { data: user } = await supabase
      .from("chat_users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!user) return NextResponse.json({ error: "deleted" }, { status: 410 });

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  }

  if (action === "unread") {
    if (!isAdminAuthed(req)) return NextResponse.json({ count: 0 });
    const { count } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("is_admin", false)
      .eq("is_read", false);
    return NextResponse.json({ count: count ?? 0 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// POST { action: "register", nickname, password }  → register new user
// POST { action: "login", nickname, password }     → login existing user
// POST { action: "send", userId, content, attachedPost?, isAdmin? }  → send message
export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  const { supabase } = await import("@/lib/supabase");
  const body = await req.json();

  if (body.action === "register") {
    const nick = (body.nickname || "").trim();
    const pass = (body.password || "").trim();
    if (!nick) return NextResponse.json({ error: "Nickname required" }, { status: 400 });
    if (!pass || pass.length < 4) return NextResponse.json({ error: "short_password" }, { status: 400 });

    const { data: existing } = await supabase
      .from("chat_users")
      .select("id")
      .eq("nickname", nick)
      .maybeSingle();

    if (existing) return NextResponse.json({ error: "taken" }, { status: 409 });

    const hashed = await hashPassword(pass);
    const { data, error } = await supabase
      .from("chat_users")
      .insert({ nickname: nick, password_hash: hashed })
      .select("id, nickname, created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (body.action === "login") {
    const nick = (body.nickname || "").trim();
    const pass = (body.password || "").trim();
    if (!nick || !pass) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const { data: user } = await supabase
      .from("chat_users")
      .select("id, nickname, password_hash, created_at")
      .eq("nickname", nick)
      .maybeSingle();

    if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const hashed = await hashPassword(pass);
    if (user.password_hash !== hashed) return NextResponse.json({ error: "wrong_password" }, { status: 401 });

    return NextResponse.json({ id: user.id, nickname: user.nickname, created_at: user.created_at });
  }

  if (body.action === "send") {
    const { userId, content, attachedPost, attachedCart, isAdmin } = body;
    if (!userId) return NextResponse.json({ error: "No userId" }, { status: 400 });
    if (isAdmin && !isAdminAuthed(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Account may have been deleted by the admin
    const { data: sender } = await supabase
      .from("chat_users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!sender) return NextResponse.json({ error: "deleted" }, { status: 410 });

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        user_id: userId,
        content: content || "",
        is_admin: !!isAdmin,
        attached_post: attachedPost || null,
        attached_cart: attachedCart || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// PATCH { userId } → mark all client messages as read (admin)
export async function PATCH(req: NextRequest) {
  if (!isAdminAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  const { supabase } = await import("@/lib/supabase");
  const { userId } = await req.json();
  await supabase.from("chat_messages").update({ is_read: true }).eq("user_id", userId).eq("is_admin", false);
  return NextResponse.json({ success: true });
}

// DELETE { userId } → delete chat + user
export async function DELETE(req: NextRequest) {
  if (!isAdminAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  const { supabase } = await import("@/lib/supabase");
  const { userId } = await req.json();
  await supabase.from("chat_users").delete().eq("id", userId);
  return NextResponse.json({ success: true });
}
