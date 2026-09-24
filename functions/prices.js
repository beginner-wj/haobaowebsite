// Market Reference Prices 聚合接口（Cloudflare Pages Function）
// 自动拉取并换算以下市场数据：
//   1. Global XAU/USD Spot            —— goldapi.io（实时）
//   2. SGD Au99.99（上金所延迟行情）  —— 新浪财经 gds_AU9999（主）＋ 上金所英文站 HTML（备）
//   3. Shanghai Gold Benchmark AM/PM  —— 上金所基准价接口 /graph/DayilyJzj（zp=早盘 AM，wp=午盘 PM）
//   4. LBMA Gold Price AM/PM          —— prices.lbma.org.uk/json/today.json
//   5. 汇率 USD/CNY、USD/SGD          —— open.er-api.com
// 换算口径：1 troy oz = 31.1034768 g；自有报价 SELL=XAU/USD×1.02、BUY=XAU/USD×0.98

const OZT = 31.1034768; // 1 troy ounce 精确克数（用户指定）

const SGE_QUOTES_URL = 'https://en.sge.com.cn/data_DelayedQuotes';
const SGE_BENCHMARK_URL = 'https://en.sge.com.cn/graph/DayilyJzj';
const LBMA_TODAY_URL = 'https://prices.lbma.org.uk/json/today.json';
const FX_URL = 'https://open.er-api.com/v6/latest/USD';
const SINA_AU9999_URL = 'https://hq.sinajs.cn/list=gds_AU9999';

const GOLDAPI_BASE = 'https://www.goldapi.io/api';

// 每个请求的超时（毫秒）
const FETCH_TIMEOUT_MS = 9000;

// 带超时的 fetch
async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const round = (v, digits = 2) => {
  const n = num(v);
  if (n === null) return null;
  const f = Math.pow(10, digits);
  return Math.round(n * f) / f;
};

// ---- 数据源抓取 ----

// 1) XAU/USD 与 XAG/USD（goldapi.io，需要 GOLDAPI_KEY）
async function fetchGoldPrices(env) {
  const key = env && env.GOLDAPI_KEY;
  if (!key) return { ok: false, reason: 'Missing GOLDAPI_KEY' };
  const [xauRes, xagRes] = await Promise.all([
    fetchWithTimeout(`${GOLDAPI_BASE}/XAU/USD`, {
      headers: { 'x-access-token': key, 'Content-Type': 'application/json' }
    }),
    fetchWithTimeout(`${GOLDAPI_BASE}/XAG/USD`, {
      headers: { 'x-access-token': key, 'Content-Type': 'application/json' }
    })
  ]);
  if (!xauRes.ok || !xagRes.ok) {
    return { ok: false, reason: `goldapi status ${xauRes.status}/${xagRes.status}` };
  }
  const [xauData, xagData] = await Promise.all([xauRes.json(), xagRes.json()]);
  const xauUsdOz = num(xauData.price) || num(xauData.price_gram_24k && xauData.price_gram_24k * OZT);
  const xagUsdOz = num(xagData.price) || num(xagData.price_gram_999 && xagData.price_gram_999 * OZT);
  if (xauUsdOz === null) return { ok: false, reason: 'no xau price' };
  return { ok: true, xau_usd_oz: xauUsdOz, xag_usd_oz: xagUsdOz };
}

// 2) SGE Au99.99（新浪财经，延迟行情；主源）
async function fetchSgeAu9999Sina() {
  const res = await fetchWithTimeout(SINA_AU9999_URL, {
    headers: { Referer: 'https://finance.sina.com.cn' }
  });
  if (!res.ok) return { ok: false, reason: `sina status ${res.status}` };
  const text = await res.text();
  // var hq_str_gds_AU9999="926.50,0,926.50,927.00,935.78,924.10,15:30:01,...,2026-09-24,沪金99";
  const m = text.match(/="([^"]*)"/);
  if (!m) return { ok: false, reason: 'sina parse fail' };
  const parts = m[1].split(',');
  const price = num(parts[0]);
  const date = parts[parts.length - 2];
  const time = parts[6];
  return price && price > 0
    ? { ok: true, cny_g: price, lastUpdated: `${date} ${time || ''}`.trim() }
    : { ok: false, reason: 'sina no value' };
}

// 2') SGE Au99.99（上金所英文站延迟行情页；备源，HTML 表格）
async function fetchSgeAu9999SgeHtml() {
  const res = await fetchWithTimeout(SGE_QUOTES_URL);
  if (!res.ok) return { ok: false, reason: `sge quotes status ${res.status}` };
  const html = await res.text();
  // 行结构：<td>Au99.99</td><td>最新</td><td>最高</td><td>最低</td><td>开盘</td>
  const m = html.match(/<td>Au99\.99<\/td>\s*<td[^>]*>([\d.]+)<\/td>/i);
  const price = m ? num(m[1]) : null;
  return price && price > 0
    ? { ok: true, cny_g: price }
    : { ok: false, reason: 'sge quotes no value' };
}

// 3) 上海金基准价 AM/PM（上金所图表接口，POST；zp=早盘价AM，wp=午盘价PM，单位 CNY/g）
async function fetchShanghaiBenchmark() {
  const res = await fetchWithTimeout(SGE_BENCHMARK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: new URLSearchParams({ start: '', end: '' })
  });
  if (!res.ok) return { ok: false, reason: `sge benchmark status ${res.status}` };
  const data = await res.json();
  const lastOf = (arr) => {
    if (!Array.isArray(arr) || !arr.length) return null;
    const last = arr[arr.length - 1];
    if (!Array.isArray(last) || last.length < 2) return null;
    const ts = num(last[0]);
    const price = num(last[1]);
    if (ts === null || price === null) return null;
    // SGE 时间戳按北京时间 00:00 存储（即 16:00 UTC）；按 UTC+8 取日期，避免 Worker（UTC）少一天
    const d = new Date(ts + 8 * 3600 * 1000);
    return {
      price,
      date: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
    };
  };
  const am = lastOf(data.zp);
  const pm = lastOf(data.wp);
  if (!am || !pm) return { ok: false, reason: 'sge benchmark empty' };
  return { ok: true, am, pm };
}

// 4) LBMA Gold Price AM/PM（LBMA 官方 today.json，USD/oz）
async function fetchLbma() {
  const res = await fetchWithTimeout(LBMA_TODAY_URL);
  if (!res.ok) return { ok: false, reason: `lbma status ${res.status}` };
  const data = await res.json();
  const gold = data && data.gold;
  const pick = (v) => {
    if (!v) return null;
    const usd = num(v.usd);
    if (usd === null) return null;
    const dateRaw = typeof v.date === 'string' ? v.date : '';
    // LBMA 返回 dd/mm（如 23/09）→ 转 yyyy-mm-dd（年份取当前年，跨年时回退一年）
    const m = dateRaw.match(/(\d{2})\/(\d{2})/);
    let date = dateRaw;
    if (m) {
      const day = m[1];
      const month = m[2];
      const now = new Date();
      let year = now.getFullYear();
      if (Number(month) > now.getMonth() + 1) year -= 1;
      date = `${year}-${month}-${day}`;
    }
    return { usd_oz: usd, date };
  };
  const am = pick(gold && gold.am);
  const pm = pick(gold && gold.pm);
  if (!am && !pm) return { ok: false, reason: 'lbma empty' };
  return { ok: true, am, pm };
}

// 5) 汇率：主源 open.er-api.com（每日更新，免 key）；备源 frankfurter.dev（ECB，T-1）
async function fetchFxFromErApi() {
  const res = await fetchWithTimeout(FX_URL);
  if (!res.ok) return { ok: false, reason: `er-api status ${res.status}` };
  const data = await res.json();
  const cny = num(data.rates && data.rates.CNY);
  const sgd = num(data.rates && data.rates.SGD);
  if (cny === null || sgd === null) return { ok: false, reason: 'er-api missing rates' };
  return {
    ok: true,
    usd_cny: cny,
    usd_sgd: sgd,
    source: 'open.er-api.com',
    updatedAt: typeof data.time_last_update_utc === 'string' ? data.time_last_update_utc : null
  };
}

async function fetchFxFromFrankfurter() {
  const res = await fetchWithTimeout('https://api.frankfurter.dev/v1/latest?base=USD&symbols=CNY,SGD');
  if (!res.ok) return { ok: false, reason: `frankfurter status ${res.status}` };
  const data = await res.json();
  const cny = num(data.rates && data.rates.CNY);
  const sgd = num(data.rates && data.rates.SGD);
  if (cny === null || sgd === null) return { ok: false, reason: 'frankfurter missing rates' };
  return {
    ok: true,
    usd_cny: cny,
    usd_sgd: sgd,
    source: 'frankfurter.dev (ECB)',
    updatedAt: typeof data.date === 'string' ? data.date : null
  };
}

async function fetchFx() {
  const primary = await fetchFxFromErApi();
  if (primary.ok) return primary;
  const fallback = await fetchFxFromFrankfurter();
  if (fallback.ok) return fallback;
  return { ok: false, reason: `${primary.reason}; ${fallback.reason}` };
}

// ---- 换算 ----

// 以 USD/oz 与 USD/CNY 为基准，补齐各单位
function convertUsdOz(usd_oz, fx) {
  if (usd_oz === null) return null;
  const usd_g = usd_oz / OZT;
  const cny_g = usd_g * fx.usd_cny;
  const cny_oz = usd_oz * fx.usd_cny;
  return {
    usd_oz: round(usd_oz, 2),
    usd_g: round(usd_g, 4),
    cny_g: round(cny_g, 4),
    cny_oz: round(cny_oz, 2)
  };
}

// 以 CNY/g 为基准（SGE 系），补齐各单位（含 SGD）
function convertCnyG(cny_g, fx) {
  if (cny_g === null) return null;
  const usd_g = cny_g / fx.usd_cny;
  const usd_oz = usd_g * OZT;
  const cny_oz = cny_g * OZT;
  const sgd_g = usd_g * fx.usd_sgd;
  const sgd_oz = sgd_g * OZT;
  return {
    cny_g: round(cny_g, 4),
    cny_oz: round(cny_oz, 2),
    usd_g: round(usd_g, 4),
    usd_oz: round(usd_oz, 2),
    sgd_g: round(sgd_g, 4),
    sgd_oz: round(sgd_oz, 2)
  };
}

// ---- 组装 ----

export async function buildPayload(env) {
  const [gold, sgeSina, sgeHtml, benchmark, lbma, fx] = await Promise.all([
    fetchGoldPrices(env).catch((e) => ({ ok: false, reason: String(e && e.message || e) })),
    fetchSgeAu9999Sina().catch((e) => ({ ok: false, reason: String(e && e.message || e) })),
    fetchSgeAu9999SgeHtml().catch((e) => ({ ok: false, reason: String(e && e.message || e) })),
    fetchShanghaiBenchmark().catch((e) => ({ ok: false, reason: String(e && e.message || e) })),
    fetchLbma().catch((e) => ({ ok: false, reason: String(e && e.message || e) })),
    fetchFx().catch((e) => ({ ok: false, reason: String(e && e.message || e) }))
  ]);

  // Au99.99：新浪主源，失败则用上金所 HTML
  const au9999Raw = sgeSina.ok ? sgeSina : sgeHtml;
  const fxData = fx.ok ? fx : { ok: false };

  const nowIso = new Date().toISOString();

  const markets = {
    xauusd: {
      ...(gold.ok && fxData.ok ? convertUsdOz(gold.xau_usd_oz, fxData) : {}),
      ...(gold.ok ? { lastUpdated: nowIso } : {}),
      status: gold.ok ? 'live' : 'error'
    },
    sge_au9999: {
      ...(au9999Raw.ok && fxData.ok ? convertCnyG(au9999Raw.cny_g, fxData) : {}),
      ...(au9999Raw.ok ? { lastUpdated: au9999Raw.lastUpdated || null } : {}),
      status: au9999Raw.ok ? 'delayed' : 'error'
    },
    sh_am: benchmark.ok && fxData.ok
      ? { ...convertCnyG(benchmark.am.price, fxData), date: benchmark.am.date, status: 'benchmark' }
      : { status: benchmark.ok && !fxData.ok ? 'fx-error' : 'error' },
    sh_pm: benchmark.ok && fxData.ok
      ? { ...convertCnyG(benchmark.pm.price, fxData), date: benchmark.pm.date, status: 'benchmark' }
      : { status: benchmark.ok && !fxData.ok ? 'fx-error' : 'error' },
    lbma_am: lbma.ok && fxData.ok && lbma.am
      ? { ...convertUsdOz(lbma.am.usd_oz, fxData), date: lbma.am.date, status: 'benchmark' }
      : { status: lbma.ok && !fxData.ok ? 'fx-error' : 'error' },
    lbma_pm: lbma.ok && fxData.ok && lbma.pm
      ? { ...convertUsdOz(lbma.pm.usd_oz, fxData), date: lbma.pm.date, status: 'benchmark' }
      : { status: lbma.ok && !fxData.ok ? 'fx-error' : 'error' }
  };

  // 自有报价：SELL = XAU/USD × 1.02，BUY = XAU/USD × 0.98（USD/oz 与 USD/g）
  const quotes = { buy: null, sell: null };
  if (gold.ok) {
    const buyOz = gold.xau_usd_oz * 0.98;
    const sellOz = gold.xau_usd_oz * 1.02;
    quotes.buy = { usd_oz: round(buyOz, 2), usd_g: round(buyOz / OZT, 4), lastUpdated: nowIso };
    quotes.sell = { usd_oz: round(sellOz, 2), usd_g: round(sellOz / OZT, 4), lastUpdated: nowIso };
  }

  return {
    updatedAt: nowIso,
    fx: fxData.ok
      ? { usd_cny: fxData.usd_cny, usd_sgd: fxData.usd_sgd, source: fxData.source || 'open.er-api.com', updatedAt: fxData.updatedAt }
      : null,
    markets,
    quotes,
    sources: {
      xauusd: 'https://www.goldapi.io',
      sge_au9999: 'https://en.sge.com.cn/data_DelayedQuotes',
      sh_am: 'https://en.sge.com.cn/data_BenchmarkPrice',
      sh_pm: 'https://en.sge.com.cn/data_BenchmarkPrice',
      lbma_am: 'https://www.lbma.org.uk/prices-and-data/lbma-precious-metal-prices',
      lbma_pm: 'https://www.lbma.org.uk/prices-and-data/lbma-precious-metal-prices'
    },
    // 向后兼容：现有产品页小部件读取 xauusd / xagusd
    xauusd: gold.ok ? round(gold.xau_usd_oz, 2) : null,
    xagusd: gold.ok && gold.xag_usd_oz !== null ? round(gold.xag_usd_oz, 2) : null
  };
}

export async function onRequest({ request, env, waitUntil }) {
  const commonHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    // 实时行情 30s 边缘缓存；上游失败时允许使用旧缓存（最多 1 天）
    'Cache-Control': 'public, max-age=0, s-maxage=30, stale-if-error=86400'
  };

  const cache = caches.default;
  const url = new URL(request.url);
  const cacheKey = new Request(url.toString(), {
    method: 'GET',
    headers: request.headers
  });

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  try {
    const result = await buildPayload(env);
    const response = new Response(JSON.stringify(result), {
      status: 200,
      headers: commonHeaders
    });
    waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (e) {
    const stale = await cache.match(cacheKey);
    if (stale) return stale;
    return new Response(JSON.stringify({ error: 'Unexpected error' }), {
      status: 500,
      headers: commonHeaders
    });
  }
}
