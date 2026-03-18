import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/** Map extensions to proper MIME types (mobile often sends wrong types) */
const MIME_MAP: Record<string, string> = {
  mp4: "video/mp4",
  mov: "video/mp4",       // Upload MOV as mp4 content type — most compatible
  webm: "video/webm",
  avi: "video/x-msvideo",
  mkv: "video/x-matroska",
  hevc: "video/mp4",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/jpeg",     // HEIC → treat as jpeg for compatibility
  heif: "image/jpeg",
};

function getContentType(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  // Prefer our map over browser-reported type (more reliable on mobile)
  if (MIME_MAP[ext]) return MIME_MAP[ext];
  if (file.type && file.type !== "application/octet-stream") return file.type;
  return "application/octet-stream";
}

function isVideoFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const videoExts = ["mp4", "mov", "webm", "avi", "mkv", "hevc", "m4v", "3gp"];
  return file.type.startsWith("video/") || videoExts.includes(ext);
}

/** Upload a file directly from the browser to Supabase Storage */
export async function uploadFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  // Always save as .mp4 extension for MOV files (better browser playback)
  const saveExt = ext === "mov" ? "mp4" : ext;
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${saveExt}`;
  const isVideo = isVideoFile(file);
  const bucket = isVideo ? "media" : "images";
  const contentType = getContentType(file);

  // If Supabase is configured, upload directly from browser
  if (supabaseUrl.startsWith("http") && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Read file as ArrayBuffer for maximum compatibility (mobile Safari fix)
    const arrayBuffer = await file.arrayBuffer();

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, arrayBuffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  // Fallback: upload via API route (local mode, small files only)
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Upload failed");
  }

  const { url } = await res.json();
  return url;
}
