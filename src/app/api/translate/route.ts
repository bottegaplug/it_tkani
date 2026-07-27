import { NextRequest, NextResponse } from "next/server";

async function translateText(text: string, to: string): Promise<string> {
  if (!text.trim()) return "";
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ru|${to}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    const data = await res.json();
    return data.responseData?.translatedText || text;
  } catch {
    return text;
  }
}

export async function POST(req: NextRequest) {
  const { title, description } = await req.json();

  const [titleEN, titleCS, descEN, descCS] = await Promise.all([
    translateText(title, "en"),
    translateText(title, "cs"),
    translateText(description, "en"),
    translateText(description, "cs"),
  ]);

  return NextResponse.json({
    en: { title: titleEN, description: descEN },
    cs: { title: titleCS, description: descCS },
  });
}
