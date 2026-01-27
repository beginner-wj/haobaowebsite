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
        if (translations[lang] && translations[lang][key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translations[lang][key];
            } else if (element.tagName === 'STRONG' || element.tagName === 'P' || element.tagName === 'LI') {
                // 对于包含HTML标签的内容，使用innerHTML
                element.innerHTML = translations[lang][key];
            } else {
                // 检查翻译文本是否包含HTML标签
                const translation = translations[lang][key];
                if (translation.includes('<strong>') || translation.includes('<')) {
                    element.innerHTML = translation;
                } else {
                    element.textContent = translation;
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
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });
        
        // 点击菜单项后关闭菜单
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            });
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
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
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

// About页面标签切换
function initAboutTabs() {
    const aboutButtons = document.querySelectorAll('.about-btn');
    const contentPanels = document.querySelectorAll('.content-panel');
    
    aboutButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // 移除所有active类
            aboutButtons.forEach(btn => btn.classList.remove('active'));
            contentPanels.forEach(panel => panel.classList.remove('active'));
            
            // 添加active类到当前按钮和对应内容
            button.classList.add('active');
            const targetPanel = document.querySelector(`.content-panel[data-content="${targetTab}"]`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initLanguage();
    initNavbar();
    initNavActive();
    initMobileMenu();
    initSmoothScroll();
    initContactForm();
    animateNumbers();
    initAboutTabs();
    
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

