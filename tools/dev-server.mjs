// 本地预览服务器：复用生产的品牌改写逻辑，通过 ?__host= 指定品牌
// 用法：node tools/dev-server.mjs [port]   然后访问
//   http://127.0.0.1:8788/?__host=www.pioneerhorizon.com.sg
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { brandFor } from '../functions/_brands.js';
import { rewriteHtml } from '../functions/_middleware.js';

const PORT = Number(process.argv[2] || 8788);
// 站点根目录是仓库根（tools/ 的上一级）
const ROOT = new URL('..', import.meta.url).pathname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
};

// 仅本地调试用：把导航栏各元素的几何信息写进 DOM，便于 --dump-dom 抓取
const MEASURE_SCRIPT = `<script>
window.addEventListener('load', function () {
  var r = function (el) { if (!el) return null; var b = el.getBoundingClientRect();
    return { left: Math.round(b.left), right: Math.round(b.right), w: Math.round(b.width), h: Math.round(b.height) }; };
  // 仅本地：?__lang=zh 可把页面切到中文，便于核对中文品牌文案
  var params = new URLSearchParams(location.search);
  var wantLang = params.get('__lang');
  if (wantLang && wantLang !== localStorage.getItem('language')) {
    var lt = document.getElementById('langToggle');
    if (lt) lt.click();
  }
  // 仅本地：?__scroll=footer 滚到页脚，便于截图核对深色底上的 logo
  var scrollTo = params.get('__scroll');
  if (scrollTo) {
    var target = scrollTo === 'footer' ? document.querySelector('.footer') : document.querySelector(scrollTo);
    if (target) target.scrollIntoView();
  }
  var menu = document.getElementById('navMenu');
  var links = [];
  if (menu) menu.querySelectorAll('a').forEach(function (a) {
    links.push({ t: a.textContent.trim(), w: Math.round(a.getBoundingClientRect().width) });
  });
  var out = {
    viewport: window.innerWidth,
    brand: document.documentElement.getAttribute('data-brand'),
    logo: r(document.querySelector('.site-logo')),
    menu: r(menu),
    navWrapper: r(document.querySelector('.nav-wrapper')),
    toggle: r(document.querySelector('.lang-toggle')),
    containerRight: r(document.querySelector('.nav-wrapper')).right,
    menuStyle: menu ? (function (s) {
      return { gap: s.gap, wrap: s.flexWrap, dir: s.flexDirection, w: s.width, pos: s.position };
    })(getComputedStyle(menu)) : null,
    wrapStyle: (function (s) { return { gap: s.gap, align: s.alignItems }; })(getComputedStyle(document.querySelector('.nav-wrapper'))),
    toggleStyle: (function (s) { return { pad: s.padding, w: s.width }; })(getComputedStyle(document.querySelector('.lang-toggle'))),
    contPad: getComputedStyle(document.querySelector('.container')).paddingLeft,
    // 直接查浏览器实际持有的 CSS 规则，定位规则为何未生效
    sheets: (function () {
      var res = [];
      try {
        Array.prototype.forEach.call(document.styleSheets, function (ss) {
          var rules;
          try { rules = ss.cssRules; } catch (e) { res.push('BLOCKED ' + ss.href); return; }
          if (ss.ownerNode && ss.ownerNode.id === '__metrics__') return;
          Array.prototype.forEach.call(rules || [], function (rule) {
            if (rule.type === 4) { // @media
              var cond = rule.conditionText || rule.media.mediaText;
              if (/max-width:\s*900px/.test(cond)) {
                var found = [];
                Array.prototype.forEach.call(rule.cssRules, function (inner) {
                  found.push(inner.selectorText + ' { ' + inner.style.cssText + ' }');
                });
                res.push({ media: cond, rules: found });
              }
            }
          });
        });
      } catch (e) { res.push('ERR ' + e.message); }
      return res;
    })(),
    links: links,
    linkSum: links.reduce(function (a, b) { return a + b.w; }, 0),
    overflowRight: Math.max(0, (function () {
      var m = 0;
      document.querySelectorAll('.nav-wrapper *').forEach(function (el) {
        m = Math.max(m, el.getBoundingClientRect().right);
      });
      return Math.round(m - window.innerWidth);
    })())
  };
  var pre = document.createElement('pre');
  pre.id = '__metrics';
  pre.textContent = JSON.stringify(out);
  document.body.appendChild(pre);
});
</script>`;

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    // 本地用 query 参数模拟不同域名（生产环境由 Host 头决定）
    const host = url.searchParams.get('__host') || req.headers.host || 'localhost';
    const brand = brandFor(host, host);

    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/' || pathname === '') pathname = '/index.html';
    const filePath = join(ROOT, normalize(pathname).replace(/^(\.\.[/\\])+/, ''));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end('forbidden');
      return;
    }

    let body;
    try {
      body = await readFile(filePath);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('404 ' + pathname);
      return;
    }

    const ext = extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';

    if (type.includes('text/html')) {
      // 与生产中间件完全同一套改写逻辑；用模拟域名生成 canonical / og:url
      const simUrl = new URL(url.pathname, `https://${host}`);
      let out = rewriteHtml(body.toString('utf8'), brand, simUrl);
      // 仅本地：注入布局测量脚本，便于核对各断点导航栏是否溢出
      if (url.searchParams.get('__measure')) {
        out = out.replace('</body>', MEASURE_SCRIPT + '\n</body>');
      }
      res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store', 'x-brand': brand.name });
      res.end(out);
      return;
    }

    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/plain' }).end(String(err && err.stack));
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`dev server: http://127.0.0.1:${PORT}/`);
  console.log(`  Haobao:          http://127.0.0.1:${PORT}/?__host=www.haobao.com.sg`);
  console.log(`  Pioneer Horizon: http://127.0.0.1:${PORT}/?__host=www.pioneerhorizon.com.sg`);
});
