



var TxtType = function(el, toRotate, period) {
    this.toRotate = toRotate;
    this.el = el;
    this.loopNum = 0;
    this.period = parseInt(period, 10) || 2000;
    this.txt = '';
    this.tick();
    this.isDeleting = false;
};

TxtType.prototype.tick = function() {
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

function timeAgo(dateString) {
    var diffMs = Date.now() - new Date(dateString).getTime();
    var days = Math.floor(diffMs / 86400000);
    if (days < 1) return 'hoy';
    if (days === 1) return 'hace 1 día';
    if (days < 30) return 'hace ' + days + ' días';
    var months = Math.floor(days / 30);
    if (months < 12) return 'hace ' + months + (months === 1 ? ' mes' : ' meses');
    var years = Math.floor(months / 12);
    return 'hace ' + years + (years === 1 ? ' año' : ' años');
}

function renderGithubRepos(repos) {
    var container = document.getElementById('github-repos');
    if (!container) return;

    if (!repos.length) {
        container.innerHTML = '<p class="github-status">No se encontraron repositorios públicos.</p>';
        return;
    }

    container.innerHTML = repos
        .map(function (repo) {
            var desc = repo.description ? escapeHtml(repo.description) : 'Sin descripción';
            var lang = repo.language ? escapeHtml(repo.language) : null;
            return (
                '<a class="github-repo-card" href="' + repo.html_url + '" target="_blank" rel="noopener">' +
                '<div class="github-repo-name">' + escapeHtml(repo.name) + '</div>' +
                '<div class="github-repo-desc">' + desc + '</div>' +
                '<div class="github-repo-meta">' +
                (lang ? '<span class="github-repo-lang"></span><span>' + lang + '</span><span>·</span>' : '') +
                '<span>Actualizado ' + timeAgo(repo.pushed_at) + '</span>' +
                '</div></a>'
            );
        })
        .join('');
}

function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function loadGithubActivity() {
    var container = document.getElementById('github-repos');
    if (!container) return;

    fetch('https://api.github.com/users/franyer98/repos?sort=pushed&direction=desc&per_page=6')
        .then(function (res) {
            if (!res.ok) throw new Error('GitHub API error ' + res.status);
            return res.json();
        })
        .then(function (repos) {
            var filtered = repos.filter(function (r) { return !r.fork; }).slice(0, 4);
            renderGithubRepos(filtered);
        })
        .catch(function () {
            container.innerHTML =
                '<p class="github-status">No se pudo cargar la actividad en este momento. ' +
                '<a href="https://github.com/franyer98" target="_blank" rel="noopener">Ver perfil en GitHub</a>.</p>';
        });
}

window.onload = function() {
    var elements = document.getElementsByClassName('typewrite');
    for (var i=0; i<elements.length; i++) {
        var toRotate = elements[i].getAttribute('data-type');
        var period = elements[i].getAttribute('data-period');
        if (toRotate) {
          new TxtType(elements[i], JSON.parse(toRotate), period);
        }
    }

    var anio = document.getElementById('anio');
    if (anio) {
      anio.textContent = new Date().getFullYear();
    }

    initScrollReveal();
    initCursorGlow();
    loadGithubActivity();
};





