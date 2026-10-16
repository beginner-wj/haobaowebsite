// 前端验证：模拟浏览器按真实顺序加载 translations.js -> brand.js -> script.js 的初始化，
// 校验两个域名下 logo / 邮箱 / 品牌文案是否都正确。
// 运行：node tools/test-frontend-branding.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// 统一以仓库根为基准读取，避免脚本被移动后路径失效
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

function makeEl(attrs = {}, tag = 'P') {
  const a = { ...attrs };
  return {
    tagName: tag,
    textContent: '',
    _attrs: a,
    getAttribute: (k) => (k in a ? a[k] : null),
    setAttribute: (k, v) => { a[k] = v; },
    get src() { return a.src; },
    set src(v) { a.src = v; },
    get alt() { return a.alt; },
    set alt(v) { a.alt = v; },
  };
}

function runSite(host) {
  const logoDark = makeEl({ 'data-brand-logo': 'dark' }, 'IMG');
  const logoLight = makeEl({ 'data-brand-logo': 'light' }, 'IMG');
  const email1 = makeEl({ 'data-brand-email': '' }, 'P');
  const email2 = makeEl({ 'data-brand-email': '' }, 'A');
  const all = [logoDark, logoLight, email1, email2];

  const rootAttrs = {};
  const documentElement = {
    setAttribute: (k, v) => { rootAttrs[k] = v; },
    getAttribute: (k) => (k in rootAttrs ? rootAttrs[k] : null),
  };

  const sandbox = {
    console,
    location: { hostname: host, protocol: 'https:' },
    document: {
      documentElement,
      querySelectorAll: (sel) => (sel === '[data-brand-logo]'
        ? [logoDark, logoLight]
        : sel === '[data-brand-email]' ? [email1, email2] : []),
      addEventListener: () => {},
      getElementById: () => null,
    },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  // 真实顺序：translations.js -> brand.js
  vm.runInContext(read('translations.js'), sandbox, { filename: 'translations.js' });
  vm.runInContext(read('brand.js'), sandbox, { filename: 'brand.js' });
  // 模拟 script.js 的 DOMContentLoaded 初始化
  sandbox.initBrandLogo();
  sandbox.initBrandEmail();

  return {
    brand: sandbox.__BRAND__,
    // translations 是 const 声明，不挂在 global 上，需在上下文内求值取出
    tr: vm.runInContext('translations', sandbox),
    dataBrand: rootAttrs['data-brand'],
    logoDark, logoLight, email1, email2,
  };
}

let pass = 0, fail = 0;
const check = (d, c, x = '') => { if (c) { pass++; console.log(`  ✅ ${d}`); } else { fail++; console.log(`  ❌ ${d} ${x}`); } };

for (const host of ['www.haobao.com.sg', 'www.pioneerhorizon.com.sg']) {
  const isPH = host.includes('pioneerhorizon');
  console.log(`\n=== ${host} ===`);
  const r = runSite(host);
  const expName = isPH ? 'Pioneer Horizon Pte. Ltd.' : 'Haobao Pte. Ltd.';
  const expZh = isPH ? 'Pioneer Horizon' : '好宝';
  const expLogoLight = isPH ? '/img/brand/pioneerhorizon-logo-light.png' : '/logo_bai.png';
  const expLogoDark = isPH ? '/img/brand/pioneerhorizon-logo-dark.png' : '/logo_hei.png';
  const expEmail = isPH ? 'salesdpt@pioneerhorizon.com.sg' : 'salesdpt@haobaoco.com';

  check(`品牌名 = ${expName}`, r.brand.name === expName, `实际 ${r.brand.name}`);
  check(`data-brand = ${isPH ? 'pioneerhorizon' : 'haobao'}`, r.dataBrand === (isPH ? 'pioneerhorizon' : 'haobao'),
    `实际 ${r.dataBrand}`);
  check(`logo 已注入导航栏`, r.logoDark.src === expLogoDark, `实际 ${r.logoDark.src}`);
  check(`logo 已注入页脚`, r.logoLight.src === expLogoLight, `实际 ${r.logoLight.src}`);
  check('logo alt 带品牌名', r.logoDark.alt === `${expName} logo`, `实际 ${r.logoDark.alt}`);
  check(`邮箱元素 = ${expEmail}`, r.email1.textContent === expEmail && r.email2.textContent === expEmail);
  check('A 标签带 mailto', r.email2.getAttribute('href') === `mailto:${expEmail}`);

  // 占位符必须已被替换
  const leftovers = [];
  for (const lang of ['zh', 'en']) {
    for (const [k, v] of Object.entries(r.tr[lang])) {
      if (typeof v === 'string' && v.includes('{{')) leftovers.push(`${lang}.${k}=${v}`);
    }
  }
  check('translations 无残留 {{}} 占位符', leftovers.length === 0, leftovers.slice(0, 3).join(' | '));

  // 品牌文案正确
  check(`中文版权 = ${expName}`, r.tr.zh['footer.copyright'].includes(expName), r.tr.zh['footer.copyright']);
  check(`中文公司名 = ${expName}`, r.tr.zh['footer.company'] === expName);
  check(`中文关于我们含 ${expZh}`, r.tr.zh['about.who.text1'].includes(expZh), r.tr.zh['about.who.text1'].slice(0, 40));
  // 中英混排：拉丁品牌名与汉字之间要有空格，纯汉字品牌名不能有空格
  const zhWho = r.tr.zh['about.who.text1'];
  if (isPH) {
    check('中文语境：拉丁品牌名与汉字间有空格', zhWho.startsWith('Pioneer Horizon '), JSON.stringify(zhWho.slice(0, 22)));
  } else {
    check('中文语境：汉字品牌名后不加空格', zhWho.startsWith('好宝成'), JSON.stringify(zhWho.slice(0, 8)));
  }
  const zhDisc = r.tr.zh['goldpricing.disclaimer'];
  check('中文语境：品牌名后接汉字有空隙', /Horizon\s获取|好宝获取/.test(zhDisc), JSON.stringify(zhDisc.slice(-16)));
  check(`英文关于我们含品牌名`, r.tr.en['about.who.text1'].includes(expName), r.tr.en['about.who.text1'].slice(0, 60));
  check(`金价页眉品牌正确`, r.tr.en['goldpricing.eyebrow'].includes(isPH ? 'Pioneer Horizon' : 'Haobao'),
    r.tr.en['goldpricing.eyebrow']);
  check(`金价产品名不含法定后缀`, !r.tr.en['goldpricing.quotes.title'].includes('Pte. Ltd.'),
    r.tr.en['goldpricing.quotes.title']);
  // 不应泄漏另一个品牌
  const joined = JSON.stringify(r.tr);
  check('不泄漏另一品牌', isPH ? !joined.includes('Haobao') : !joined.includes('Pioneer Horizon'));

  // brand.t 幂等
  check('brand.t 幂等', r.brand.t(r.tr.zh['footer.company']) === expName);
}

console.log(`\n通过 ${pass} / 失败 ${fail}`);
process.exit(fail === 0 ? 0 : 1);
