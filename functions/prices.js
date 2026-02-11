export async function onRequest({ request, env, waitUntil }) {
  const GOLDAPI_KEY = env && env.GOLDAPI_KEY;
  // 你用 curl 验证可用的是 www.goldapi.io，这里保持一致，避免不同域名导致的权限/路由差异
  const GOLDAPI_BASE = 'https://www.goldapi.io/api';

  const commonHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    // 1 小时边缘缓存；上游失败时允许使用旧缓存（最多 1 天）
    'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-if-error=86400'
  };

  if (!GOLDAPI_KEY) {
    return new Response(JSON.stringify({ error: 'Missing GOLDAPI_KEY' }), {
      status: 500,
      headers: commonHeaders
    });
  }

  const cache = caches.default;
  const url = new URL(request.url);
  const cacheKey = new Request(url.toString(), {
    method: 'GET',
    headers: request.headers
  });

  // 先读 Cloudflare 边缘缓存，避免频繁打到上游 API 导致超限
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const headers = {
    'x-access-token': GOLDAPI_KEY,
    'Content-Type': 'application/json'
  };

  const fetchUpstream = async () => {
    const [xauRes, xagRes] = await Promise.all([
      fetch(`${GOLDAPI_BASE}/XAU/USD`, { headers }),
      fetch(`${GOLDAPI_BASE}/XAG/USD`, { headers })
    ]);

    if (!xauRes.ok || !xagRes.ok) {
      return {
        ok: false,
        detail: {
          error: 'GoldAPI request failed',
          xau_status: xauRes.status,
          xag_status: xagRes.status
        }
      };
    }

    const xauData = await xauRes.json();
    const xagData = await xagRes.json();

    const result = {
      xauusd: xauData.price || (xauData.price_gram_24k && xauData.price_gram_24k * 31.1035) || null,
      xagusd: xagData.price || (xagData.price_gram_999 && xagData.price_gram_999 * 31.1035) || null,
      timestamp: Date.now()
    };

    return { ok: true, result };
  };

  try {
    const upstream = await fetchUpstream();

    if (!upstream.ok) {
      // 上游失败时，优先尝试回退到缓存（如果并发下已有请求写入缓存，这里可能命中）
      const stale = await cache.match(cacheKey);
      if (stale) return stale;

      return new Response(JSON.stringify(upstream.detail), {
        status: 502,
        headers: commonHeaders
      });
    }

    const response = new Response(JSON.stringify(upstream.result), {
      status: 200,
      headers: commonHeaders
    });

    // 写入边缘缓存（异步，不阻塞响应）
    waitUntil(cache.put(cacheKey, response.clone()));

    return response;
  } catch (e) {
    // 异常同样尝试回退到缓存
    const stale = await cache.match(cacheKey);
    if (stale) return stale;

    return new Response(JSON.stringify({ error: 'Unexpected error' }), {
      status: 500,
      headers: commonHeaders
    });
  }
}


