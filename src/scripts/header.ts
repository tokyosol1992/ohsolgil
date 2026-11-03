// 헤더: ① 스크롤하면 `.is-scrolled`(좁아지며 유리 질감) ② 보고 있는 섹션을 메뉴에 표시(슬라이딩 하이라이트) ③ 모바일 메뉴
export function initHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const links = [...header.querySelectorAll<HTMLAnchorElement>('nav a[data-spy]')];
  const allLinks = [...header.querySelectorAll<HTMLAnchorElement>('[data-spy]')];
  const ind = header.querySelector<HTMLElement>('.nav-ind');
  const btn = header.querySelector<HTMLButtonElement>('.menu-btn');
  const menu = header.querySelector<HTMLElement>('#menu');
  const sections = allLinks
    .map((a) => a.dataset.spy!)
    .filter((id, i, arr) => arr.indexOf(id) === i)
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => !!el);

  let active = '';

  function moveIndicator() {
    const cur = links.find((a) => a.dataset.spy === active);
    if (!ind) return;
    if (!cur || getComputedStyle(cur).display === 'none') return ind.classList.remove('on');
    ind.style.width = `${cur.offsetWidth}px`;
    ind.style.transform = `translateX(${cur.offsetLeft}px)`;
    ind.classList.add('on');
  }

  function update() {
    header!.classList.toggle('is-scrolled', window.scrollY > 24);
    // 화면 위쪽 1/3 선을 지난 마지막 섹션이 현재 섹션. 페이지 맨 아래면 마지막 섹션
    const line = window.innerHeight * 0.34;
    let id = '';
    for (const s of sections) if (s.getBoundingClientRect().top <= line) id = s.id;
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) id = sections[sections.length - 1]?.id ?? id;
    if (id !== active) {
      active = id;
      for (const a of allLinks) a.classList.toggle('is-active', a.dataset.spy === id);
      moveIndicator();
    }
  }

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', () => {
    moveIndicator();
    if (window.innerWidth > 720) setMenu(false);
  });
  // 헤더 폭이 줄어드는 동안 메뉴 위치도 바뀌므로 전환 끝난 뒤 다시 맞춤
  header.querySelector('.bar')?.addEventListener('transitionend', moveIndicator);

  // 모바일 메뉴 포커스: 열면 첫 항목으로, Esc·바깥 클릭으로 닫으면 햄버거 버튼으로 돌아옴
  function setMenu(open: boolean, focus: 'menu' | 'button' | false = false) {
    if (!btn || !menu) return;
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
    if (open && focus === 'menu') menu.querySelector<HTMLElement>('a')?.focus();
    if (!open && focus === 'button') btn.focus();
  }
  const isOpen = () => btn?.getAttribute('aria-expanded') === 'true';
  btn?.addEventListener('click', () => setMenu(!isOpen(), isOpen() ? false : 'menu'));
  // 메뉴 항목을 누르면 그 섹션으로 이동 (포커스는 브라우저가 섹션으로 옮김)
  menu?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) setMenu(false, menu?.contains(document.activeElement) ? 'button' : false);
  });
  // 메뉴 안에서 Tab으로 마지막 항목을 지나 밖으로 나가면 닫기
  menu?.addEventListener('focusout', (e) => {
    const next = e.relatedTarget as Node | null;
    if (next && !header.contains(next)) setMenu(false);
  });
  document.addEventListener('click', (e) => {
    if (!header.contains(e.target as Node)) setMenu(false);
  });
  document.addEventListener('search:open', () => setMenu(false));
  document.addEventListener('click', (e) => {
    if (!header.contains(e.target as Node)) setMenu(false);
  });
}
