// 语言切换功能
let currentLang = localStorage.getItem('language') || 'en';

// 初始化语言
function initLanguage() {
    updateLanguage(currentLang);
}

// 更新页面语言
function updateLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('language', lang);
    
    // 更新所有带有 data-i18n 属性的元素
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const raw = translations[lang] && translations[lang][key];
        // 品牌占位符（{{brand}} / {{brandZh}} / {{email}}）按当前域名替换
        const value = raw && window.__BRAND__ && window.__BRAND__.t
            ? window.__BRAND__.t(raw)
            : raw;
        if (value) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = value;
            } else if (element.tagName === 'STRONG' || element.tagName === 'P' || element.tagName === 'LI') {
                // 对于包含HTML标签的内容，使用innerHTML
                element.innerHTML = value;
            } else {
                // 检查翻译文本是否包含HTML标签
                if (value.includes('<strong>') || value.includes('<')) {
                    element.innerHTML = value;
                } else {
                    element.textContent = value;
                }
            }
        }
    });
    
    
    // 更新HTML lang属性
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    
    // 更新语言切换按钮显示
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        const langIcon = langToggle.querySelector('.lang-icon');
        if (langIcon) {
            langIcon.textContent = lang === 'zh' ? 'EN' : '中';
        }
    }

    // 通知动态渲染组件（如产品卡片）按新语言重绘
    document.dispatchEvent(new CustomEvent('lang:changed', { detail: { lang } }));
}

// 切换语言
function toggleLanguage() {
    const newLang = currentLang === 'zh' ? 'en' : 'zh';
    updateLanguage(newLang);
}

// 导航栏滚动效果
function initNavbar() {
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
}

// 移动端菜单切换
function initMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');
    const backdrop = document.getElementById('navBackdrop');

    const setMenu = (open) => {
        navMenu.classList.toggle('active', open);
        mobileMenuToggle.classList.toggle('active', open);
        mobileMenuToggle.setAttribute('aria-expanded', String(open));
        document.body.classList.toggle('menu-open', open);
        if (backdrop) backdrop.classList.toggle('active', open);
    };

    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            setMenu(!navMenu.classList.contains('active'));
        });

        // 点击遮罩关闭
        if (backdrop) {
            backdrop.addEventListener('click', () => setMenu(false));
        }

        // 点击菜单项后关闭菜单
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => setMenu(false));
        });

        // 旋转/放大到桌面宽度时复位，避免菜单卡在打开状态
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) setMenu(false);
        });
    }
}

// 导航栏active状态管理
function initNavActive() {
    const navLinks = document.querySelectorAll('.nav-menu a');
    const sections = document.querySelectorAll('section[id]');
    
    function updateActiveNav() {
        let current = '';
        const scrollY = window.pageYOffset;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href') || '';
            // 页面链接（如 gold-pricing.html）不参与锚点 active 管理，保留其自身状态
            if (!href.startsWith('#')) return;
            link.classList.remove('active');
            if (href === `#${current}`) {
                link.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', updateActiveNav);
    updateActiveNav();
}

// 平滑滚动
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // 更新active状态
                document.querySelectorAll('.nav-menu a').forEach(link => {
                    link.classList.remove('active');
                });
                this.classList.add('active');
            }
        });
    });
}

// 表单处理（已移除，现在使用直接联系信息）
function initContactForm() {
    // 联系表单已移除，现在显示直接联系信息
}

// 数字动画效果
function animateNumbers() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const finalValue = target.textContent;
                const isPercentage = finalValue.includes('%');
                const hasDollar = finalValue.includes('$');
                const hasK = finalValue.includes('K');
                const hasM = finalValue.includes('M');
                const hasPlus = finalValue.includes('+');
                
                // 提取数字
                const numericValue = parseFloat(finalValue.replace(/[^0-9.]/g, ''));
                
                let current = 0;
                const increment = numericValue / 50;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= numericValue) {
                        target.textContent = finalValue;
                        clearInterval(timer);
                    } else {
                        let displayValue = Math.floor(current);
                        if (hasDollar) displayValue = '$' + displayValue;
                        if (hasM) displayValue = displayValue + 'M';
                        if (hasK) displayValue = displayValue + 'K';
                        if (hasPlus) displayValue = displayValue + '+';
                        if (isPercentage) displayValue = displayValue + '%';
                        target.textContent = displayValue;
                    }
                }, 30);
                
                observer.unobserve(target);
            }
        });
    }, { threshold: 0.5 });
    
    statNumbers.forEach(stat => observer.observe(stat));
}

// FAQ 手风琴（faq.html）：点击问题展开/收起答案
function initFaq() {
    const questions = document.querySelectorAll('.faq-question');
    questions.forEach((q) => {
        q.addEventListener('click', () => {
            const item = q.closest('.faq-item');
            if (!item) return;
            const answer = item.querySelector('.faq-answer');
            if (!answer) return;
            const open = answer.hidden;
            answer.hidden = !open;
            item.classList.toggle('open', open);
            q.setAttribute('aria-expanded', String(open));
        });
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 品牌先落地（logo / 邮箱），再渲染文案，避免两个域名互相闪错品牌
    if (window.initBrandLogo) window.initBrandLogo();
    if (window.initBrandEmail) window.initBrandEmail();
    initLanguage();
    initNavbar();
    initNavActive();
    initMobileMenu();
    initSmoothScroll();
    initContactForm();
    animateNumbers();
    initFaq();
    initMetalPrices();
    initGoldPricingPage();
    initShop();
    
    // 语言切换按钮事件
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.addEventListener('click', toggleLanguage);
    }
});

// 窗口大小改变时调整
window.addEventListener('resize', () => {
    const navMenu = document.getElementById('navMenu');
    if (window.innerWidth > 768 && navMenu) {
        navMenu.classList.remove('active');
    }
});

// 金银报价（可配置 API，默认降级为占位）
// 说明：由于不同数据源对 CORS / key 要求不同，这里做成可替换的 fetcher。
function initMetalPrices() {
    const xauEl = document.getElementById('priceXAUUSD');
    const xagEl = document.getElementById('priceXAGUSD');
    if (!xauEl || !xagEl) return;

    const cacheKey = 'metal_prices_cache';

    const readCache = () => {
        try {
            const cacheRaw = localStorage.getItem(cacheKey);
            if (!cacheRaw) return null;
            const cache = JSON.parse(cacheRaw);
            if (cache && (cache.xauusd || cache.xagusd)) {
                return cache;
            }
            return null;
        } catch (e) {
            return null;
        }
    };

    // 期望返回格式：{ xauusd: number, xagusd: number, timestamp?: string }
    const fetcher = async () => {
        // 简单的“每天一次”缓存，避免超过免费额度
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const cache = readCache();
        if (cache && cache.date === today && (cache.xauusd || cache.xagusd)) {
            return cache;
        }

        const res = await fetch('/prices');
        if (!res.ok) {
            throw new Error('Prices endpoint failed');
        }

        const data = await res.json();

        const result = {
            xauusd: data.xauusd || null,
            xagusd: data.xagusd || null,
            date: today
        };

        try {
            localStorage.setItem(cacheKey, JSON.stringify(result));
        } catch (e) {
            // 忽略本地存储错误
        }

        return result;
    };

    const formatUsd = (v) => {
        const n = Number(v);
        if (!Number.isFinite(n)) return '—';
        return `$${n.toFixed(2)}`;
    };

    const setLoading = () => {
        xauEl.textContent = 'Loading…';
        xagEl.textContent = 'Loading…';
    };

    const setFallback = () => {
        const cache = readCache();
        if (cache) {
            if (cache.xauusd) xauEl.textContent = formatUsd(cache.xauusd);
            if (cache.xagusd) xagEl.textContent = formatUsd(cache.xagusd);
            return;
        }

        // 如果页面上已经有值（例如上一次刷新成功），不要在失败时清空
        const hasDisplayed = (el) => (el.textContent || '').trim() && (el.textContent || '').trim() !== 'Loading…';
        if (hasDisplayed(xauEl) || hasDisplayed(xagEl)) return;

        xauEl.textContent = '—';
        xagEl.textContent = '—';
    };

    const refresh = async () => {
        try {
            setLoading();
            const data = await fetcher();
            if (!data) {
                setFallback();
                return;
            }
            xauEl.textContent = formatUsd(data.xauusd);
            xagEl.textContent = formatUsd(data.xagusd);
        } catch (e) {
            setFallback();
        }
    };

    // 先尝试渲染缓存（即使过期），保证有内容可见
    setFallback();
    refresh();
    // 每 60 秒尝试刷新一次（如果你启用 fetcher）
    setInterval(refresh, 60_000);
}

// ==================== 金价行情页（gold-pricing.html） ====================
// 渲染 Market Reference Prices 表格与 BUY/SELL 自有报价；数据来自 /prices 聚合接口
function initGoldPricingPage() {
    const table = document.getElementById('marketTable');
    if (!table) return; // 非金价行情页

    const CACHE_KEY = 'gold_pricing_cache';

    // 列定义（顺序与用户最新表格一致）；i18n 供手机端市场卡片复用列名
    const COLUMNS = [
        { key: 'xauusd',     unit: 'usd', i18n: 'goldpricing.market.col.xau' },
        { key: 'sge_au9999', unit: 'cny', i18n: 'goldpricing.market.col.au9999' },
        { key: 'sh_am',      unit: 'cny', i18n: 'goldpricing.market.col.sh_am' },
        { key: 'sh_pm',      unit: 'cny', i18n: 'goldpricing.market.col.sh_pm' },
        { key: 'lbma_am',    unit: 'usd', i18n: 'goldpricing.market.col.lbma_am' },
        { key: 'lbma_pm',    unit: 'usd', i18n: 'goldpricing.market.col.lbma_pm' }
    ];

    // 行定义：USD/g、CNY/g、USD/troy oz、CNY/troy oz、SGD/g、SGD/troy oz（所有列均显示）
    // 注：Last Updated 与 Source 已按要求从表格中移除，改为页面底部脚注（gpFootnoteUpdated / gpFootnoteSources）
    const ROWS = [
        { key: 'usd_g', i18n: 'goldpricing.market.row.usd_g', kind: 'num' },
        { key: 'cny_g', i18n: 'goldpricing.market.row.cny_g', kind: 'num' },
        { key: 'usd_oz', i18n: 'goldpricing.market.row.usd_oz', kind: 'num' },
        { key: 'cny_oz', i18n: 'goldpricing.market.row.cny_oz', kind: 'num' },
        { key: 'sgd_g', i18n: 'goldpricing.market.row.sgd_g', kind: 'num' },
        { key: 'sgd_oz', i18n: 'goldpricing.market.row.sgd_oz', kind: 'num' }
    ];

    const readCache = () => {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            const cache = JSON.parse(raw);
            if (cache && cache.updatedAt) return cache;
            return null;
        } catch (e) {
            return null;
        }
    };

    const saveCache = (data) => {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch (e) {
            // 忽略本地存储错误
        }
    };

    const fetchData = async () => {
        const res = await fetch('/prices');
        if (!res.ok) throw new Error('Prices endpoint failed');
        const data = await res.json();
        if (!data || !data.markets) throw new Error('Invalid payload');
        return data;
    };

    // 格式化时间：ISO 字符串 → "YYYY-MM-DD HH:mm SGT"（新加坡时间，与图1 风格一致）
    const formatTime = (iso) => {
        if (!iso) return '—';
        // 已是格式化文本（如新浪 "2026-09-24 15:30:01"）或纯日期（"2026-09-23"）直接返回
        if (/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/.test(iso)) return iso;
        const d = new Date(iso);
        if (isNaN(d.getTime())) return iso;
        const pad = (n) => String(n).padStart(2, '0');
        const sgt = new Date(d.getTime() + 8 * 3600 * 1000); // UTC+8（新加坡）
        return `${sgt.getUTCFullYear()}-${pad(sgt.getUTCMonth() + 1)}-${pad(sgt.getUTCDate())} ${pad(sgt.getUTCHours())}:${pad(sgt.getUTCMinutes())} SGT`;
    };

    // 保留两位小数（与图1 风格一致）
    const fmt2 = (v) => {
        const n = Number(v);
        if (!Number.isFinite(n)) return '—';
        return n.toFixed(2);
    };

    const renderRowLabel = (el, key) => {
        const label = el.querySelector('.gp-row-label');
        if (!label) return;
        label.setAttribute('data-i18n', key); // 让语言切换时也能自动翻译
        if (translations[currentLang] && translations[currentLang][key]) {
            label.textContent = translations[currentLang][key];
        }
    };

    // 手机端（≤768px）：市场参考价改为紧凑列表（市场 | USD/g | CNY/g | 最后更新），
    // 每行可展开看全部换算与来源；桌面/平板仍用表格，两者由同一份数据渲染
    const MARKET_BADGES = {
        xauusd:     ['G', 'gp-mi-teal'],
        sge_au9999: ['S', 'gp-mi-brown'],
        sh_am:      ['S', 'gp-mi-blue'],
        sh_pm:      ['S', 'gp-mi-blue'],
        lbma_am:    ['L', 'gp-mi-purple'],
        lbma_pm:    ['L', 'gp-mi-purple']
    };

    const renderMarketCards = (data) => {
        const root = document.getElementById('marketCards');
        if (!root) return;
        const t = (key) => (translations[currentLang] && translations[currentLang][key]) || key;

        root.innerHTML = '';

        // 表头行（列名带 data-i18n，语言切换自动跟随）
        // 注：Last Updated 已从摘要行移除（放入底部脚注与展开详情）
        const head = document.createElement('div');
        head.className = 'gp-mhead';
        head.innerHTML =
            '<span class="gp-mhead-name" data-i18n="goldpricing.market.col.benchmark"></span>' +
            '<span data-i18n="goldpricing.market.row.usd_g"></span>' +
            '<span data-i18n="goldpricing.market.row.cny_g"></span>' +
            '<span aria-hidden="true"></span>';
        head.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.getAttribute('data-i18n')); });
        root.appendChild(head);

        COLUMNS.forEach((col) => {
            const market = data.markets[col.key] || {};
            const [letter, colorCls] = MARKET_BADGES[col.key] || ['•', 'gp-mi-blue'];
            const item = document.createElement('div');
            item.className = 'gp-mitem';

            // 摘要行：徽标 + 市场名 + USD/g + CNY/g + 箭头
            const row = document.createElement('button');
            row.type = 'button';
            row.className = 'gp-mrow';
            row.setAttribute('aria-expanded', 'false');

            const badge = document.createElement('span');
            badge.className = `gp-mi ${colorCls}`;
            badge.textContent = letter;
            badge.setAttribute('aria-hidden', 'true');

            const name = document.createElement('span');
            name.className = 'gp-mname';
            name.setAttribute('data-i18n', col.i18n);
            name.textContent = t(col.i18n);

            const usd = document.createElement('span');
            usd.className = 'gp-mval';
            usd.textContent = fmt2(market.usd_g);

            const cny = document.createElement('span');
            cny.className = 'gp-mval';
            cny.textContent = fmt2(market.cny_g);

            const chev = document.createElement('span');
            chev.className = 'gp-mchev';
            chev.textContent = '›';
            chev.setAttribute('aria-hidden', 'true');

            row.append(badge, name, usd, cny, chev);

            // 展开区：其余换算 + 来源 + 完整时间
            const detail = document.createElement('div');
            detail.className = 'gp-mdetail';
            detail.hidden = true;
            [
                ['goldpricing.market.row.usd_oz', fmt2(market.usd_oz)],
                ['goldpricing.market.row.cny_oz', fmt2(market.cny_oz)],
                ['goldpricing.market.row.sgd_g', fmt2(market.sgd_g)],
                ['goldpricing.market.row.sgd_oz', fmt2(market.sgd_oz)]
            ].forEach(([key, v]) => {
                const line = document.createElement('div');
                line.className = 'gp-mdetail-line';
                const l = document.createElement('span');
                l.setAttribute('data-i18n', key);
                l.textContent = t(key);
                const b = document.createElement('b');
                b.textContent = v;
                line.append(l, b);
                detail.appendChild(line);
            });

            const srcLine = document.createElement('div');
            srcLine.className = 'gp-mdetail-line';
            const srcLabel = document.createElement('span');
            srcLabel.setAttribute('data-i18n', 'goldpricing.market.row.source');
            srcLabel.textContent = t('goldpricing.market.row.source');
            const srcVal = document.createElement('span');
            const src = data.sources ? data.sources[col.key] : null;
            if (src) {
                const a = document.createElement('a');
                a.href = src;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.textContent = src.replace(/^https?:\/\/(www\.)?/, '');
                a.className = 'gp-mcard-src';
                srcVal.appendChild(a);
            } else {
                srcVal.textContent = '—';
            }
            srcLine.append(srcLabel, srcVal);
            detail.appendChild(srcLine);

            const timeLine = document.createElement('div');
            timeLine.className = 'gp-mdetail-line';
            const timeLabel = document.createElement('span');
            timeLabel.setAttribute('data-i18n', 'goldpricing.market.row.last_updated');
            timeLabel.textContent = t('goldpricing.market.row.last_updated');
            const timeVal = document.createElement('span');
            timeVal.textContent = market.date || formatTime(market.lastUpdated);
            timeLine.append(timeLabel, timeVal);
            detail.appendChild(timeLine);

            item.append(row, detail);
            root.appendChild(item);
        });
    };

    // 行展开/收起：事件委托绑在容器上（render 只替换子节点，容器常驻）
    const bindMarketListEvents = () => {
        const root = document.getElementById('marketCards');
        if (!root || root.dataset.bound) return;
        root.dataset.bound = '1';
        root.addEventListener('click', (e) => {
            const row = e.target.closest('.gp-mrow');
            if (!row) return;
            const item = row.parentElement;
            const detail = item.querySelector('.gp-mdetail');
            if (!detail) return;
            const open = detail.hidden;
            detail.hidden = !open;
            item.classList.toggle('open', open);
            row.setAttribute('aria-expanded', String(open));
        });
    };

    const render = (data) => {
        // ---- BUY / SELL 卡片 ----
        const q = data.quotes || {};
        const setQuote = (id, v, digits) => {
            const el = document.getElementById(id);
            if (!el) return;
            const n = Number(v);
            el.textContent = Number.isFinite(n) ? n.toFixed(digits) : '—';
        };
        setQuote('quoteBuyUsdG', q.buy && q.buy.usd_g, 2);
        setQuote('quoteBuyUsdOz', q.buy && q.buy.usd_oz, 2);
        setQuote('quoteSellUsdG', q.sell && q.sell.usd_g, 2);
        setQuote('quoteSellUsdOz', q.sell && q.sell.usd_oz, 2);
        // 手机端报价卡显示 CNY/g：接口只出 USD，用同一份汇率客户端换算（与市场列服务端口径一致）
        const fxRate = data.fx && Number(data.fx.usd_cny) ? Number(data.fx.usd_cny) : null;
        const setCny = (id, usdG) => {
            const el = document.getElementById(id);
            if (!el) return;
            const n = Number(usdG);
            el.textContent = Number.isFinite(n) && fxRate ? (n * fxRate).toFixed(2) : '—';
        };
        setCny('quoteBuyCnyG', q.buy && q.buy.usd_g);
        setCny('quoteSellCnyG', q.sell && q.sell.usd_g);
        const buyUpdated = document.getElementById('quoteBuyUpdated');
        const sellUpdated = document.getElementById('quoteSellUpdated');
        if (buyUpdated) buyUpdated.textContent = formatTime(q.buy && q.buy.lastUpdated);
        if (sellUpdated) sellUpdated.textContent = formatTime(q.sell && q.sell.lastUpdated);

        // 手机端全局状态条：取 BUY/SELL 中最新一次更新时间
        const statusTime = document.getElementById('gpStatusTime');
        if (statusTime) {
            const times = [q.buy && q.buy.lastUpdated, q.sell && q.sell.lastUpdated].filter(Boolean).sort();
            statusTime.textContent = formatTime(times.pop());
        }

        // ---- 汇率脚注（USDCNY / USDSGD） ----
        const fxNote = document.getElementById('fxNote');
        if (fxNote) {
            const fx = data.fx;
            if (fx && fx.usd_cny) {
                const label = translations[currentLang] && translations[currentLang].goldpricing
                    ? translations[currentLang].goldpricing.fxnote
                    : '** USDCNY = {rate} (last updated {time})';
                const time = formatTime(fx.updatedAt);
                fxNote.textContent = label.replace('{rate}', fx.usd_cny.toFixed(4)).replace('{time}', time);
            } else {
                fxNote.textContent = '** USDCNY = —';
            }
        }
        const fxNoteSgd = document.getElementById('fxNoteSgd');
        if (fxNoteSgd) {
            const fx = data.fx;
            if (fx && fx.usd_sgd) {
                const label = (translations[currentLang] && translations[currentLang].goldpricing && translations[currentLang].goldpricing.fxnote_sgd)
                    || '*** USDSGD = {rate} (last updated {time})';
                const time = formatTime(fx.updatedAt);
                fxNoteSgd.textContent = label.replace('{rate}', fx.usd_sgd.toFixed(4)).replace('{time}', time);
            } else {
                fxNoteSgd.textContent = '*** USDSGD = —';
            }
        }

        // ---- 脚注：各市场数据时间与来源（替代原表格中的 Last Updated / Source 行） ----
        const t9 = (key) => (translations[currentLang] && translations[currentLang][key]) || key;
        const updatedEl = document.getElementById('gpFootnoteUpdated');
        const sourcesEl = document.getElementById('gpFootnoteSources');
        if (updatedEl || sourcesEl) {
            const partsTime = [];
            const partsSrc = [];
            COLUMNS.forEach((col) => {
                const market = data.markets[col.key] || {};
                const name = t9(col.i18n);
                const when = market.date || formatTime(market.lastUpdated);
                if (when && when !== '—') partsTime.push(`${name} ${when}`);
                const src = data.sources ? data.sources[col.key] : null;
                if (src) partsSrc.push(`${name} — ${src.replace(/^https?:\/\/(www\.)?/, '')}`);
            });
            if (updatedEl) {
                updatedEl.textContent = partsTime.length ? `${t9('goldpricing.footnote.updated')} ${partsTime.join(' · ')}` : '';
            }
            if (sourcesEl) {
                sourcesEl.textContent = partsSrc.length ? `${t9('goldpricing.footnote.sources')} ${partsSrc.join(' · ')}` : '';
            }
        }

        // ---- Market Reference Prices 表格 ----
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        ROWS.forEach((row) => {
            const tr = document.createElement('tr');
            const th = document.createElement('th');
            th.scope = 'row';
            const labelSpan = document.createElement('span');
            labelSpan.className = 'gp-row-label';
            th.appendChild(labelSpan);
            tr.appendChild(th);
            renderRowLabel(th, row.i18n);

            COLUMNS.forEach((col) => {
                const td = document.createElement('td');
                const market = data.markets[col.key] || {};
                if (row.kind === 'num' || row.kind === 'num-sgd') {
                    // 所有列均显示对应单位值（USD/CNY/SGD）；某市场缺该值或汇率失败时显示占位
                    const v = market[row.key];
                    td.textContent = fmt2(v);
                    td.classList.add('gp-num');
                    if (v === null || v === undefined) td.classList.add('gp-empty');
                } else if (row.kind === 'time') {
                    td.textContent = market.date || formatTime(market.lastUpdated);
                    if (!td.textContent || td.textContent === '—') td.classList.add('gp-empty');
                } else if (row.kind === 'source') {
                    const src = data.sources ? data.sources[col.key] : null;
                    if (src) {
                        const a = document.createElement('a');
                        a.href = src;
                        a.target = '_blank';
                        a.rel = 'noopener noreferrer';
                        a.textContent = src.replace(/^https?:\/\/(www\.)?/, '');
                        a.className = 'gp-src';
                        td.appendChild(a);
                    } else {
                        td.textContent = '—';
                        td.classList.add('gp-empty');
                    }
                }
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        // 手机端卡片与表格同步渲染
        renderMarketCards(data);
    };

    // ---- Data & Methodology ----
    const renderMethodology = () => {
        const list = document.getElementById('methodologyList');
        if (!list) return;
        const items = [
            { i18n: 'goldpricing.methodology.item.xau', url: 'https://www.goldapi.io' },
            { i18n: 'goldpricing.methodology.item.au9999', url: 'https://en.sge.com.cn/data_DelayedQuotes' },
            { i18n: 'goldpricing.methodology.item.sh', url: 'https://en.sge.com.cn/data_BenchmarkPrice' },
            { i18n: 'goldpricing.methodology.item.lbma', url: 'https://www.lbma.org.uk/prices-and-data/lbma-precious-metal-prices' },
            { i18n: 'goldpricing.methodology.item.fx', url: 'https://open.er-api.com' },
            { i18n: 'goldpricing.methodology.item.convert', url: null }
        ];
        list.innerHTML = '';
        items.forEach((item) => {
            const li = document.createElement('li');
            const text = translations[currentLang] && translations[currentLang][item.i18n]
                ? translations[currentLang][item.i18n]
                : item.i18n;
            if (item.url) {
                const a = document.createElement('a');
                a.href = item.url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.textContent = text;
                li.appendChild(a);
            } else {
                li.textContent = text;
            }
            list.appendChild(li);
        });
    };

    const methodologyToggle = document.getElementById('methodologyToggle');
    if (methodologyToggle) {
        methodologyToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const box = document.getElementById('methodologyBox');
            if (box) box.hidden = !box.hidden;
        });
    }

    // 手机端"查看详情"：一键展开/收起全部市场的完整换算
    const detailsToggle = document.getElementById('marketDetailsToggle');
    if (detailsToggle) {
        detailsToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const root = document.getElementById('marketCards');
            if (!root) return;
            const expand = !root.classList.contains('all-open');
            root.classList.toggle('all-open', expand);
            root.querySelectorAll('.gp-mitem').forEach((item) => {
                const detail = item.querySelector('.gp-mdetail');
                const row = item.querySelector('.gp-mrow');
                if (detail) detail.hidden = !expand;
                item.classList.toggle('open', expand);
                if (row) row.setAttribute('aria-expanded', String(expand));
            });
            const key = expand ? 'goldpricing.market.hide' : 'goldpricing.market.details';
            detailsToggle.setAttribute('data-i18n', key);
            const v = translations[currentLang] && translations[currentLang][key];
            if (v) detailsToggle.textContent = v;
        });
    }
    bindMarketListEvents();

    const refresh = async () => {
        try {
            const data = await fetchData();
            saveCache(data);
            render(data);
        } catch (e) {
            const cache = readCache();
            if (cache) render(cache);
        }
    };

    // 首屏先用缓存兜底，再拉取
    const cache = readCache();
    if (cache) render(cache);
    renderMethodology();
    refresh();
    setInterval(refresh, 60_000);
}


// ==================== 产品商店（buy-gold-silver.html） ====================
// 产品数据在 products.js（window.SHOP_PRODUCTS），价格按 /prices 实时现货价 + 汇率换算：
//   价格(S$) = USD/oz × (重量g ÷ 31.1034768) × USD/SGD × (1 + premiumPct%)
function initShop() {
    const grid = document.getElementById('shopGrid');
    if (!grid || typeof SHOP_PRODUCTS === 'undefined' || !Array.isArray(SHOP_PRODUCTS)) return;

    const OZT = 31.1034768;
    const CACHE_KEY = 'shop_prices_cache';
    const t = (key) => (translations[currentLang] && translations[currentLang][key]) || key;

    const state = {
        search: '',
        metal: new Set(),
        type: new Set(),
        brand: '',
        wMin: null,
        wMax: null,
        unit: 'g', // g | oz
        sort: 'featured',
        view: 'grid',
        prices: null // { xau: USD/oz, xag: USD/oz|null, sgd: USD/SGD }
    };

    // ---- 工具 ----
    const fmtMoney = (v, dec) => {
        const n = Number(v);
        if (!Number.isFinite(n)) return '—';
        return 'S$' + n.toLocaleString('en-SG', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    };
    const totalDec = (v) => (Number(v) >= 1000 ? 0 : 2);

    const usdOzFor = (metal) => {
        if (!state.prices) return null;
        if (metal === 'gold') return state.prices.xau;
        if (metal === 'silver') return state.prices.xag;
        return null;
    };

    // 产品价格（SGD），含特价折扣；无法计算时返回 null
    const priceOf = (p) => {
        const oz = usdOzFor(p.metal);
        if (!state.prices || oz === null || oz === undefined) return null;
        const base = oz * (p.weightG / OZT) * state.prices.sgd * (1 + (p.premiumPct || 0) / 100);
        if (p.badge === 'sale' && p.discountPct) {
            return { now: base * (1 - p.discountPct / 100), was: base };
        }
        return { now: base, was: null };
    };

    const weightInUnit = (g, unit) => (unit === 'oz' ? g / OZT : g);

    // ---- 筛选与排序 ----
    const filtered = () => {
        const q = state.search.trim().toLowerCase();
        let list = SHOP_PRODUCTS.filter((p) => {
            if (q) {
                const hay = `${p.name} ${p.brand} ${p.metal} ${p.type}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            if (state.metal.size && !state.metal.has(p.metal)) return false;
            if (state.type.size && !state.type.has(p.type)) return false;
            if (state.brand && p.brand !== state.brand) return false;
            const w = weightInUnit(p.weightG, state.unit);
            if (state.wMin !== null && w < state.wMin) return false;
            if (state.wMax !== null && w > state.wMax) return false;
            return true;
        });

        const badgeRank = (p) => (p.badge === 'featured' ? 0 : p.badge === 'bestseller' ? 1 : p.badge === 'sale' ? 2 : 3);
        const price = (p) => { const r = priceOf(p); return r ? r.now : Infinity; };

        switch (state.sort) {
            case 'priceAsc': list.sort((a, b) => price(a) - price(b)); break;
            case 'priceDesc': list.sort((a, b) => price(b) - price(a)); break;
            case 'weightAsc': list.sort((a, b) => a.weightG - b.weightG); break;
            case 'weightDesc': list.sort((a, b) => b.weightG - a.weightG); break;
            case 'name': list.sort((a, b) => a.name.localeCompare(b.name)); break;
            default: list.sort((a, b) => badgeRank(a) - badgeRank(b)); break; // featured
        }
        return list;
    };

    // ---- 渲染 ----
    const badgeHtml = (p) => {
        if (!p.badge) return '';
        const cls = { featured: 'badge-featured', bestseller: 'badge-bestseller', sale: 'badge-sale' }[p.badge] || '';
        const label = t(`shop.badge.${p.badge}`);
        return `<span class="product-badge ${cls}">${label}</span>`;
    };

    const cardHtml = (p) => {
        const r = priceOf(p);
        const oz = p.weightG / OZT;
        const ozTxt = oz >= 1 ? oz.toFixed(2) : oz.toFixed(3);
        const weightLine = `${p.weightG} g · ${ozTxt} oz`;
        const meta = `${t(`metal.${p.metal}`)} · ${p.brand}`;
        let priceLine;
        if (r) {
            priceLine = r.was !== null
                ? `<span class="product-card-price"><s>${fmtMoney(r.was, totalDec(r.was))}</s> ${fmtMoney(r.now, totalDec(r.now))}</span>`
                : `<span class="product-card-price">${fmtMoney(r.now, totalDec(r.now))}</span>`;
        } else {
            priceLine = '<span class="product-card-price">—</span>';
        }
        return `
            <article class="product-card${p.badge === 'sale' ? ' is-sale' : ''}">
                <div class="product-card-media">
                    <img src="${p.image}" alt="${p.name}" loading="lazy">
                    ${badgeHtml(p)}
                </div>
                <div class="product-card-body">
                    <span class="product-card-meta">${meta}</span>
                    <h3 class="product-card-name">${p.name}</h3>
                    <div class="product-card-weight">${weightLine}</div>
                    <div class="product-card-pricing">
                        ${priceLine}
                        <span class="product-card-unit">${r ? fmtMoney(r.now / p.weightG, 2) + '/g' : ''}</span>
                    </div>
                    <div class="product-card-premium">${t('shop.premium')} ${(p.premiumPct || 0).toFixed(2)}%</div>
                </div>
            </article>`;
    };

    const render = () => {
        const list = filtered();
        grid.innerHTML = list.map(cardHtml).join('');
        grid.dataset.view = state.view;
        const count = document.getElementById('shopCount');
        if (count) count.textContent = t('shop.results').replace('{count}', String(list.length));
        const empty = document.getElementById('shopEmpty');
        if (empty) empty.hidden = list.length > 0;
    };

    const renderSpot = () => {
        const ok = document.getElementById('shopSpot');
        const err = document.getElementById('shopSpotError');
        const vals = document.getElementById('shopSpotValues');
        if (!ok || !err) return;
        if (state.prices) {
            const parts = [];
            if (state.prices.xau) parts.push(`${t('shop.liveSpot.gold')} ${fmtMoney(state.prices.xau * state.prices.sgd, 2)}${t('shop.perOz')}`);
            if (state.prices.xag) parts.push(`${t('shop.liveSpot.silver')} ${fmtMoney(state.prices.xag * state.prices.sgd, 2)}${t('shop.perOz')}`);
            if (vals) vals.textContent = ' — ' + parts.join(' · ');
            ok.hidden = false;
            err.hidden = true;
        } else {
            ok.hidden = true;
            err.hidden = false;
        }
    };

    // ---- 现货价获取（带每日缓存兜底） ----
    const readCache = () => {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            const c = raw ? JSON.parse(raw) : null;
            return c && c.prices ? c : null;
        } catch (e) { return null; }
    };

    const refreshPrices = async () => {
        try {
            const res = await fetch('/prices');
            if (!res.ok) throw new Error('prices failed');
            const data = await res.json();
            if (!data || !data.fx || !data.fx.usd_sgd || !data.xauusd) throw new Error('invalid payload');
            state.prices = {
                xau: Number(data.xauusd),
                xag: data.xagusd ? Number(data.xagusd) : null,
                sgd: Number(data.fx.usd_sgd)
            };
            try { localStorage.setItem(CACHE_KEY, JSON.stringify({ prices: state.prices, at: Date.now() })); } catch (e) {}
        } catch (e) {
            const cache = readCache();
            if (cache) state.prices = cache.prices;
        }
        renderSpot();
        render();
    };

    // ---- 品牌下拉选项 ----
    const initBrandSelect = () => {
        const sel = document.getElementById('shopBrand');
        if (!sel) return;
        const brands = [...new Set(SHOP_PRODUCTS.map((p) => p.brand))].sort((a, b) => a.localeCompare(b));
        brands.forEach((b) => {
            const o = document.createElement('option');
            o.value = b;
            o.textContent = b;
            sel.appendChild(o);
        });
    };

    // ---- 事件绑定 ----
    const bind = () => {
        const search = document.getElementById('shopSearch');
        if (search) search.addEventListener('input', () => { state.search = search.value; render(); });

        document.querySelectorAll('.chip-group[data-filter]').forEach((group) => {
            const key = group.getAttribute('data-filter');
            group.querySelectorAll('.chip').forEach((chip) => {
                chip.addEventListener('click', () => {
                    const v = chip.getAttribute('data-value');
                    const set = key === 'metal' ? state.metal : state.type;
                    if (set.has(v)) { set.delete(v); chip.classList.remove('active'); }
                    else { set.add(v); chip.classList.add('active'); }
                    render();
                });
            });
        });

        const brandSel = document.getElementById('shopBrand');
        if (brandSel) brandSel.addEventListener('change', () => { state.brand = brandSel.value; render(); });

        const wMin = document.getElementById('weightMin');
        const wMax = document.getElementById('weightMax');
        const applyWeight = () => {
            const parse = (v) => (v === '' || v === null || !Number.isFinite(Number(v)) ? null : Number(v));
            state.wMin = parse(wMin && wMin.value);
            state.wMax = parse(wMax && wMax.value);
            render();
        };
        if (wMin) wMin.addEventListener('input', applyWeight);
        if (wMax) wMax.addEventListener('input', applyWeight);

        document.querySelectorAll('#weightUnit [data-unit]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const unit = btn.getAttribute('data-unit');
                if (unit === state.unit) return;
                // 切换单位时把已输入的区间值换算过去，保持筛选结果不变
                const conv = (v) => (v === null ? null : (unit === 'oz' ? v / OZT : v * OZT));
                state.wMin = conv(state.wMin);
                state.wMax = conv(state.wMax);
                state.unit = unit;
                if (wMin) wMin.value = state.wMin === null ? '' : String(Number(state.wMin.toFixed(3)));
                if (wMax) wMax.value = state.wMax === null ? '' : String(Number(state.wMax.toFixed(3)));
                document.querySelectorAll('#weightUnit [data-unit]').forEach((b2) => b2.classList.toggle('active', b2.getAttribute('data-unit') === unit));
                render();
            });
        });

        const sort = document.getElementById('shopSort');
        if (sort) sort.addEventListener('change', () => { state.sort = sort.value; render(); });

        const viewGrid = document.getElementById('viewGrid');
        const viewList = document.getElementById('viewList');
        if (viewGrid && viewList) {
            const setView = (v) => {
                state.view = v;
                viewGrid.classList.toggle('active', v === 'grid');
                viewList.classList.toggle('active', v === 'list');
                render();
            };
            viewGrid.addEventListener('click', () => setView('grid'));
            viewList.addEventListener('click', () => setView('list'));
        }

        const clear = document.getElementById('shopClear');
        if (clear) {
            clear.addEventListener('click', () => {
                state.search = ''; state.metal.clear(); state.type.clear();
                state.brand = ''; state.wMin = null; state.wMax = null;
                if (search) search.value = '';
                if (brandSel) brandSel.value = '';
                if (wMin) wMin.value = '';
                if (wMax) wMax.value = '';
                document.querySelectorAll('.chip.active').forEach((c) => c.classList.remove('active'));
                render();
            });
        }

        // 移动端筛选面板开合
        const filters = document.getElementById('shopFilters');
        if (filters) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'shop-filters-toggle';
            btn.setAttribute('data-i18n', 'shop.showFilters');
            btn.textContent = t('shop.showFilters');
            filters.parentNode.insertBefore(btn, filters);
            btn.addEventListener('click', () => {
                const open = filters.classList.toggle('open');
                const key = open ? 'shop.hideFilters' : 'shop.showFilters';
                btn.setAttribute('data-i18n', key);
                btn.textContent = t(key);
            });
        }

        // 语言切换后重绘（产品卡片与计数文案为动态渲染）
        document.addEventListener('lang:changed', () => { renderSpot(); render(); });
    };

    initBrandSelect();
    bind();
    // 先用缓存兜底渲染，再拉取实时价
    const cache = readCache();
    if (cache) state.prices = cache.prices;
    renderSpot();
    render();
    refreshPrices();
    setInterval(refreshPrices, 60_000);
}
