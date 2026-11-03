// Border Glow — React Bits "BorderGlow"(https://reactbits.dev/components/border-glow)를 React 없이 옮긴 것
// 원본: MIT + Commons Clause, Copyright (c) 2026 David Haz (https://github.com/DavidHDev/react-bits)
// 마우스가 카드 가장자리에 가까울수록, 그 방향 테두리가 파랗게 빛난다. 스타일·색은 src/styles/border-glow.css
// 사용: 카드에 data-glow 속성 + 안에 <span class="edge-light" aria-hidden="true"></span>
function edgeProximity(w: number, h: number, x: number, y: number) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const kx = dx !== 0 ? cx / Math.abs(dx) : Infinity;
  const ky = dy !== 0 ? cy / Math.abs(dy) : Infinity;
  return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
}

function cursorAngle(w: number, h: number, x: number, y: number) {
  const dx = x - w / 2;
  const dy = y - h / 2;
  if (dx === 0 && dy === 0) return 0;
  let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  if (deg < 0) deg += 360;
  return deg;
}

export function initBorderGlow() {
  document.querySelectorAll<HTMLElement>('[data-glow]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      card.style.setProperty('--edge-proximity', (edgeProximity(r.width, r.height, x, y) * 100).toFixed(3));
      card.style.setProperty('--cursor-angle', `${cursorAngle(r.width, r.height, x, y).toFixed(3)}deg`);
    });
  });
}
