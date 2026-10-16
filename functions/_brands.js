// 品牌配置 —— 双域名 / 双品牌
// 域名 -> 品牌。唯一事实来源，前端（functions/brand.js）与页面中间件共用。
// 新增品牌只需：① 放 logo 到 img/brand/ ② 在这里加一条 ③ 在 functions/brand.js 里登记
export const DEFAULT_HOST = 'pioneerhorizon.com.sg';

export const BRANDS = {
  // 好宝 / Haobao（现有站）
  'haobao.com.sg': {
    slug: 'haobao',
    name: 'Haobao Pte. Ltd.',
    shortName: 'Haobao',
    nameZh: '好宝',
    logoLight: '/logo_bai.png',
    logoDark: '/logo_hei.png',
    email: 'salesdpt@haobaoco.com',
  },
  // Pioneer Horizon（新站）
  'pioneerhorizon.com.sg': {
    slug: 'pioneerhorizon',
    name: 'Pioneer Horizon Pte. Ltd.',
    shortName: 'Pioneer Horizon',
    nameZh: 'Pioneer Horizon',
    logoLight: '/img/brand/pioneerhorizon-logo-light.png',
    logoDark: '/img/brand/pioneerhorizon-logo-dark.png',
    // TODO: 待客户确认新域名邮箱后替换
    email: 'salesdpt@pioneerhorizon.com.sg',
  },
};

// 去掉端口、统一小写（www. 不是独立品牌，需归一化）
export function hostOf(hostHeader, urlHost) {
  let h = (hostHeader || urlHost || '').toLowerCase();
  const i = h.indexOf(':');
  if (i >= 0) h = h.slice(0, i);
  return h.replace(/^www\./, '');
}

// 未匹配的域名回落到默认品牌
export function brandFor(hostHeader, urlHost) {
  const h = hostOf(hostHeader, urlHost);
  return BRANDS[h] || BRANDS[DEFAULT_HOST];
}

// 前端 SDK 注入内容：只暴露浏览器需要的字段
export function clientBrand(brand) {
  return {
    slug: brand.slug,
    name: brand.name,
    shortName: brand.shortName,
    nameZh: brand.nameZh,
    logoLight: brand.logoLight,
    logoDark: brand.logoDark,
    email: brand.email,
  };
}
