// 모바일(≤720px) 프로젝트 가로 스크롤의 진행 표시: "03 / 08" + 진행 막대
export function initSwipe() {
  const track = document.querySelector<HTMLElement>('[data-swipe]');
  const now = document.querySelector<HTMLElement>('[data-swipe-now]');
  const bar = document.querySelector<HTMLElement>('[data-swipe-bar]');
  if (!track || !now || !bar) return;
  const total = track.children.length;

  function update() {
    const max = track!.scrollWidth - track!.clientWidth;
    if (max <= 0) return;
    const first = track!.children[0] as HTMLElement;
    const step = first.offsetWidth + parseFloat(getComputedStyle(track!).columnGap || '0');
    const i = track!.scrollLeft >= max - 2 ? total : Math.min(total, Math.round(track!.scrollLeft / step) + 1);
    now!.textContent = String(i).padStart(2, '0');
    bar!.style.transform = `scaleX(${i / total})`;
  }
  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}
