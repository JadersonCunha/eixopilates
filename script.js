(() => {
  'use strict';

  /* ---- Configurações (edite aqui) ---- */
  const WHATSAPP = '5551999990000';
  const BRAND = 'EIXO Pilates & Fisioterapia';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---- Fallback de imagens quebradas ---- */
  $$('img').forEach(img => {
    const fail = () => img.classList.add('img-fail');
    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0) fail();
  });

  /* ---- Entrada do hero ---- */
  const start = () => document.body.classList.add('is-loaded');
  if (document.readyState === 'complete') requestAnimationFrame(start);
  else window.addEventListener('load', () => requestAnimationFrame(start));
  setTimeout(start, 1800);

  /* ---- Ano ---- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---- Text reveal por palavra ---- */
  $$('[data-words]').forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(' '));
            else {
              const w = document.createElement('span');
              w.className = 'wd';
              const s = document.createElement('span');
              s.textContent = part;
              s.style.setProperty('--i', i++);
              w.appendChild(s);
              frag.appendChild(w);
            }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
  });

  /* ---- Scroll reveals + stagger ---- */
  $$('[data-stagger]').forEach(group => {
    [...group.children].forEach((el, i) => el.style.setProperty('--i', i));
  });
  const revealIO = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); obs.unobserve(e.target); }
    });
  }, { threshold: .15, rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal], [data-stagger], [data-words], .img-reveal, .vagas').forEach(el => revealIO.observe(el));

  /* ---- Contadores ---- */
  const countIO = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      obs.unobserve(el);
      const end = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.decimals || 0, 10);
      const pre = el.dataset.prefix || '';
      const suf = el.dataset.suffix || '';
      const fmt = v => pre + v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
      if (reduced) { el.textContent = fmt(end); return; }
      const dur = 1800, t0 = performance.now();
      const tick = t => {
        const p = clamp((t - t0) / dur, 0, 1);
        el.textContent = fmt(end * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: .6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---- Menu mobile ---- */
  const burger = $('#burger');
  const menu = $('#menu');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', !open);
    document.body.classList.toggle('is-locked', open);
    document.body.classList.toggle('menu-open', open);
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 961px)').addEventListener('change', e => e.matches && setMenu(false));

  /* ---- Referências do scroll ---- */
  const header = $('#header');
  const toTop = $('#toTop');
  const toTopBar = $('#toTopBar');
  const progressBar = $('.progress span');
  const sticky = $('#stickyCta');
  const tl = $('#tl');
  const tlSteps = $$('.tl__step');
  const CIRC = 2 * Math.PI * 22;
  let lastY = window.scrollY;
  let ctaBlocked = 0;

  toTopBar.style.strokeDasharray = CIRC;
  toTopBar.style.strokeDashoffset = CIRC;

  toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    toTop.blur();
  });

  /* ---- Parallax ---- */
  const pEls = reduced ? [] : $$('[data-parallax]');
  const parallax = () => {
    const vh = window.innerHeight;
    pEls.forEach(el => {
      const box = el.parentElement.getBoundingClientRect();
      if (box.bottom < -150 || box.top > vh + 150) return;
      const offset = box.top + box.height / 2 - vh / 2;
      el.style.transform = `translate3d(0, ${(offset * -parseFloat(el.dataset.parallax)).toFixed(1)}px, 0)`;
    });
  };

  /* ---- Esconde CTA fixo quando agendar / CTA final estão visíveis ---- */
  const blockIO = new IntersectionObserver(entries => {
    entries.forEach(e => { ctaBlocked += e.isIntersecting ? 1 : -1; });
    ctaBlocked = Math.max(0, ctaBlocked);
    updateScroll();
  }, { threshold: .1 });
  $$('#agendar, .final').forEach(el => blockIO.observe(el));

  function updateScroll() {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    const p = max > 0 ? clamp(y / max, 0, 1) : 0;

    progressBar.style.transform = `scaleX(${p})`;
    toTopBar.style.strokeDashoffset = CIRC * (1 - p);
    toTop.classList.toggle('is-visible', y > 600);

    const stickyOn = y > vh * .8 && ctaBlocked === 0;
    sticky.classList.toggle('is-visible', stickyOn);
    document.body.classList.toggle('sticky-on', stickyOn);

    header.classList.toggle('is-scrolled', y > 40);
    const open = menu.classList.contains('is-open');
    header.classList.toggle('is-hidden', !open && y > lastY && y > 500);
    lastY = y;

    // Linha do tempo do método
    if (tl) {
      const r = tl.getBoundingClientRect();
      const prog = clamp((vh * .78 - r.top) / (r.height + vh * .1), 0, 1);
      tl.style.setProperty('--p', prog.toFixed(3));
      tlSteps.forEach((s, i) => s.classList.toggle('is-on', prog >= i / tlSteps.length - .02));
    }
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { updateScroll(); parallax(); ticking = false; });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateScroll();
  parallax();

  /* ---- Para quem: seletor com indicador deslizante ---- */
  const seg = $('#seg');
  const segTabs = $$('button', seg);
  const thumb = $('.seg__thumb', seg);
  const whoImgs = $$('.who__media img');
  const whoPanels = $$('.who__panel');

  const moveThumb = () => {
    const a = $('.is-active', seg);
    thumb.style.width = a.offsetWidth + 'px';
    thumb.style.transform = `translateX(${a.offsetLeft}px)`;
  };
  const setWho = i => {
    segTabs.forEach((t, k) => {
      const on = k === i;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
    });
    whoImgs.forEach((im, k) => im.classList.toggle('is-on', k === i));
    whoPanels.forEach((pn, k) => {
      pn.classList.toggle('is-on', k === i);
      pn.setAttribute('aria-hidden', k !== i);
    });
    moveThumb();
  };
  segTabs.forEach((t, i) => {
    t.addEventListener('click', () => setWho(i));
    t.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + segTabs.length) % segTabs.length;
      setWho(n);
      segTabs[n].focus();
    });
  });
  moveThumb();
  window.addEventListener('resize', moveThumb);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveThumb);

  /* ---- Serviços: acordeão + preview ---- */
  const svcItems = $$('.svc__item');
  const svcImgs = $$('#svcPreview img');
  const syncSvc = () => {
    svcItems.forEach(it => $('.svc__head', it).setAttribute('aria-expanded', it.classList.contains('is-active')));
    const idx = svcItems.findIndex(it => it.classList.contains('is-active'));
    if (idx > -1) svcImgs.forEach((im, k) => im.classList.toggle('is-on', k === idx));
  };
  const wide = () => window.innerWidth > 960;
  svcItems.forEach(it => {
    const head = $('.svc__head', it);
    head.addEventListener('click', () => {
      const wasOpen = it.classList.contains('is-active');
      if (wide()) {
        svcItems.forEach(x => x.classList.toggle('is-active', x === it));
      } else {
        svcItems.forEach(x => x.classList.remove('is-active'));
        if (!wasOpen) it.classList.add('is-active');
      }
      syncSvc();
    });
    if (finePointer) {
      head.addEventListener('mouseenter', () => {
        if (!wide() || it.classList.contains('is-active')) return;
        svcItems.forEach(x => x.classList.toggle('is-active', x === it));
        syncSvc();
      });
    }
  });

  /* ---- Depoimentos (autoplay com progresso) ---- */
  const pqs = $$('.pq');
  const qbtns = $$('.qbtn');
  let curQ = 0;
  const setQuote = i => {
    curQ = i;
    pqs.forEach((q, k) => q.classList.toggle('is-on', k === i));
    qbtns.forEach((b, k) => {
      b.classList.remove('is-active');
      b.setAttribute('aria-selected', k === i);
    });
    void qbtns[i].offsetWidth; // reinicia a animação de progresso
    qbtns[i].classList.add('is-active');
  };
  qbtns.forEach((b, i) => b.addEventListener('click', () => setQuote(i)));
  if (!reduced) {
    qbtns.forEach((b, i) => b.addEventListener('animationend', () => {
      if (i === curQ) setQuote((curQ + 1) % qbtns.length);
    }));
  }

  /* ---- FAQ ---- */
  $$('.qa').forEach(item => {
    const btn = $('.qa__q', item);
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      $$('.qa').forEach(o => {
        o.classList.remove('is-open');
        $('.qa__q', o).setAttribute('aria-expanded', 'false');
      });
      if (!open) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---- Formulário → WhatsApp ---- */
  const form = $('#leadForm');
  const setError = (input, bad) => input.closest('.field').classList.toggle('has-error', bad);
  $$('input[type="text"], input[type="tel"]', form).forEach(i => i.addEventListener('input', () => setError(i, false)));

  const phone = form.elements.whats;
  phone.addEventListener('input', () => {
    let v = phone.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) v = v.replace(/^(\d{2})(\d{5}|\d{4})(\d{0,4}).*/, '($1) $2-$3');
    else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    phone.value = v;
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const nome = form.elements.nome;
    const whats = form.elements.whats;
    const badName = nome.value.trim().length < 2;
    const badPhone = whats.value.replace(/\D/g, '').length < 10;
    setError(nome, badName);
    setError(whats, badPhone);
    if (badName || badPhone) { (badName ? nome : whats).focus(); return; }

    const periodo = form.querySelector('input[name="periodo"]:checked').value;
    const msg =
`Olá, ${BRAND}! Quero agendar minha avaliação gratuita.

Nome: ${nome.value.trim()}
WhatsApp: ${whats.value}
Principal queixa: ${form.elements.motivo.value}
Melhor período: ${periodo}`;

    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });

  /* ---- Botões magnéticos (apenas desktop) ---- */
  if (finePointer && !reduced) {
    $$('[data-magnetic]').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * .2;
        const y = (e.clientY - r.top - r.height / 2) * .3;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }
})();