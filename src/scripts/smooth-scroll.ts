// 부드러운 스크롤 (2026-11-03, MoHo와 같은 Lenis). 모션 줄이기면 끄고 브라우저 기본 스크롤
// - 같은 페이지 앵커(#about 등, 로고·메뉴·버튼·본문 바로가기)는 Lenis로 이동하고 그 섹션으로 포커스를 옮김
// - 섹션의 scroll-margin-top(헤더 높이)은 Lenis가 알아서 반영함
// - 검색창이 열려 있는 동안은 멈춤. 검색창 안 스크롤은 data-lenis-prevent로 Lenis가 건드리지 않음
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

let lenis: Lenis | null = null;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 가로 스크롤 목록(모바일 프로젝트) 안의 카드면 목록도 그 카드가 처음에 오도록 옮김 */
function scrollTrack(el: HTMLElement) {
  const track = el.parentElement;
  if (!track || track.scrollWidth <= track.clientWidth + 1) return;
  const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
  const left = track.scrollLeft + el.getBoundingClientRect().left - track.getBoundingClientRect().left - pad;
  track.scrollTo({ left, behavior: reduced() ? 'auto' : 'smooth' });
}

/** 요소로 스크롤. block 'center'는 카드처럼 작은 대상을 화면 가운데에 둘 때 */
export function scrollToEl(el: HTMLElement, block: 'start' | 'center' = 'start') {
  scrollTrack(el);
  if (!lenis) {
    el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block });
    return;
  }
  let offset = 0;
  if (block === 'center') {
    // Lenis는 scroll-margin-top을 빼므로 다시 더해 정확히 가운데로
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    offset = margin - Math.max(0, (innerHeight - el.getBoundingClientRect().height) / 2);
  }
  lenis.start(); // 검색창을 닫자마자 이동할 때 아직 멈춤 상태일 수 있음
  lenis.scrollTo(el, { offset });
}

export function initSmoothScroll() {
  if (reduced()) return;
  lenis = new Lenis({ autoRaf: true });

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    const el = a?.hash ? document.getElementById(a.hash.slice(1)) : null;
    if (!a || !el) return;
    e.preventDefault();
    scrollToEl(el);
    if (location.hash !== a.hash) history.pushState(null, '', a.hash);
    el.focus({ preventScroll: true }); // 키보드 사용자는 도착한 곳에서 이어서 Tab
  });

  // 검색창이 열리면 멈추고 닫히면 다시 (search.ts가 열 때 search:open을 보냄)
  document.addEventListener('search:open', () => lenis?.stop());
  document.getElementById('search')?.addEventListener('close', () => lenis?.start());
}
