// 前端品牌 SDK —— 零闪烁的关键
// 用法：放在 <head> 里、translations.js 与 script.js 之前同步加载。
//   <script src="brand.js"></script>
// 提供：
//   window.__BRAND__          当前品牌配置
//   __BRAND__.t(text)         把文案里的 {{brand}} / {{brandZh}} / {{email}} 占位符替换掉
//   window.initBrandEmail()   把所有 data-brand-email 元素填成品牌邮箱
//   window.initBrandLogo()    把所有 data-brand-logo 元素（light/dark）换成品牌 logo
(function () {
  'use strict';

  // 本地/预览环境按域名兜底（线上由 functions/_middleware.js 注入，不依赖这个表）
  var HOSTS = {
    'haobao.com.sg': 0,
    'pioneerhorizon.com.sg': 1,
  };
  var FALLBACK = [
    {
      slug: 'haobao',
      name: 'Haobao Pte. Ltd.',
      shortName: 'Haobao',
      nameZh: '好宝',
      logoLight: '/logo_bai.png',
      logoDark: '/logo_hei.png',
      email: 'salesdpt@haobaoco.com',
    },
    {
      slug: 'pioneerhorizon',
      name: 'Pioneer Horizon Pte. Ltd.',
      shortName: 'Pioneer Horizon',
      nameZh: 'Pioneer Horizon',
      logoLight: '/img/brand/pioneerhorizon-logo-light.png',
      logoDark: '/img/brand/pioneerhorizon-logo-dark.png',
      email: 'salesdpt@pioneerhorizon.com.sg',
    },
  ];

  function detect() {
    // 1) 线上：中间件注入（最准确）
    if (window.__BRAND__ && window.__BRAND__.name) return window.__BRAND__;
    // 2) 本地 / 预览：按 hostname 兜底
    var h = (location.hostname || '').toLowerCase().replace(/^www\./, '');
    var i = Object.prototype.hasOwnProperty.call(HOSTS, h) ? HOSTS[h] : 1;
    return FALLBACK[i];
  }

  var brand = detect();
  brand.t = function (text) {
    if (typeof text !== 'string') return text;
    // 中文语境：品牌名若是拉丁字母（Pioneer Horizon），与汉字之间需要空格；
    // 若本身就是汉字（好宝）则不能加空格。
    var zhHasCjk = /[\u4e00-\u9fff]/.test(brand.nameZh);
    var zhGap = zhHasCjk ? brand.nameZh : brand.nameZh + ' ';
    var zhGapLead = zhHasCjk ? brand.nameZh : ' ' + brand.nameZh;
    return text
      .replace(/\{\{\s*brandZhGapLead\s*\}\}/g, zhGapLead)
      .replace(/\{\{\s*brandZhGap\s*\}\}/g, zhGap)
      .replace(/\{\{\s*brandZh\s*\}\}/g, brand.nameZh)
      .replace(/\{\{\s*brandShort\s*\}\}/g, brand.shortName)
      .replace(/\{\{\s*brand\s*\}\}/g, brand.name)
      .replace(/\{\{\s*email\s*\}\}/g, brand.email);
  };
  window.__BRAND__ = brand;

  // 品牌作用域：CSS 用 [data-brand="..."] 按品牌调 logo 尺寸等
  document.documentElement.setAttribute('data-brand', brand.slug);

  // 把 translations.js 里的 {{brand}} / {{brandZh}} 一次性替换掉。
  // 放在这一层做，script.js 里任何直接读 translations[...] 的地方都会自动带上当前品牌，
  // 不必逐个调用点去处理（data-i18n 路径和直接取值路径都能覆盖）。
  // brand.js 在 <head> 与 translations.js 之前加载，所以此时 translations 还不存在；
  // DOMContentLoaded 时再兜底一次。若将来改成 defer/module，这里的顺序保证会失效。
  function localizeTranslations() {
    if (typeof translations === 'undefined' || !translations) return false;
    Object.keys(translations).forEach(function (lang) {
      var dict = translations[lang];
      if (!dict || typeof dict !== 'object') return;
      Object.keys(dict).forEach(function (key) {
        if (typeof dict[key] === 'string' && dict[key].indexOf('{{') !== -1) {
          dict[key] = brand.t(dict[key]);
        }
      });
    });
    return true;
  }
  if (!localizeTranslations()) {
    document.addEventListener('DOMContentLoaded', localizeTranslations);
  }

  window.initBrandEmail = function () {
    var nodes = document.querySelectorAll('[data-brand-email]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.tagName === 'A') {
        el.textContent = brand.email;
        el.setAttribute('href', 'mailto:' + brand.email);
      } else {
        el.textContent = brand.email;
      }
    }
  };

  window.initBrandLogo = function () {
    var nodes = document.querySelectorAll('[data-brand-logo]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var variant = el.getAttribute('data-brand-logo');
      var src = variant === 'light' ? brand.logoLight : brand.logoDark;
      // 已经正确就不动，避免无谓的重绘/闪烁
      if (el.getAttribute('src') !== src) el.setAttribute('src', src);
      el.setAttribute('alt', brand.name + ' logo');
    }
  };
})();
