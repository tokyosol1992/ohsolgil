// 마우스 주변에서 닷이 그라데이션으로 밝아지고, 마우스 속도만큼 밀렸다가 스프링처럼 되돌아오는 배경.
// 참고: reactbits.dev DotGrid. 클릭하면 충격파로 닷이 퍼진다.
const SIZE = 3; // 닷 지름(px)
const GAP = 28; // 닷 간격(px)
const PROXIMITY = 170; // 마우스 영향 반경
const PUSH = 0.16; // 마우스 속도 → 밀림 세기
const SHOCK_RADIUS = 260;
const SHOCK_FORCE = 9;
const SPRING = 0.045; // 되돌아오는 힘
const DAMPING = 0.86; // 감쇠(작을수록 오래 출렁임)

type Dot = { x: number; y: number; ox: number; oy: number; vx: number; vy: number };

function rgb(hex: string): [number, number, number] {
  const h = hex.trim().replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function initDotGrid() {
  const host = document.querySelector<HTMLElement>('[data-dots-host]');
  const canvas = host?.querySelector<HTMLCanvasElement>('canvas.dots');
  const ctx = canvas?.getContext('2d');
  if (!host || !canvas || !ctx) return;

  const css = getComputedStyle(document.documentElement);
  const base = rgb(css.getPropertyValue('--dim') || '#62646e');
  const active = rgb(css.getPropertyValue('--accent') || '#2895f7');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let dots: Dot[] = [];
  let w = 0;
  let h = 0;
  let dpr = 1;
  const mouse = { x: -9999, y: -9999, px: -9999, py: -9999, vx: 0, vy: 0 };
  let visible = true;
  let raf = 0;

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = host!.getBoundingClientRect();
    w = r.width;
    h = r.height;
    canvas!.width = Math.round(w * dpr);
    canvas!.height = Math.round(h * dpr);
    const cols = Math.floor(w / GAP) + 1;
    const rows = Math.floor(h / GAP) + 1;
    const x0 = (w - (cols - 1) * GAP) / 2;
    const y0 = (h - (rows - 1) * GAP) / 2;
    dots = [];
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++) dots.push({ x: x0 + i * GAP, y: y0 + j * GAP, ox: 0, oy: 0, vx: 0, vy: 0 });
    draw();
  }

  function draw() {
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, w, h);
    for (const d of dots) {
      const cx = d.x + d.ox;
      const cy = d.y + d.oy;
      const dx = d.x - mouse.x;
      const dy = d.y - mouse.y;
      const t = Math.max(0, 1 - Math.hypot(dx, dy) / PROXIMITY);
      const e = t * t * (3 - 2 * t); // smoothstep
      const r = base[0] + (active[0] - base[0]) * e;
      const g = base[1] + (active[1] - base[1]) * e;
      const b = base[2] + (active[2] - base[2]) * e;
      ctx!.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${0.22 + 0.78 * e})`;
      ctx!.beginPath();
      ctx!.arc(cx, cy, (SIZE / 2) * (1 + 0.5 * e), 0, Math.PI * 2);
      ctx!.fill();
    }
  }

  function step() {
    for (const d of dots) {
      d.vx += -d.ox * SPRING;
      d.vy += -d.oy * SPRING;
      d.vx *= DAMPING;
      d.vy *= DAMPING;
      d.ox += d.vx;
      d.oy += d.vy;
    }
    // 마우스 속도는 프레임마다 서서히 줄임
    mouse.vx *= 0.85;
    mouse.vy *= 0.85;
  }

  function loop() {
    step();
    draw();
    raf = visible ? requestAnimationFrame(loop) : 0;
  }

  function local(e: PointerEvent) {
    const r = host!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  host.addEventListener('pointermove', (e) => {
    const p = local(e);
    if (mouse.px > -9000) {
      mouse.vx = p.x - mouse.px;
      mouse.vy = p.y - mouse.py;
    }
    mouse.x = mouse.px = p.x;
    mouse.y = mouse.py = p.y;
    const speed = Math.hypot(mouse.vx, mouse.vy);
    if (speed < 2) return;
    for (const d of dots) {
      const dist = Math.hypot(d.x - p.x, d.y - p.y);
      if (dist < PROXIMITY) {
        const k = (1 - dist / PROXIMITY) * PUSH;
        d.vx += mouse.vx * k;
        d.vy += mouse.vy * k;
      }
    }
  });
  host.addEventListener('pointerleave', () => {
    mouse.x = mouse.y = mouse.px = mouse.py = -9999;
  });
  host.addEventListener('pointerdown', (e) => {
    const p = local(e);
    for (const d of dots) {
      const dx = d.x - p.x;
      const dy = d.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < SHOCK_RADIUS && dist > 0) {
        const k = (1 - dist / SHOCK_RADIUS) * SHOCK_FORCE;
        d.vx += (dx / dist) * k;
        d.vy += (dy / dist) * k;
      }
    }
  });

  new ResizeObserver(build).observe(host);
  build();
  if (reduce) return; // 모션 줄이기: 정지된 닷만

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(loop);
  }).observe(host);
  raf = requestAnimationFrame(loop);
}
