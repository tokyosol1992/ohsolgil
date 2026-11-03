/**
 * 스크롤 진입 인터랙션 (2026-11-03, 형제 사이트 MoHo의 enter-effects.ts·reveal.ts를 옮겨 옴)
 * - 블러 텍스트: `[data-blur]` 섹션 머리말(.sh)의 제목이 단어 단위로 흐림이 걷히며 올라오고, 부제는 뒤따라 떠오름
 * - 떠오름: `[data-reveal]` 블록이 화면에 들어올 때 아래에서 24px 떠오름 (MoHo는 GSAP, 여기선 CSS 전환으로 같은 값)
 * - 스크롤 단어 점등: `[data-scroll-words]` 문단의 단어가 스크롤한 만큼 하나씩 밝아짐 (소개 문단이 생기면 붙여 쓰기)
 * - 카운트업: `[data-countup]` 숫자가 올라가 멈춤. HTML엔 최종 숫자가 있어 스크립트가 없어도 보임
 * 모든 효과는 스크립트가 붙인 클래스로만 숨기므로 JS가 없거나 모션 줄이기면 처음부터 완성된 상태
 */
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 텍스트를 단어 span으로 쪼갬 (공백은 그대로 둬서 줄바꿈이 자연스럽게). 화면 낭독기는 aria-label로 원문을 읽음 */
function splitWords(el: HTMLElement, cls: string) {
  const text = el.textContent ?? '';
  el.setAttribute('aria-label', text.trim());
  el.textContent = '';
  text.split(/\s+/).filter(Boolean).forEach((w, i, all) => {
    const s = document.createElement('span');
    s.className = cls;
    s.setAttribute('aria-hidden', 'true');
    s.style.setProperty('--i', String(i));
    s.textContent = w;
    el.appendChild(s);
    if (i < all.length - 1) el.appendChild(document.createTextNode(' '));
  });
}

function onceVisible(el: Element, run: () => void, threshold = 0.3, rootMargin = '0px') {
  if (!('IntersectionObserver' in window)) return run();
  const io = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) { io.disconnect(); run(); }
  }, { threshold, rootMargin });
  io.observe(el);
}

function initBlur() {
  for (const head of document.querySelectorAll<HTMLElement>('[data-blur]')) {
    const title = head.querySelector<HTMLElement>('h2, h1');
    if (title) splitWords(title, 'bw');
    head.classList.add('is-split');
    onceVisible(head, () => head.classList.add('on'));
  }
}

function initReveal() {
  for (const el of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
    el.classList.add('rv');
    // MoHo(GSAP ScrollTrigger 'top 85%')와 같은 시점: 블록 윗부분이 화면 아래 15% 선을 넘을 때
    onceVisible(el, () => el.classList.add('in'), 0, '0px 0px -15% 0px');
  }
}

function initScrollWords() {
  const paras = [...document.querySelectorAll<HTMLElement>('[data-scroll-words]')];
  if (!paras.length) return;
  paras.forEach((p) => splitWords(p, 'sw'));
  const update = () => {
    for (const p of paras) {
      const words = p.querySelectorAll<HTMLElement>('.sw');
      const r = p.getBoundingClientRect();
      // 문단이 화면 아래 90% 지점에 들어올 때 시작해서 위쪽 35% 근처에 오면 전부 밝아짐
      const k = Math.min(1, Math.max(0, (innerHeight * 0.9 - r.top) / (innerHeight * 0.55)));
      const n = Math.round(k * words.length);
      words.forEach((w, i) => w.classList.toggle('lit', i < n));
    }
  };
  update();
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
}

function initCount() {
  for (const el of document.querySelectorAll<HTMLElement>('[data-countup]')) {
    const to = Number(el.dataset.countup);
    const from = Number(el.dataset.from ?? 0);
    const pad = el.textContent?.length ?? 0; // 01 같은 자릿수 유지
    const show = (v: number) => { el.textContent = String(Math.round(v)).padStart(pad, '0'); };
    show(from);
    onceVisible(el, () => {
      const start = performance.now();
      const frame = (now: number) => {
        const k = Math.min(1, (now - start) / 1500);
        show(from + (to - from) * (1 - Math.pow(1 - k, 4)));
        if (k < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }, 0.6);
  }
}

export function initEnter() {
  if (reduced()) return;
  initBlur();
  initReveal();
  initScrollWords();
  initCount();
}
