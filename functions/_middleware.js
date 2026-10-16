// 页面中间件：按访问域名改写品牌相关内容
// 目的：同一套代码服务多个域名，各自输出 logo、站名、邮箱、SEO 元信息
import { brandFor, clientBrand, BRANDS } from './_brands.js';

// HTML 里 logo 统一写成这两个占位路径，由这里改写成当前品牌的真实文件
const LOGO_LIGHT = '/__brand__/logo-light.png';
const LOGO_DARK = '/__brand__/logo-dark.png';

// 改写邮箱：从品牌配置里自动汇总所有已知邮箱，
// 这样新增品牌时无需再回来维护这个正则（新增后记得同步 brand.js 的 FALLBACK）
const EMAIL_RE = new RegExp(
  [...new Set(Object.values(BRANDS).map((b) => b.email).filter(Boolean))]
    .map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|'),
  'g'
);

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function pageTitleFor(pathname, brand) {
  return pathname.includes('gold-pricing')
    ? `Gold Pricing - ${brand.name}`
    : `${brand.name} - A New Era of Gold Ownership`;
}

export function rewriteHtml(html, brand, url) {
  const pathname = url.pathname;
  const title = pageTitleFor(pathname, brand);

  // 1) logo 路径 + alt
  html = html.split(LOGO_LIGHT).join(brand.logoLight);
  html = html.split(LOGO_DARK).join(brand.logoDark);
  html = html.replace(
    /alt="(?:Haobao|Pioneer Horizon) logo"/g,
    `alt="${escapeHtml(brand.name)} logo"`
  );

  // 2) 联系邮箱
  html = html.replace(EMAIL_RE, brand.email);

  // 3) <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`);

  // 4) 注入前端品牌 SDK（必须早于 translations.js / script.js 执行）
  const sdk = `<script>window.__BRAND__=${JSON.stringify(clientBrand(brand))};</script>`;
  html = html.replace('<!-- BRAND_SDK -->', sdk);

  // 5) SEO：原站没有 canonical / og，按当前域名补上，避免两站被判为重复内容
  if (!/rel="canonical"/.test(html)) {
    const origin = `https://${url.host}`;
    const seo = [
      `<link rel="canonical" href="${origin}${pathname}">`,
      '<meta property="og:type" content="website">',
      `<meta property="og:site_name" content="${escapeHtml(brand.name)}">`,
      `<meta property="og:title" content="${escapeHtml(title)}">`,
      `<meta property="og:url" content="${origin}${pathname}">`,
      `<meta property="og:image" content="${origin}${brand.logoDark}">`,
      '<meta name="twitter:card" content="summary_large_image">',
    ].join('\n    ');
    html = html.replace('</head>', `    ${seo}\n</head>`);
  }

  return html;
}

export async function onRequest(context) {
  const { request, next } = context;

  // next() 只调用一次：中间件抛错会导致整站 500，因此只把「改写」逻辑包在 try 里
  const response = await next();

  const ct = response.headers.get('content-type') || '';
  if (!ct.includes('text/html')) return response;

  try {
    const url = new URL(request.url);
    const brand = brandFor(request.headers.get('host'), url.host);
    const html = await response.text();
    const out = rewriteHtml(html, brand, url);

    const headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.set('cache-control', 'public, max-age=300');
    return new Response(out, { status: response.status, headers });
  } catch (err) {
    // 改写失败：原样返回，页面品牌回退为默认品牌，不影响可用性
    console.error('[brand-middleware]', err && err.stack ? err.stack : err);
    return response;
  }
}
