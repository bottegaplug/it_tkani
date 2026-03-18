import { NextRequest, NextResponse } from "next/server";
import { isConfigured } from "@/lib/supabase";
import fs from "fs";
import path from "path";

// Allow up to 60s for large video uploads on Vercel
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (req.cookies.get("admin_auth")?.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Failed to parse form data" }, { status: 400 });
  }

  const file = formData.get("file") as File;

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // Determine bucket: videos go to 'media', images to 'images'
  const isVideo = file.type.startsWith("video/");
  const bucket = isVideo ? "media" : "images";

  if (isConfigured) {
    const { supabase } = await import("@/lib/supabase");
    const arrayBuf = await file.arrayBuffer();
    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, arrayBuf, { contentType: file.type });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    return NextResponse.json({ url: urlData.publicUrl });
  }

  // Local mode: save to public/uploads
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(uploadsDir, fileName), buffer);

  return NextResponse.json({ url: `/uploads/${fileName}` });
}
