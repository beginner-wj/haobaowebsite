// ============================================================
// 产品目录 —— Buy Gold & Silver 页面使用
// ------------------------------------------------------------
// 说明：
//  - 增删产品 / 改价格参数只需编辑这个文件，前端自动重新渲染
//  - 价格不是写死的：页面按 /prices 接口的实时现货价计算：
//      价格(S$) = USD/盎司现货 × (重量克数 ÷ 31.1034768) × USD/SGD 汇率 × (1 + premiumPct%)
//  - premiumPct：溢价百分比（金价上加价），按产品自行调整
//  - discountPct：特价折扣百分比（仅 badge 为 "sale" 时生效，页面显示划线原价）
//  - badge：null | "featured" | "bestseller" | "sale"
//  - image：产品图路径；当前为占位图，替换成正式产品图后自动生效
// ============================================================
window.SHOP_PRODUCTS = [
    // ---------- 黄金 金条 ----------
    { id: 'au-1g-argor',    name: '1g Argor-Heraeus Gold Minted Bar',     metal: 'gold',   type: 'bar',  brand: 'Argor-Heraeus',      weightG: 1,        premiumPct: 28,   badge: null,         image: 'img/products/placeholder-gold.jpg' },
    { id: 'au-2.5g-pamp',   name: '2.5g PAMP Suisse Lady Fortuna Bar',    metal: 'gold',   type: 'bar',  brand: 'PAMP Suisse',        weightG: 2.5,      premiumPct: 18,   badge: 'featured',   image: 'img/products/placeholder-gold.jpg' },
    { id: 'au-5g-pamp',     name: '5g PAMP Suisse Lady Fortuna Bar',      metal: 'gold',   type: 'bar',  brand: 'PAMP Suisse',        weightG: 5,        premiumPct: 12,   badge: 'bestseller', image: 'img/products/placeholder-gold.jpg' },
    { id: 'au-10g-pamp',    name: '10g PAMP Suisse Lady Fortuna Bar',     metal: 'gold',   type: 'bar',  brand: 'PAMP Suisse',        weightG: 10,       premiumPct: 8.5,  badge: 'bestseller', image: 'img/products/placeholder-gold.jpg' },
    { id: 'au-20g-argor',   name: '20g Argor-Heraeus Gold Cast Bar',      metal: 'gold',   type: 'bar',  brand: 'Argor-Heraeus',      weightG: 20,       premiumPct: 6,    badge: null,         image: 'img/products/placeholder-gold.jpg' },
    { id: 'au-50g-metalor', name: '50g Metalor Gold Cast Bar',            metal: 'gold',   type: 'bar',  brand: 'Metalor',            weightG: 50,       premiumPct: 4.5,  badge: null,         image: 'img/products/placeholder-gold.jpg' },
    { id: 'au-100g-metalor',name: '100g Metalor Gold Cast Bar',           metal: 'gold',   type: 'bar',  brand: 'Metalor',            weightG: 100,      premiumPct: 3.2,  badge: null,         image: 'img/products/placeholder-gold.jpg' },
    { id: 'au-250g-pamp',   name: '250g PAMP Suisse Gold Cast Bar',       metal: 'gold',   type: 'bar',  brand: 'PAMP Suisse',        weightG: 250,      premiumPct: 2.8,  badge: null,         image: 'img/products/placeholder-gold.jpg' },
    { id: 'au-500g-metalor',name: '500g Metalor Gold Cast Bar',           metal: 'gold',   type: 'bar',  brand: 'Metalor',            weightG: 500,      premiumPct: 2.4,  badge: null,         image: 'img/products/placeholder-gold.jpg' },
    { id: 'au-1kg-metalor', name: '1kg Metalor Gold Cast Bar',            metal: 'gold',   type: 'bar',  brand: 'Metalor',            weightG: 1000,     premiumPct: 2,    badge: 'featured',   image: 'img/products/placeholder-gold.jpg' },
    // ---------- 黄金 钱币 ----------
    { id: 'au-1oz-maple',   name: '1oz Canadian Maple Leaf Gold Coin',    metal: 'gold',   type: 'coin', brand: 'Royal Canadian Mint',weightG: 31.1035,  premiumPct: 6.5,  badge: 'featured',   image: 'img/products/placeholder-gold.jpg' },
    { id: 'au-1oz-britannia',name: '1oz Gold Britannia Coin',             metal: 'gold',   type: 'coin', brand: 'Royal Mint',         weightG: 31.1035,  premiumPct: 6.8,  badge: null,         image: 'img/products/placeholder-gold.jpg' },
    // ---------- 白银 金条/钱币 ----------
    { id: 'ag-100g-metalor',name: '100g Metalor Silver Cast Bar',         metal: 'silver', type: 'bar',  brand: 'Metalor',            weightG: 100,      premiumPct: 15,   badge: 'sale', discountPct: 5, image: 'img/products/placeholder-silver.jpg' },
    { id: 'ag-1kg-metalor', name: '1kg Metalor Silver Cast Bar',          metal: 'silver', type: 'bar',  brand: 'Metalor',            weightG: 1000,     premiumPct: 12,   badge: null,         image: 'img/products/placeholder-silver.jpg' },
    { id: 'ag-5oz-bar',     name: '5oz Silver Minted Bar',                metal: 'silver', type: 'bar',  brand: 'PAMP Suisse',        weightG: 155.52,   premiumPct: 18,   badge: null,         image: 'img/products/placeholder-silver.jpg' },
    { id: 'ag-1oz-maple',   name: '1oz Canadian Maple Leaf Silver Coin',  metal: 'silver', type: 'coin', brand: 'Royal Canadian Mint',weightG: 31.1035,  premiumPct: 22,   badge: 'bestseller', image: 'img/products/placeholder-silver.jpg' }
];
