// ══════════════════════════════════════════════════════════
//  СВЕРКА С TELEGRAM-КАНАЛОМ
//  Читает публичный канал через веб-превью t.me/s/<канал> —
//  без бота, токенов и входа в аккаунт.
// ══════════════════════════════════════════════════════════

/** Имя канала без @ — поменяй здесь, если канал сменится */
export const TG_CHANNEL = "it_tkani";

/** Сколько страниц истории просматривать максимум (на странице ~2 поста) */
const MAX_PAGES = 40;

export interface TgPost {
  id: number;
  text: string;
  url: string;
}

export interface SyncRow {
  sku: string;
  title: string;
  /** Метражи из поста канала */
  tgCuts: number[];
  /** Метражи, стоящие сейчас на сайте */
  siteCuts: number[];
  /** В посте стоит «БРОНЬ» — ткани больше нет */
  reserved: boolean;
  postUrl: string | null;
  status: "ok" | "diff" | "reserved" | "not_found";
}

function decodeHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
    .trim();
}

/**
 * Вытаскивает метражи из текста поста: «2,05м и 2,15м» → [2.05, 2.15].
 * Отсеивает цену за метр («2200 руб/м») и ширину («ш 146»),
 * где число с «м» рядом означает не длину отреза.
 */
export function parseMetres(text: string): number[] {
  const out: number[] = [];
  const re = /(\d+(?:[.,]\d+)?)\s*м(?![а-яёa-z²])/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const before = text.slice(Math.max(0, m.index - 12), m.index).toLowerCase();
    if (/руб\s*\/?\s*$|\/\s*$/.test(before)) continue; // цена за метр
    if (/\bш\s*$|ширина\s*$/.test(before)) continue;   // ширина полотна
    const v = parseFloat(m[1].replace(",", "."));
    if (v > 0 && v < 200) out.push(v);
  }
  return out;
}

/** «БРОНЬ» в посте значит, что ткань уже продана */
export function isReserved(text: string): boolean {
  return /бронь/i.test(text);
}

function parsePage(html: string): TgPost[] {
  const ids = [...html.matchAll(/data-post="[^/]+\/(\d+)"/g)].map((m) => Number(m[1]));
  const blocks = html.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/g) || [];
  return blocks.map((b, i) => ({
    id: ids[i] ?? 0,
    text: decodeHtml(b),
    url: `https://t.me/${TG_CHANNEL}/${ids[i] ?? ""}`,
  }));
}

/**
 * Листает канал вглубь, пока не найдёт все нужные артикулы
 * или не упрётся в предел страниц.
 */
export async function findPostsForSkus(skus: string[]): Promise<Map<string, TgPost>> {
  const wanted = new Set(skus.map((s) => s.toUpperCase()));
  const found = new Map<string, TgPost>();
  let before = "";

  for (let page = 0; page < MAX_PAGES && wanted.size > 0; page++) {
    const url = `https://t.me/s/${TG_CHANNEL}${before}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) break;

    const posts = parsePage(await res.text());
    if (posts.length === 0) break;

    // Страницы идут от новых к старым, поэтому первое совпадение — самое свежее
    for (const post of posts.sort((a, b) => b.id - a.id)) {
      const upper = post.text.toUpperCase();
      for (const sku of [...wanted]) {
        if (upper.includes(sku)) {
          found.set(sku, post);
          wanted.delete(sku);
        }
      }
    }

    const oldest = Math.min(...posts.map((p) => p.id).filter(Boolean));
    if (!isFinite(oldest)) break;
    before = `?before=${oldest}`;
  }

  return found;
}

/** Нормализует список метражей для сравнения: сортировка + округление */
function normalise(cuts: number[]): number[] {
  return [...cuts].map((c) => Math.round(c * 100) / 100).sort((a, b) => a - b);
}

export function compare(
  siteItems: { sku: string; title: string; cuts: number[] }[],
  posts: Map<string, TgPost>
): SyncRow[] {
  return siteItems.map((item) => {
    const post = posts.get(item.sku.toUpperCase());

    if (!post) {
      return {
        sku: item.sku,
        title: item.title,
        tgCuts: [],
        siteCuts: item.cuts,
        reserved: false,
        postUrl: null,
        status: "not_found" as const,
      };
    }

    const tgCuts = parseMetres(post.text);
    const reserved = isReserved(post.text);
    const same = JSON.stringify(normalise(tgCuts)) === JSON.stringify(normalise(item.cuts));

    return {
      sku: item.sku,
      title: item.title,
      tgCuts,
      siteCuts: item.cuts,
      reserved,
      postUrl: post.url,
      status: reserved ? ("reserved" as const) : same ? ("ok" as const) : ("diff" as const),
    };
  });
}
