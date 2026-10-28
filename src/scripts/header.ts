// 맨 위에서는 투명·전체 폭, 스크롤하면 `.is-scrolled`로 좁아지며 반투명 (스타일은 global.css)
export function initHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  update();
  window.addEventListener('scroll', update, { passive: true });
}
