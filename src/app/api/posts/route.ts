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

export async function GET(req: NextRequest) {
  // Admin-only full list: requires both ?admin=1 param AND valid auth cookie
  const url = new URL(req.url);
  const isAdminRequest = url.searchParams.get("admin") === "1" && isAuthed(req);

  if (isConfigured) {
    const { supabase } = await import("@/lib/supabase");
    let query = supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    // Public catalog: always hide sold-out items (stock_meters = 0)
    if (!isAdminRequest) {
      query = query.or("stock_meters.is.null,stock_meters.gt.0");
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  let posts = readPosts();
  if (!isAdminRequest) {
    posts = posts.filter((p) => p.stock_meters == null || p.stock_meters > 0);
  }
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
        categories: body.categories || [],
        is_new: body.is_new || false,
        is_discounted: body.is_discounted || false,
        price: body.price || "",
        videos: body.videos || [],
        translations: body.translations || {},
        sku: body.sku || null,
        stock_meters: body.stock_meters != null ? body.stock_meters : null,
      })
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  const post = createPost({
    title: body.title,
    description: body.description || "",
    images: body.images || [],
    tags: body.tags || [],
    categories: body.categories || [],
    is_new: body.is_new || false,
    is_discounted: body.is_discounted || false,
    price: body.price || "",
    videos: body.videos || [],
    sku: body.sku || null,
    stock_meters: body.stock_meters != null ? body.stock_meters : null,
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
        categories: body.categories || [],
        is_new: body.is_new || false,
        is_discounted: body.is_discounted || false,
        price: body.price || "",
        videos: body.videos || [],
        translations: body.translations || {},
        sku: body.sku || null,
        stock_meters: body.stock_meters != null ? body.stock_meters : null,
      })
      .eq("id", body.id)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  const updated = updatePost(body.id, {
    title: body.title,
    description: body.description,
    images: body.images || [],
    tags: body.tags || [],
    categories: body.categories || [],
    is_new: body.is_new ?? false,
    is_discounted: body.is_discounted ?? false,
    price: body.price || "",
    videos: body.videos || [],
    sku: body.sku || null,
    stock_meters: body.stock_meters != null ? body.stock_meters : null,
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

  const deleted = deletePost(id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
