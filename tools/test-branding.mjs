// 本地验证：不依赖 Cloudflare，直接跑中间件的改写逻辑 + 品牌选择
// 运行：node tools/test-branding.mjs
import { readFileSync } from 'node:fs';
import { brandFor } from '../functions/_brands.js';
import { rewriteHtml } from '../functions/_middleware.js';

// 统一以仓库根为基准读取，避免脚本被移动后路径失效
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

const pages = [
  { file: 'index.html', path: '/' },
  { file: 'gold-pricing.html', path: '/gold-pricing.html' },
];

const hosts = [
  { host: 'www.haobao.com.sg', label: 'Haobao 域名' },
  { host: 'haobao.com.sg', label: 'Haobao 裸域' },
  { host: 'www.pioneerhorizon.com.sg', label: 'Pioneer Horizon 域名' },
  { host: 'pioneerhorizon.com.sg', label: 'Pioneer Horizon 裸域' },
  { host: 'localhost:8788', label: '本地预览（应回落默认品牌）' },
];

let pass = 0;
let fail = 0;
function check(desc, cond, extra = '') {
  if (cond) {
    pass++;
    console.log(`  ✅ ${desc}`);
  } else {
    fail++;
    console.log(`  ❌ ${desc} ${extra}`);
  }
}

for (const { host, label } of hosts) {
  const brand = brandFor(host, host);
  console.log(`\n=== ${label}  host=${host} ===`);
  console.log(`  品牌: ${brand.name} / 短名: ${brand.nameZh}`);
  console.log(`  邮箱: ${brand.email}`);
  console.log(`  导航 logo: ${brand.logoLight}`);
  console.log(`  页脚 logo: ${brand.logoDark}`);

  for (const { file, path } of pages) {
    const html = read(file);
    const out = rewriteHtml(html, brand, new URL(`https://${host}${path}`));
    const tag = `${file}` + (path !== '/' ? '' : '');

    // 1) 占位符必须全部被替换掉
    check(`${tag}: 无残留 __brand__ 占位符`, !out.includes('__brand__'));
    // 2) 品牌 logo 必须出现在 HTML 里（首屏不闪的关键）
    const isFooterOnly = false;
    check(`${tag}: 含导航 logo`, out.includes(brand.logoLight), `缺 ${brand.logoLight}`);
    check(`${tag}: 含页脚 logo`, out.includes(brand.logoDark), `缺 ${brand.logoDark}`);
    // 3) 品牌 SDK 必须注入，且早于 translations.js
    const sdkAt = out.indexOf('window.__BRAND__=');
    const trAt = out.indexOf('translations.js');
    check(`${tag}: 注入品牌 SDK`, sdkAt > -1);
    check(`${tag}: SDK 在 translations.js 之前`, sdkAt > -1 && sdkAt < trAt);
    // 4) 邮箱
    check(`${tag}: 邮箱正确`, out.includes(brand.email), `期望 ${brand.email}`);
    // 5) title 按域名走
    const expectedTitle = path.includes('gold-pricing')
      ? `Gold Pricing - ${brand.name}`
      : `${brand.name} - A New Era of Gold Ownership`;
    check(`${tag}: title = ${expectedTitle}`, out.includes(`<title>${expectedTitle}</title>`));
    // 6) canonical / og:url 按域名走（SEO 关键）
    check(`${tag}: canonical 指向本域名`, out.includes(`rel="canonical" href="https://${host}${path}"`));
    check(`${tag}: og:url 指向本域名`, out.includes(`property="og:url" content="https://${host}${path}"`));
    // 7) 不应出现另一个品牌的 logo
    const otherLogos = ['/logo_bai.png', '/logo_hei.png', '/img/brand/pioneerhorizon-logo-light.png', '/img/brand/pioneerhorizon-logo-dark.png']
      .filter((l) => l !== brand.logoLight && l !== brand.logoDark);
    check(`${tag}: 不含其他品牌 logo`, otherLogos.every((l) => !out.includes(l)),
      '泄漏: ' + otherLogos.filter((l) => out.includes(l)).join(','));
  }
}

// 交叉验证：两个域名的输出必须不同
console.log('\n=== 交叉验证：两个域名输出必须不同 ===');
const hb = rewriteHtml(read('index.html'), brandFor('www.haobao.com.sg', ''), new URL('https://www.haobao.com.sg/'));
const ph = rewriteHtml(read('index.html'), brandFor('www.pioneerhorizon.com.sg', ''), new URL('https://www.pioneerhorizon.com.sg/'));
check('两站 HTML 不相同', hb !== ph);
check('Haobao 站出现 Haobao', hb.includes('Haobao Pte. Ltd.'));
check('Pioneer Horizon 站出现 Pioneer Horizon', ph.includes('Pioneer Horizon Pte. Ltd.'));
check('Haobao 站不出现 Pioneer Horizon', !hb.includes('Pioneer Horizon'));
check('PH 站不出现 Haobao', !ph.includes('Haobao'));

console.log(`\n通过 ${pass} / 失败 ${fail}`);
process.exit(fail === 0 ? 0 : 1);
