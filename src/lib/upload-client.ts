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

/** Если за это время не пришло ни байта прогресса — считаем, что связь встала */
const STALL_MS = 60_000;

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

export interface UploadOptions {
  /** Доля выполнения от 0 до 1 — для полоски прогресса */
  onProgress?: (fraction: number) => void;
  /** Позволяет прервать зависшую загрузку кнопкой «Отмена» */
  signal?: AbortSignal;
}

/**
 * Шлёт файл напрямую в Supabase Storage.
 * XMLHttpRequest вместо fetch — только он даёт события прогресса,
 * без которых зависшая загрузка выглядит как «ничего не происходит».
 */
function putToStorage(
  url: string,
  body: Blob,
  contentType: string,
  opts: UploadOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let stallTimer: ReturnType<typeof setTimeout>;

    const stop = () => {
      clearTimeout(stallTimer);
      opts.signal?.removeEventListener("abort", onAbort);
    };
    const armStallTimer = () => {
      clearTimeout(stallTimer);
      stallTimer = setTimeout(() => {
        xhr.abort();
        stop();
        reject(new Error("связь оборвалась, загрузка не двигается"));
      }, STALL_MS);
    };
    const onAbort = () => {
      xhr.abort();
      stop();
      reject(new Error("загрузка отменена"));
    };

    opts.signal?.addEventListener("abort", onAbort);

    xhr.upload.onprogress = (e) => {
      armStallTimer();
      if (e.lengthComputable) opts.onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      stop();
      if (xhr.status >= 200 && xhr.status < 300) {
        opts.onProgress?.(1);
        resolve();
        return;
      }
      let message = `ошибка ${xhr.status}`;
      try {
        const body = JSON.parse(xhr.responseText);
        if (body?.message) message = body.message;
      } catch {
        /* тело не JSON — оставляем код статуса */
      }
      if (xhr.status === 413) message = "файл слишком большой для хранилища";
      reject(new Error(message));
    };
    xhr.onerror = () => { stop(); reject(new Error("нет связи с хранилищем")); };
    xhr.ontimeout = () => { stop(); reject(new Error("истекло время ожидания")); };

    xhr.open("POST", url);
    xhr.setRequestHeader("apikey", supabaseAnonKey);
    xhr.setRequestHeader("Authorization", `Bearer ${supabaseAnonKey}`);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.setRequestHeader("x-upsert", "false");
    armStallTimer();
    xhr.send(body);
  });
}

/** Upload a file directly from the browser to Supabase Storage */
export async function uploadFile(file: File, opts: UploadOptions = {}): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  // Always save as .mp4 extension for MOV files (better browser playback)
  const saveExt = ext === "mov" ? "mp4" : ext;
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${saveExt}`;
  const isVideo = isVideoFile(file);
  const bucket = isVideo ? "media" : "images";
  const contentType = getContentType(file);

  // If Supabase is configured, upload directly from browser
  if (supabaseUrl.startsWith("http") && supabaseAnonKey) {
    // Подменяем тип через slice: он создаёт Blob поверх того же файла,
    // не затягивая его целиком в память. Чтение в ArrayBuffer на видео
    // в сотни мегабайт подвешивало вкладку ещё до начала отправки.
    const body = file.slice(0, file.size, contentType);

    await putToStorage(
      `${supabaseUrl}/storage/v1/object/${bucket}/${encodeURIComponent(fileName)}`,
      body,
      contentType,
      opts
    );

    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${fileName}`;
  }

  // Fallback: upload via API route (local mode, small files only)
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
    signal: opts.signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Upload failed");
  }

  const { url } = await res.json();
  opts.onProgress?.(1);
  return url;
}
