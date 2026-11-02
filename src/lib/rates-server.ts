import { FALLBACK_RATES, type Rates } from "./currency";

// Курсы ЦБ обновляются раз в сутки, поэтому держим их в памяти процесса
// и ходим к источнику не чаще раза в 30 минут.
const CACHE_TTL_MS = 30 * 60 * 1000;
const SOURCE = "https://www.cbr-xml-daily.ru/daily_json.js";

let cache: { rates: Rates; fetchedAt: number; source: string } | null = null;

export interface RatesResult extends Rates {
  source: string;
  cached: boolean;
  ageMinutes: number;
}

async function loadFromCbr(): Promise<{ rates: Rates; source: string }> {
  const res = await fetch(SOURCE, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`CBR responded ${res.status}`);

  const data = await res.json();
  const eur = data?.Valute?.EUR;
  const czk = data?.Valute?.CZK;
  if (!eur?.Value || !czk?.Value) throw new Error("CBR payload missing EUR/CZK");

  // ЦБ отдаёт цену за Nominal единиц: кроны обычно за 10
  const rates: Rates = {
    rubPerEur: eur.Value / (eur.Nominal || 1),
    rubPerCzk: czk.Value / (czk.Nominal || 1),
  };

  if (!(rates.rubPerEur > 0) || !(rates.rubPerCzk > 0)) {
    throw new Error("CBR returned non-positive rates");
  }

  return { rates, source: `ЦБ РФ, ${data.Date?.slice(0, 10) ?? "—"}` };
}

/**
 * Актуальные курсы. Никогда не бросает исключение: при недоступности ЦБ
 * возвращает последний удачный ответ, а если его нет — запасные константы.
 */
export async function getRates(): Promise<RatesResult> {
  const now = Date.now();
  const age = () => Math.round((now - (cache?.fetchedAt ?? now)) / 60000);

  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return { ...cache.rates, source: cache.source, cached: true, ageMinutes: age() };
  }

  try {
    const { rates, source } = await loadFromCbr();
    cache = { rates, fetchedAt: now, source };
    return { ...rates, source, cached: false, ageMinutes: 0 };
  } catch (err) {
    console.error("rates: CBR unavailable —", err instanceof Error ? err.message : err);
    if (cache) {
      return { ...cache.rates, source: `${cache.source} (устарел)`, cached: true, ageMinutes: age() };
    }
    return { ...FALLBACK_RATES, source: "запасной курс", cached: false, ageMinutes: 0 };
  }
}
