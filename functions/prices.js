export async function onRequest() {
  const GOLDAPI_KEY = 'goldapi-3dyvssmkwciu4j-io';
  // 你用 curl 验证可用的是 www.goldapi.io，这里保持一致，避免不同域名导致的权限/路由差异
  const GOLDAPI_BASE = 'https://www.goldapi.io/api';

  const headers = {
    'x-access-token': GOLDAPI_KEY,
    'Content-Type': 'application/json'
  };

  try {
    const [xauRes, xagRes] = await Promise.all([
      fetch(`${GOLDAPI_BASE}/XAU/USD`, { headers }),
      fetch(`${GOLDAPI_BASE}/XAG/USD`, { headers })
    ]);

    if (!xauRes.ok || !xagRes.ok) {
      const detail = {
        error: 'GoldAPI request failed',
        xau_status: xauRes.status,
        xag_status: xagRes.status
      };
      return new Response(JSON.stringify(detail), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const xauData = await xauRes.json();
    const xagData = await xagRes.json();

    const result = {
      xauusd: xauData.price || (xauData.price_gram_24k && xauData.price_gram_24k * 31.1035) || null,
      xagusd: xagData.price || (xagData.price_gram_999 && xagData.price_gram_999 * 31.1035) || null,
      timestamp: Date.now()
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600' // 浏览器和边缘缓存 1 小时
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Unexpected error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}


