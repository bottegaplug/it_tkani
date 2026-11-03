import { NextRequest, NextResponse } from "next/server";

// ══════════════════════════════════════════════════════════
//  ПЕРЕВОД ОПИСАНИЙ
//  Основной сервис — DeepL (ключ в DEEPL_API_KEY, 500 000 символов
//  в месяц бесплатно, длинный текст берёт целиком).
//  Без ключа работает запасной MyMemory: он слабее и режет
//  запросы по 500 символов, поэтому текст приходится делить.
// ══════════════════════════════════════════════════════════

const DEEPL_KEY = process.env.DEEPL_API_KEY || "";
const MYMEMORY_EMAIL = process.env.MYMEMORY_EMAIL || "";
const MAX_CHUNK = 450;

class TranslateError extends Error {}

interface Pair {
  title: string;
  description: string;
}

/* ───────────────────────── DeepL ───────────────────────── */

/** Платные ключи оканчиваются иначе и живут на другом домене */
function deeplEndpoint(): string {
  return DEEPL_KEY.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";
}

/** Переводит заголовок и описание за один запрос */
async function deeplPair(pair: Pair, target: "EN-GB" | "CS"): Promise<Pair> {
  const res = await fetch(deeplEndpoint(), {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: [pair.title, pair.description],
      source_lang: "RU",
      target_lang: target,
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (res.status === 403) throw new TranslateError("DeepL отклонил ключ — проверьте DEEPL_API_KEY");
  if (res.status === 456) throw new TranslateError("Исчерпан месячный лимит DeepL");
  if (res.status === 429) throw new TranslateError("Слишком много запросов к DeepL, подождите минуту");
  // 451 — DeepL не обслуживает страну, из которой идёт запрос
  if (res.status === 451) throw new TranslateError("DeepL недоступен из страны сервера");
  if (!res.ok) throw new TranslateError(`DeepL вернул ошибку ${res.status}`);

  const data = await res.json().catch(() => null);
  const out = data?.translations;
  if (!Array.isArray(out) || out.length < 2) throw new TranslateError("DeepL вернул пустой ответ");

  return { title: out[0]?.text ?? "", description: out[1]?.text ?? "" };
}

/* ─────────────────────── MyMemory ─────────────────────── */

function chunk(text: string): string[] {
  const out: string[] = [];
  let buf = "";
  const flush = () => { if (buf.trim()) out.push(buf); buf = ""; };

  for (const line of text.split("\n")) {
    if (line.length > MAX_CHUNK) {
      flush();
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

async function myMemoryChunk(text: string, to: string): Promise<string> {
  const params = new URLSearchParams({ q: text, langpair: `ru|${to}` });
  if (MYMEMORY_EMAIL) params.set("de", MYMEMORY_EMAIL);

  const res = await fetch(`https://api.mymemory.translated.net/get?${params}`, {
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => null);

  // Сервис отдаёт 200 даже на ошибку, настоящий статус лежит в теле
  const status = Number(data?.responseStatus);
  const translated: string = data?.responseData?.translatedText ?? "";

  if (status === 429) {
    throw new TranslateError("Исчерпан дневной лимит бесплатных переводов. Попробуйте завтра.");
  }
  if (status !== 200 || !translated) {
    throw new TranslateError(data?.responseDetails || "Сервис перевода вернул ошибку");
  }
  if (/MYMEMORY WARNING|QUERY LENGTH LIMIT|QUOTA/i.test(translated)) {
    throw new TranslateError("Сервис перевода вернул предупреждение вместо текста");
  }
  return translated;
}

async function myMemoryText(text: string, to: string): Promise<string> {
  if (!text.trim()) return "";
  const parts: string[] = [];
  for (const piece of chunk(text)) parts.push(await myMemoryChunk(piece, to));
  return parts.join("\n");
}

/* ───────────────────────── Route ───────────────────────── */

export async function POST(req: NextRequest) {
  const { title, description } = await req.json();
  const pair: Pair = { title: title || "", description: description || "" };

  try {
    if (DEEPL_KEY) {
      try {
        const [en, cs] = await Promise.all([deeplPair(pair, "EN-GB"), deeplPair(pair, "CS")]);
        return NextResponse.json({ en, cs, engine: "DeepL" });
      } catch (err) {
        // DeepL недоступен (например, блокирует страну сервера) — не сдаёмся,
        // а доводим перевод запасным сервисом
        console.error("translate: DeepL недоступен, перехожу на MyMemory —",
          err instanceof Error ? err.message : err);
      }
    }

    // Запасной путь — последовательно, чтобы не упереться в ограничение по частоте
    const en = {
      title: await myMemoryText(pair.title, "en"),
      description: await myMemoryText(pair.description, "en"),
    };
    const cs = {
      title: await myMemoryText(pair.title, "cs"),
      description: await myMemoryText(pair.description, "cs"),
    };
    return NextResponse.json({ en, cs, engine: "MyMemory" });
  } catch (err) {
    const message =
      err instanceof TranslateError ? err.message : "Не удалось связаться с сервисом перевода";
    console.error("translate:", message);
    // Лучше ничего не записать, чем записать в поля текст ошибки
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
