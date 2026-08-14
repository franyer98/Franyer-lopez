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
        'nav.home': 'Inicio', 'nav.about': 'Sobre mí', 'nav.experience': 'Experiencia', 'nav.skills': 'Habilidades', 'nav.projects': 'Proyectos', 'nav.contact': 'Contacto',
        'hero.eyebrow': 'Ingeniero de Confiabilidad · Oil &amp; Gas + IA aplicada',
        'hero.desc': 'Ingeniero de Confiabilidad en Campo Rubiales (Ecopetrol) que construye software real: dashboards, automatización e Inteligencia Artificial aplicados a mi propia operación de campo.',
        'hero.btnProjects': 'Ver proyectos', 'hero.btnContact': 'Contactar',
        'about.title': 'SOBRE MÍ',
        'about.p1': 'Soy Franyer López, Ingeniero de Confiabilidad en el sector oil & gas (Campo Rubiales, Ecopetrol) con formación en Ingeniería de Sistemas e <strong>Inteligencia Artificial</strong>. Combino experiencia real de campo — inspecciones ambientales, cumplimiento normativo — con desarrollo de software: construyo pipelines de datos, dashboards y LLMs integrados en producción que resuelven problemas reales de mi propia operación.',
        'about.p2': 'Autodidacta y resolutivo, trabajo con prácticas de ingeniería moderna: control de versiones con Git, CI/CD con GitHub Actions, testing automatizado y despliegue en la nube. Mi filosofía: arquitecturas simples, código mantenible y soluciones que atacan el problema de raíz.',
        'about.chip1': 'Ingeniería de campo + IA aplicada', 'about.chip2': 'Stack principal: Python', 'about.chip3': 'Aprendizaje continuo',
        'experience.title': 'EXPERIENCIA',
        'experience.role': 'Ingeniero de Confiabilidad',
        'experience.dates': 'Sep. 2022 – Actualidad',
        'experience.company': 'Mecánicos Asociados (contratista Ecopetrol) · Campo Rubiales, CPF-1 y CPF-2',
        'experience.item1': 'Ejecuto inspecciones de detección de emisiones fugitivas con cámara termográfica OGI (FLIR) en +200 clusters y las áreas de CPF-1 y CPF-2, con generación de reportes ambientales diarios.',
        'experience.item2': 'Identifico y hago seguimiento a fugas de gas, contribuyendo directamente a la reducción de emisiones de las facilidades.',
        'experience.item3': 'Diseñé y desarrollé un dashboard interactivo de seguimiento de inspecciones por cluster, digitalizando un proceso que antes dependía de registro manual en campo.',
        'experience.item4': 'Construí un sistema de reporte de emisiones con visualización 3D y KPIs, integrado al formato oficial GOP-F-006 de Ecopetrol, mejorando la trazabilidad de los datos de campo.',
        'skills.title': 'HABILIDADES',
        'skills.group1': 'Inteligencia Artificial & Datos', 'skills.group2': 'Automatización & Backend',
        'skills.group3': 'Herramientas & Infraestructura', 'skills.group4': 'Desarrollo Web',
        'skills.tag.dataAnalysis': 'Análisis de datos', 'skills.tag.processAutomation': 'Automatización de procesos',
        'skills.tag.cloudFundamentals': 'Fundamentos de Cloud',
        'projects.title': 'PROYECTOS', 'projects.featuredBadge': 'Proyecto destacado',
        'projects.p1desc': 'Sistema de generación automática de reportes: extrae respuestas de un Google Form, procesa los datos con pandas y publica un dashboard en vivo, además de reportes en Excel y PDF — 100% automatizado con GitHub Actions, sin intervención manual.',
        'projects.p6desc': 'Dashboard interactivo para inspecciones de emisiones fugitivas (OGI) en Campo Rubiales, CPF-1 y CPF-2: simulador 3D de tanques, KPIs de cobertura, semáforo de severidad y datos alineados con el formato oficial de reporte GEI de Ecopetrol — construido desde mi propio trabajo de campo como Ingeniero de Confiabilidad.',
        'projects.p7desc': 'Sistema full stack para supervisión de troncales y subtroncales de crudo: PWA offline con registro de ruta por GPS y reproducción animada, app Android nativa con GPS en segundo plano, backend FastAPI + PostgreSQL con autenticación JWT multiusuario (roles supervisor/inspector) y exportación GPX — desplegado en Render y GitHub Pages, con build automático de la APK vía GitHub Actions.',
        'projects.p2desc': 'Pipeline autónomo de extracción de datos de facturas y recibos (imagen o PDF): Claude analiza el documento, un módulo de validación combina reglas de negocio con la confianza del modelo, y el sistema decide por sí solo si auto-aprobar o marcar para revisión — con auditoría completa y rollback, sin humano en el loop.',
        'projects.p3desc': 'Gestor de proyectos Kanban full stack: tableros con drag & drop, prioridades y fechas límite, autenticación JWT con refresh tokens y PWA instalable en Android — desplegado en Vercel, Render y Neon con tests automatizados en GitHub Actions.',
        'projects.p5desc': 'Bot de WhatsApp que automatiza los reportes diarios de cuadrillas de campo: recibe texto y fotos, corrige la ortografía y extrae actividades, cantidades y lugares con IA, aplica reglas de horario y genera el Excel diario con fotos y resumen — reemplaza horas de transcripción manual.',
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
        'nav.home': 'Home', 'nav.about': 'About', 'nav.experience': 'Experience', 'nav.skills': 'Skills', 'nav.projects': 'Projects', 'nav.contact': 'Contact',
        'hero.eyebrow': 'Reliability Engineer · Oil &amp; Gas + Applied AI',
        'hero.desc': 'Reliability Engineer at Campo Rubiales (Ecopetrol) who builds real software: dashboards, automation, and Artificial Intelligence applied to my own field operation.',
        'hero.btnProjects': 'View projects', 'hero.btnContact': 'Contact me',
        'about.title': 'ABOUT ME',
        'about.p1': 'I\'m Franyer López, a Reliability Engineer in the oil & gas sector (Campo Rubiales, Ecopetrol) with a background in Systems Engineering and <strong>Artificial Intelligence</strong>. I combine real field experience — environmental inspections, regulatory compliance — with software development: I build data pipelines, dashboards, and production-grade LLM integrations that solve real problems in my own operation.',
        'about.p2': 'Self-taught and results-driven, I work with modern engineering practices: version control with Git, CI/CD with GitHub Actions, automated testing and cloud deployment. My philosophy: simple architectures, maintainable code, and solutions that tackle the root of the problem.',
        'about.chip1': 'Field engineering + applied AI', 'about.chip2': 'Main stack: Python', 'about.chip3': 'Continuous learning',
        'experience.title': 'EXPERIENCE',
        'experience.role': 'Reliability Engineer',
        'experience.dates': 'Sep. 2022 – Present',
        'experience.company': 'Mecánicos Asociados (Ecopetrol contractor) · Campo Rubiales, CPF-1 and CPF-2',
        'experience.item1': 'I run fugitive emissions detection inspections with an OGI thermographic camera (FLIR) across 200+ clusters and the CPF-1 and CPF-2 areas, producing daily environmental compliance reports.',
        'experience.item2': 'I identify and track gas leaks, directly contributing to reducing emissions from the facilities.',
        'experience.item3': 'I designed and built an interactive dashboard for tracking per-cluster OGI inspections, digitizing a process that previously relied on manual field logging.',
        'experience.item4': 'I built an emissions reporting system with 3D visualization and KPIs, integrated with Ecopetrol\'s official GOP-F-006 format, improving field data traceability.',
        'skills.title': 'SKILLS',
        'skills.group1': 'AI & Data', 'skills.group2': 'Automation & Backend',
        'skills.group3': 'Tools & Infrastructure', 'skills.group4': 'Web Development',
        'skills.tag.dataAnalysis': 'Data analysis', 'skills.tag.processAutomation': 'Process automation',
        'skills.tag.cloudFundamentals': 'Cloud fundamentals',
        'projects.title': 'PROJECTS', 'projects.featuredBadge': 'Featured project',
        'projects.p1desc': 'Automated report generation system: pulls responses from a Google Form, processes the data with pandas, and publishes a live dashboard, plus Excel and PDF reports — 100% automated with GitHub Actions, no manual steps.',
        'projects.p6desc': 'Interactive dashboard for fugitive emissions (OGI) inspections at Campo Rubiales, CPF-1 and CPF-2: 3D tank simulator, coverage KPIs, severity semaphore, and data aligned with Ecopetrol\'s official GHG reporting format — built from my own fieldwork as a Reliability Engineer.',
        'projects.p7desc': 'Full-stack system for crude oil pipeline supervision: an offline PWA with GPS route logging and animated playback, a native Android app with background GPS, a FastAPI + PostgreSQL backend with multi-user JWT auth (supervisor/inspector roles), and GPX export — deployed on Render and GitHub Pages, with automated APK builds via GitHub Actions.',
        'projects.p2desc': 'Autonomous invoice/receipt data-extraction pipeline (image or PDF): Claude analyzes the document, a validation layer cross-checks business rules against the model\'s own confidence, and the system decides on its own whether to auto-approve or flag it for review — full audit trail and rollback, no human in the loop.',
        'projects.p3desc': 'Full-stack Kanban project manager: drag & drop boards, priorities and due dates, JWT auth with refresh tokens, and an installable Android PWA — deployed on Vercel, Render and Neon with automated tests on GitHub Actions.',
        'projects.p5desc': 'WhatsApp bot that automates daily field-crew reports: receives text and photos, fixes spelling and extracts activities, quantities and locations with AI, enforces deadline rules and generates the daily Excel with photos and a summary — replacing hours of manual transcription.',
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
