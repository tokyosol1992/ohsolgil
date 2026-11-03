// 전체 검색 (2026-11-03): 헤더 Search 영역을 누르거나 ⌘K / Ctrl+K → 화면 가운데에 검색창(<dialog>)
// 색인은 index.astro가 페이지 데이터로 만들어 #sk-data(JSON)에 넣어 둠. 한글 초성 검색 지원(ㄷㅋ → 던킨)
type Hit = { g: string; t: string; s?: string; k?: string; h: string };

const ICONS: Record<string, string> = {
  섹션: '<path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16"/>',
  프로젝트: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  경력: '<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v2M3.5 13h17"/>',
  '핵심 역량': '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z"/>',
  문서: '<path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8L14 3.5Z"/><path d="M14 3.5V8h4.5M9 13h6M9 16.5h4"/>',
  연락처: '<circle cx="12" cy="12" r="3.5"/><path d="M15.5 12v1.5a2.5 2.5 0 0 0 5 0V12a8.5 8.5 0 1 0-3.3 6.7"/>',
  링크: '<path d="M7 17 17 7M9 7h8v8"/>',
};

const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '');
const cho = (s: string) =>
  [...s].map((ch) => { const c = ch.charCodeAt(0) - 0xac00; return c >= 0 && c < 11172 ? CHO[Math.floor(c / 588)] : ch; }).join('');

function score(hit: Hit, q: string): number {
  if (!q) return 1;
  const t = norm(hit.t);
  if (t.startsWith(q)) return 5;
  if (t.includes(q)) return 4;
  if (/^[ㄱ-ㅎ]+$/.test(q) && norm(cho(hit.t)).includes(q)) return 3;
  if (norm(`${hit.s ?? ''} ${hit.k ?? ''}`).includes(q)) return 2;
  return 0;
}

// 제목에서 검색어와 같은 부분을 <mark>로 (텍스트 노드로만 만들어 안전)
function titleNode(t: string, raw: string): DocumentFragment {
  const f = document.createDocumentFragment();
  const i = raw ? t.toLowerCase().indexOf(raw.toLowerCase()) : -1;
  if (i < 0) { f.append(t); return f; }
  const m = document.createElement('mark');
  m.textContent = t.slice(i, i + raw.length);
  f.append(t.slice(0, i), m, t.slice(i + raw.length));
  return f;
}

export function initSearch() {
  const dialog = document.querySelector<HTMLDialogElement>('dialog#search');
  const input = dialog?.querySelector<HTMLInputElement>('#sk-input');
  const list = dialog?.querySelector<HTMLElement>('#sk-list');
  const count = dialog?.querySelector<HTMLElement>('.sk-count');
  const data = document.getElementById('sk-data');
  if (!dialog || !input || !list || !data || typeof dialog.showModal !== 'function') return;

  const index: Hit[] = JSON.parse(data.textContent || '[]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let shown: Hit[] = [];
  let active = 0;

  // 단축키 표시: Mac·iOS는 ⌘, 그 외 Ctrl
  const isMac = /Mac|iPhone|iPad/.test((navigator as any).userAgentData?.platform || navigator.platform || navigator.userAgent);
  document.querySelectorAll('[data-sk-mod]').forEach((el) => (el.textContent = isMac ? '⌘' : 'Ctrl'));

  function render() {
    const raw = input!.value.trim();
    const q = norm(raw);
    shown = index
      .map((h, i) => ({ h, i, s: score(h, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.i - b.i)
      .map((x) => x.h);
    // 점수 순서를 지키되 같은 그룹끼리 묶어서 보여 줌 (그룹 순서 = 처음 등장한 순서)
    const groups = [...new Set(shown.map((h) => h.g))];
    shown = groups.flatMap((g) => shown.filter((h) => h.g === g));
    active = 0;
    list!.replaceChildren();

    if (!shown.length) {
      const empty = document.createElement('p');
      empty.className = 'sk-empty';
      empty.textContent = `‘${raw}’에 맞는 결과가 없어요.`;
      list!.append(empty);
    }
    let n = 0;
    for (const g of groups) {
      const box = document.createElement('div');
      box.className = 'sk-group';
      box.setAttribute('role', 'group');
      const label = document.createElement('div');
      label.className = 'sk-gl';
      label.id = `sk-g-${g}`;
      label.textContent = g;
      box.setAttribute('aria-labelledby', label.id);
      box.append(label);
      for (const h of shown.filter((x) => x.g === g)) {
        const i = n++;
        const opt = document.createElement('div');
        opt.className = 'sk-item';
        opt.id = `sk-opt-${i}`;
        opt.setAttribute('role', 'option');
        opt.dataset.i = String(i);
        const ext = !h.h.startsWith('#');
        opt.innerHTML = `<span class="sk-ii"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[h.g] ?? ICONS['섹션']}</svg></span><span class="sk-tx"><span class="sk-t"></span><span class="sk-s"></span></span><span class="sk-go" aria-hidden="true">${ext ? '↗' : '↵'}</span>`;
        opt.querySelector('.sk-t')!.append(titleNode(h.t, raw));
        opt.querySelector('.sk-s')!.textContent = h.s ?? '';
        box.append(opt);
      }
      list!.append(box);
    }
    if (count) count.textContent = raw ? `${shown.length}개 결과` : `${shown.length}개 항목`;
    setActive(0, false);
  }

  function setActive(i: number, scroll = true) {
    const opts = list!.querySelectorAll<HTMLElement>('.sk-item');
    if (!opts.length) return input!.removeAttribute('aria-activedescendant');
    active = (i + opts.length) % opts.length;
    opts.forEach((o, j) => o.setAttribute('aria-selected', String(j === active)));
    input!.setAttribute('aria-activedescendant', opts[active].id);
    if (scroll) opts[active].scrollIntoView({ block: 'nearest' });
  }

  function go(h: Hit | undefined) {
    if (!h) return;
    close();
    if (!h.h.startsWith('#')) { window.location.href = h.h; return; }
    const el = document.querySelector<HTMLElement>(h.h);
    if (!el) return;
    history.pushState(null, '', h.h);
    const isSection = el.tagName === 'SECTION';
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: isSection ? 'start' : 'center', inline: 'start' });
    el.focus({ preventScroll: true }); // 키보드 사용자는 도착한 곳에서 이어서 Tab
    if (!isSection) {
      el.classList.remove('is-hit');
      void el.offsetWidth;
      el.classList.add('is-hit');
      setTimeout(() => el.classList.remove('is-hit'), 1800);
    }
  }

  function open() {
    if (dialog!.open) return;
    document.dispatchEvent(new Event('search:open')); // 모바일 메뉴 닫기
    input!.value = '';
    render();
    dialog!.showModal();
    document.documentElement.classList.add('sk-open');
    input!.focus();
  }
  function close() {
    if (dialog!.open) dialog!.close();
  }
  dialog.addEventListener('close', () => document.documentElement.classList.remove('sk-open'));

  document.querySelectorAll('[data-sk-open]').forEach((b) => b.addEventListener('click', open));
  dialog.querySelector('[data-sk-close]')?.addEventListener('click', close);
  // 패널 바깥(어두운 배경)을 누르면 닫힘
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });

  // ⌘K / Ctrl+K: 한글 입력 상태에서도 되도록 e.code(물리 키)로도 확인
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && (e.code === 'KeyK' || e.key.toLowerCase() === 'k')) {
      e.preventDefault();
      dialog!.open ? close() : open();
    }
  });

  input.addEventListener('input', render);
  input.addEventListener('keydown', (e) => {
    if (e.isComposing) return; // 한글 조합 중 Enter는 무시
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Home' && e.altKey) { e.preventDefault(); setActive(0); }
    else if (e.key === 'Enter') { e.preventDefault(); go(shown[active]); }
  });
  list.addEventListener('mousemove', (e) => {
    const o = (e.target as HTMLElement).closest<HTMLElement>('.sk-item');
    if (o && Number(o.dataset.i) !== active) setActive(Number(o.dataset.i), false);
  });
  list.addEventListener('click', (e) => {
    const o = (e.target as HTMLElement).closest<HTMLElement>('.sk-item');
    if (o) go(shown[Number(o.dataset.i)]);
  });
}
