import { NextRequest, NextResponse } from "next/server";

// MyMemory принимает максимум 500 символов за запрос, поэтому длинные
// описания режем на куски по границам строк и предложений.
const MAX_CHUNK = 450;

/** Необязательный email — поднимает бесплатную квоту с 5 000 до 50 000 символов в сутки */
const CONTACT_EMAIL = process.env.MYMEMORY_EMAIL || "";

class TranslateError extends Error {}

function chunk(text: string): string[] {
  const out: string[] = [];
  let buf = "";

  const flush = () => {
    if (buf.trim()) out.push(buf);
    buf = "";
  };

  for (const line of text.split("\n")) {
    if (line.length > MAX_CHUNK) {
      flush();
      // Строка сама по себе длиннее лимита — делим по предложениям
      let rest = line;
      while (rest.length > MAX_CHUNK) {
        const cut = rest.lastIndexOf(". ", MAX_CHUNK);
        const at = cut > MAX_CHUNK / 2 ? cut + 1 : MAX_CHUNK;
        out.push(rest.slice(0, at));
        rest = rest.slice(at);
      }
      buf = rest;
      continue;
    }
    if ((buf + "\n" + line).length > MAX_CHUNK) flush();
    buf = buf ? `${buf}\n${line}` : line;
  }
  flush();

  return out.length ? out : [text];
}

async function translateChunk(text: string, to: string): Promise<string> {
  const params = new URLSearchParams({ q: text, langpair: `ru|${to}` });
  if (CONTACT_EMAIL) params.set("de", CONTACT_EMAIL);

  const res = await fetch(`https://api.mymemory.translated.net/get?${params}`, {
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => null);

  // Сервис отдаёт 200 даже на ошибку, а настоящий статус кладёт в тело
  const status = Number(data?.responseStatus);
  const translated: string = data?.responseData?.translatedText ?? "";

  if (status === 429) {
    throw new TranslateError(
      "Исчерпан дневной лимит бесплатных переводов. Попробуйте завтра или впишите переводы вручную."
    );
  }
  if (status !== 200 || !translated) {
    throw new TranslateError(data?.responseDetails || "Сервис перевода вернул ошибку");
  }
  // Предупреждения прилетают в том же поле, что и перевод — такое не сохраняем
  if (/MYMEMORY WARNING|QUERY LENGTH LIMIT|QUOTA/i.test(translated)) {
    throw new TranslateError("Сервис перевода вернул предупреждение вместо текста");
  }

  return translated;
}

async function translateText(text: string, to: string): Promise<string> {
  if (!text.trim()) return "";
  const parts: string[] = [];
  for (const piece of chunk(text)) {
    parts.push(await translateChunk(piece, to));
  }
  return parts.join("\n");
}

export async function POST(req: NextRequest) {
  const { title, description } = await req.json();

  try {
    // Последовательно, чтобы не упереться в ограничение по частоте запросов
    const titleEN = await translateText(title, "en");
    const titleCS = await translateText(title, "cs");
    const descEN = await translateText(description, "en");
    const descCS = await translateText(description, "cs");

    return NextResponse.json({
      en: { title: titleEN, description: descEN },
      cs: { title: titleCS, description: descCS },
    });
  } catch (err) {
    const message =
      err instanceof TranslateError ? err.message : "Не удалось связаться с сервисом перевода";
    console.error("translate:", message);
    // Лучше ничего не записать, чем записать в поля текст ошибки
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
