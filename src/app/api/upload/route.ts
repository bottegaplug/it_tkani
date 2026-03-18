import { NextRequest, NextResponse } from "next/server";
import { isConfigured } from "@/lib/supabase";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

// Allow uploads up to 50MB
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (req.cookies.get("admin_auth")?.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  if (isConfigured) {
    const { supabase } = await import("@/lib/supabase");
    const { error } = await supabase.storage
      .from("images")
      .upload(fileName, file, { contentType: file.type });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const { data: urlData } = supabase.storage
      .from("images")
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
