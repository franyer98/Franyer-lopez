var TxtType = function(el, toRotate, period) {
    this.toRotate = toRotate;
    this.el = el;
    this.loopNum = 0;
    this.period = parseInt(period, 10) || 2000;
    this.txt = '';
    this.active = true;
    this.tick();
    this.isDeleting = false;
};

TxtType.prototype.stop = function() {
    this.active = false;
};

TxtType.prototype.tick = function() {
    if (!this.active) return;

    var i = this.loopNum % this.toRotate.length;
    var fullTxt = this.toRotate[i];

    if (this.isDeleting) {
    this.txt = fullTxt.substring(0, this.txt.length - 1);
    } else {
    this.txt = fullTxt.substring(0, this.txt.length + 1);
    }

    this.el.innerHTML = '<span class="wrap">'+this.txt+'</span>';

    var that = this;
    var delta = 200 - Math.random() * 100;

    if (this.isDeleting) { delta /= 2; }

    if (!this.isDeleting && this.txt === fullTxt) {
    delta = this.period;
    this.isDeleting = true;
    } else if (this.isDeleting && this.txt === '') {
    this.isDeleting = false;
    this.loopNum++;
    delta = 500;
    }

    setTimeout(function() {
    that.tick();
    }, delta);
};

var activeTypers = [];

function initTypewriters(lang) {
    activeTypers.forEach(function (t) { t.stop(); });
    activeTypers = [];

    var elements = document.getElementsByClassName('typewrite');
    for (var i = 0; i < elements.length; i++) {
        var toRotate = elements[i].getAttribute('data-type-' + lang) || elements[i].getAttribute('data-type-es');
        var period = elements[i].getAttribute('data-period');
        if (toRotate) {
            activeTypers.push(new TxtType(elements[i], JSON.parse(toRotate), period));
        }
    }
}

/* ===== tema claro/oscuro ===== */
function initThemeToggle() {
    var toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme');
        var next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) {}
    });
}

/* ===== scroll reveal ===== */
function initScrollReveal() {
    var targets = document.querySelectorAll('.reveal');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
        targets.forEach(function (el) { el.classList.add('is-visible'); });
        return;
    }

    var observer = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach(function (el) { observer.observe(el); });
}

/* ===== glow con el cursor ===== */
function initCursorGlow() {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    document.querySelectorAll('.btn, .card').forEach(function (el) {
        el.addEventListener('mousemove', function (e) {
            var rect = el.getBoundingClientRect();
            el.style.setProperty('--glow-x', (e.clientX - rect.left) + 'px');
            el.style.setProperty('--glow-y', (e.clientY - rect.top) + 'px');
        });
    });
}

/* ===== actividad en GitHub ===== */
var TIME_AGO_STRINGS = {
    es: { today: 'hoy', oneDay: 'hace 1 día', days: function (n) { return 'hace ' + n + ' días'; }, oneMonth: 'hace 1 mes', months: function (n) { return 'hace ' + n + ' meses'; }, oneYear: 'hace 1 año', years: function (n) { return 'hace ' + n + ' años'; }, updated: 'Actualizado' },
    en: { today: 'today', oneDay: '1 day ago', days: function (n) { return n + ' days ago'; }, oneMonth: '1 month ago', months: function (n) { return n + ' months ago'; }, oneYear: '1 year ago', years: function (n) { return n + ' years ago'; }, updated: 'Updated' }
};

function timeAgo(dateString, lang) {
    var t = TIME_AGO_STRINGS[lang] || TIME_AGO_STRINGS.es;
    var diffMs = Date.now() - new Date(dateString).getTime();
    var days = Math.floor(diffMs / 86400000);
    if (days < 1) return t.today;
    if (days === 1) return t.oneDay;
    if (days < 30) return t.days(days);
    var months = Math.floor(days / 30);
    if (months < 12) return months === 1 ? t.oneMonth : t.months(months);
    var years = Math.floor(months / 12);
    return years === 1 ? t.oneYear : t.years(years);
}

function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

var lastGithubRepos = null;
var githubLoadFailed = false;

function renderGithubRepos(repos, lang) {
    var container = document.getElementById('github-repos');
    if (!container) return;

    var t = TIME_AGO_STRINGS[lang] || TIME_AGO_STRINGS.es;
    var noDescText = lang === 'en' ? 'No description' : 'Sin descripción';

    if (!repos.length) {
        container.innerHTML = '<p class="github-status" data-i18n="github.empty">' +
            (lang === 'en' ? 'No public repositories found.' : 'No se encontraron repositorios públicos.') + '</p>';
        return;
    }

    container.innerHTML = repos
        .map(function (repo) {
            var desc = repo.description ? escapeHtml(repo.description) : noDescText;
            var lng = repo.language ? escapeHtml(repo.language) : null;
            return (
                '<a class="github-repo-card" href="' + repo.html_url + '" target="_blank" rel="noopener">' +
                '<div class="github-repo-name">' + escapeHtml(repo.name) + '</div>' +
                '<div class="github-repo-desc">' + desc + '</div>' +
                '<div class="github-repo-meta">' +
                (lng ? '<span class="github-repo-lang"></span><span>' + lng + '</span><span>·</span>' : '') +
                '<span>' + t.updated + ' ' + timeAgo(repo.pushed_at, lang) + '</span>' +
                '</div></a>'
            );
        })
        .join('');
}

function renderGithubError(lang) {
    var container = document.getElementById('github-repos');
    if (!container) return;
    var msg = lang === 'en'
        ? 'Couldn\'t load activity right now. <a href="https://github.com/franyer98" target="_blank" rel="noopener">View GitHub profile</a>.'
        : 'No se pudo cargar la actividad en este momento. <a href="https://github.com/franyer98" target="_blank" rel="noopener">Ver perfil en GitHub</a>.';
    container.innerHTML = '<p class="github-status">' + msg + '</p>';
}

function loadGithubActivity(lang) {
    var container = document.getElementById('github-repos');
    if (!container) return;

    fetch('https://api.github.com/users/franyer98/repos?sort=pushed&direction=desc&per_page=6')
        .then(function (res) {
            if (!res.ok) throw new Error('GitHub API error ' + res.status);
            return res.json();
        })
        .then(function (repos) {
            lastGithubRepos = repos.filter(function (r) { return !r.fork; }).slice(0, 4);
            renderGithubRepos(lastGithubRepos, lang);
        })
        .catch(function () {
            githubLoadFailed = true;
            renderGithubError(lang);
        });
}

/* ===== idioma ES/EN ===== */
var TRANSLATIONS = {
    es: {
        'nav.home': 'Inicio', 'nav.about': 'Sobre mí', 'nav.skills': 'Habilidades', 'nav.projects': 'Proyectos', 'nav.contact': 'Contacto',
        'hero.eyebrow': 'Ingeniero de Sistemas · Especialista en Inteligencia Artificial',
        'hero.desc': 'Combino ingeniería de sistemas e inteligencia artificial para construir soluciones que automatizan procesos, analizan datos y generan valor real.',
        'hero.btnProjects': 'Ver proyectos', 'hero.btnContact': 'Contactar',
        'about.title': 'SOBRE MÍ',
        'about.p1': 'Soy Franyer López, Ingeniero de Sistemas enfocado en <strong>Inteligencia Artificial</strong> y automatización de procesos. Me apasiona explorar cómo el aprendizaje automático y el análisis de datos pueden resolver problemas reales, y disfruto llevar cada proyecto desde la idea hasta un sistema funcionando de punta a punta.',
        'about.p2': 'Soy autodidacta, resolutivo y estoy en constante aprendizaje de nuevas tecnologías — creo en escribir soluciones simples, mantenibles y que realmente resuelvan el problema.',
        'about.chip1': 'Enfoque: IA & automatización de datos', 'about.chip2': 'Stack principal: Python', 'about.chip3': 'Aprendizaje continuo',
        'skills.title': 'HABILIDADES',
        'skills.group1': 'Inteligencia Artificial & Datos', 'skills.group2': 'Automatización & Backend',
        'skills.group3': 'Herramientas & Infraestructura', 'skills.group4': 'Desarrollo Web',
        'skills.tag.dataAnalysis': 'Análisis de datos', 'skills.tag.processAutomation': 'Automatización de procesos',
        'skills.tag.cloudFundamentals': 'Fundamentos de Cloud',
        'projects.title': 'PROYECTOS', 'projects.featuredBadge': 'Proyecto destacado',
        'projects.p1desc': 'Sistema de generación automática de reportes: extrae respuestas de un Google Form, procesa los datos con pandas y publica un dashboard en vivo, además de reportes en Excel y PDF — 100% automatizado con GitHub Actions, sin intervención manual.',
        'projects.p2desc': 'Pipeline autónomo de extracción de datos de facturas y recibos (imagen o PDF): Claude analiza el documento, un módulo de validación combina reglas de negocio con la confianza del modelo, y el sistema decide por sí solo si auto-aprobar o marcar para revisión — con auditoría completa y rollback, sin humano en el loop.',
        'projects.viewCode': 'Ver código', 'projects.liveDemo': 'Ver demo en vivo',
        'projects.inProgressBadge': 'En construcción', 'projects.nextTitle': 'Próximo proyecto',
        'projects.nextDesc': 'Estoy trabajando en un nuevo proyecto de Machine Learning. Vuelve pronto para verlo.',
        'github.title': 'ACTIVIDAD EN GITHUB',
        'github.subtitle': 'Repositorios actualizados recientemente — datos en vivo desde mi perfil.',
        'github.loading': 'Cargando actividad de GitHub…',
        'contact.title': 'CONTACTO', 'contact.namePlaceholder': 'Nombre', 'contact.emailPlaceholder': 'Correo',
        'contact.phonePlaceholder': 'Teléfono', 'contact.messagePlaceholder': 'Mensaje', 'contact.submit': 'ENVIAR'
    },
    en: {
        'nav.home': 'Home', 'nav.about': 'About', 'nav.skills': 'Skills', 'nav.projects': 'Projects', 'nav.contact': 'Contact',
        'hero.eyebrow': 'Systems Engineer · AI Specialist',
        'hero.desc': 'I combine systems engineering and artificial intelligence to build solutions that automate processes, analyze data, and create real value.',
        'hero.btnProjects': 'View projects', 'hero.btnContact': 'Contact me',
        'about.title': 'ABOUT ME',
        'about.p1': 'I\'m Franyer López, a Systems Engineer focused on <strong>Artificial Intelligence</strong> and process automation. I\'m passionate about exploring how machine learning and data analysis can solve real problems, and I enjoy taking every project from idea to a fully working system.',
        'about.p2': 'I\'m self-taught, results-driven, and constantly learning new technologies — I believe in writing solutions that are simple, maintainable, and that actually solve the problem.',
        'about.chip1': 'Focus: AI & data automation', 'about.chip2': 'Main stack: Python', 'about.chip3': 'Continuous learning',
        'skills.title': 'SKILLS',
        'skills.group1': 'AI & Data', 'skills.group2': 'Automation & Backend',
        'skills.group3': 'Tools & Infrastructure', 'skills.group4': 'Web Development',
        'skills.tag.dataAnalysis': 'Data analysis', 'skills.tag.processAutomation': 'Process automation',
        'skills.tag.cloudFundamentals': 'Cloud fundamentals',
        'projects.title': 'PROJECTS', 'projects.featuredBadge': 'Featured project',
        'projects.p1desc': 'Automated report generation system: pulls responses from a Google Form, processes the data with pandas, and publishes a live dashboard, plus Excel and PDF reports — 100% automated with GitHub Actions, no manual steps.',
        'projects.p2desc': 'Autonomous invoice/receipt data-extraction pipeline (image or PDF): Claude analyzes the document, a validation layer cross-checks business rules against the model\'s own confidence, and the system decides on its own whether to auto-approve or flag it for review — full audit trail and rollback, no human in the loop.',
        'projects.viewCode': 'View code', 'projects.liveDemo': 'Live demo',
        'projects.inProgressBadge': 'In progress', 'projects.nextTitle': 'Next project',
        'projects.nextDesc': 'I\'m working on a new Machine Learning project. Check back soon.',
        'github.title': 'GITHUB ACTIVITY',
        'github.subtitle': 'Recently updated repositories — live data from my profile.',
        'github.loading': 'Loading GitHub activity…',
        'contact.title': 'CONTACT', 'contact.namePlaceholder': 'Name', 'contact.emailPlaceholder': 'Email',
        'contact.phonePlaceholder': 'Phone', 'contact.messagePlaceholder': 'Message', 'contact.submit': 'SEND'
    }
};

function getStoredLang() {
    try { return localStorage.getItem('lang'); } catch (e) { return null; }
}

function applyLanguage(lang) {
    var dict = TRANSLATIONS[lang] || TRANSLATIONS.es;

    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
        var key = el.getAttribute('data-i18n');
        if (dict[key] !== undefined) el.textContent = dict[key];
    });

    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
        var key = el.getAttribute('data-i18n-html');
        if (dict[key] !== undefined) el.innerHTML = dict[key];
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
        var key = el.getAttribute('data-i18n-placeholder');
        if (dict[key] !== undefined) el.placeholder = dict[key];
    });

    document.querySelectorAll('[data-i18n-value]').forEach(function (el) {
        var key = el.getAttribute('data-i18n-value');
        if (dict[key] !== undefined) el.value = dict[key];
    });

    var githubSub = document.querySelector('.github-sub');
    var githubStatus = document.querySelector('#github-repos .github-status');
    if (githubStatus && !lastGithubRepos) {
        githubStatus.textContent = githubLoadFailed ? '' : dict['github.loading'];
        if (githubLoadFailed) renderGithubError(lang);
    } else if (lastGithubRepos) {
        renderGithubRepos(lastGithubRepos, lang);
    }

    var langLabel = document.getElementById('lang-toggle-label');
    if (langLabel) langLabel.textContent = lang === 'es' ? 'EN' : 'ES';

    var toggleBtn = document.getElementById('lang-toggle');
    if (toggleBtn) toggleBtn.setAttribute('aria-label', lang === 'es' ? 'Switch to English' : 'Cambiar a español');

    initTypewriters(lang);

    try { localStorage.setItem('lang', lang); } catch (e) {}
}

function initLanguageToggle() {
    var toggle = document.getElementById('lang-toggle');
    if (!toggle) return;

    var current = getStoredLang() || 'es';
    applyLanguage(current);

    toggle.addEventListener('click', function () {
        var now = document.documentElement.lang === 'en' ? 'es' : 'en';
        applyLanguage(now);
    });
}

document.addEventListener('DOMContentLoaded', function () {
    var anio = document.getElementById('anio');
    if (anio) {
        anio.textContent = new Date().getFullYear();
    }

    initThemeToggle();
    initScrollReveal();
    initCursorGlow();
    initLanguageToggle();
    loadGithubActivity(document.documentElement.lang || 'es');
});
