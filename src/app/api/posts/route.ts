import { NextRequest, NextResponse } from "next/server";
import { isConfigured } from "@/lib/supabase";
import {
  readPosts,
  createPost,
  updatePost,
  deletePost,
} from "@/lib/local-store";

function isAuthed(req: NextRequest) {
  return req.cookies.get("admin_auth")?.value === "authenticated";
}

export async function GET() {
  if (isConfigured) {
    const { supabase } = await import("@/lib/supabase");
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  // Local mode
  const posts = readPosts();
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (isConfigured) {
    const { supabase } = await import("@/lib/supabase");
    const { data, error } = await supabase
      .from("posts")
      .insert({
        title: body.title,
        description: body.description,
        images: body.images || [],
        tags: body.tags || [],
        is_new: body.is_new || false,
        price: body.price || "",
        videos: body.videos || [],
      })
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  // Local mode
  const post = createPost({
    title: body.title,
    description: body.description || "",
    images: body.images || [],
    tags: body.tags || [],
    is_new: body.is_new || false,
    price: body.price || "",
    videos: body.videos || [],
  });
  return NextResponse.json(post);
}

export async function PUT(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (isConfigured) {
    const { supabase } = await import("@/lib/supabase");
    const { data, error } = await supabase
      .from("posts")
      .update({
        title: body.title,
        description: body.description,
        images: body.images || [],
        tags: body.tags || [],
        is_new: body.is_new || false,
        price: body.price || "",
        videos: body.videos || [],
      })
      .eq("id", body.id)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  // Local mode
  const updated = updatePost(body.id, {
    title: body.title,
    description: body.description,
    images: body.images || [],
    tags: body.tags || [],
    is_new: body.is_new ?? false,
    price: body.price || "",
    videos: body.videos || [],
  });
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();

  if (isConfigured) {
    const { supabase } = await import("@/lib/supabase");
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  // Local mode
  const deleted = deletePost(id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
