// Sketch → Figma 정리 플러그인
// 흐름: UI에서 범위·작업 선택 → 'scan'(탐색, 아무것도 안 바꿈) → 'apply'(적용) → 리포트
figma.showUI(__html__, { width: 400, height: 700, themeColors: false });

// 탐색 때 "대신 쓸 폰트"의 기본 추천값으로만 쓰임 (적용은 사용자가 고른 것만)
const DEFAULT_FONT_MAP = {
  NotoSansCJKkr: 'Pretendard Variable',
  'Noto Sans CJK KR': 'Pretendard Variable',
  AppleSDGothicNeo: 'Pretendard Variable',
  SpoqaHanSans: 'Pretendard Variable',
  Pretendard: 'Pretendard Variable',
  PretendardVariable: 'Pretendard Variable',
  NanumBarunpen: 'Pretendard Variable',
  SFProText: 'SF Pro',
  SFPro: 'SF Pro',
};

// ---- 진행률 ---------------------------------------------------
const PROG = { i: 0, n: 1, last: -1, lastLabel: '' };
async function prog(label, frac) {
  const pct = Math.min(99, Math.round(((PROG.i + (frac || 0)) / PROG.n) * 100));
  if (pct === PROG.last && label === PROG.lastLabel) return;
  PROG.last = pct; PROG.lastLabel = label;
  figma.ui.postMessage({ type: 'progress', label, pct });
  await new Promise((r) => setTimeout(r, 0)); // UI가 그릴 틈을 줌
}

async function getPages(scope) {
  if (scope === 'all') {
    await figma.loadAllPagesAsync();
    return figma.root.children;
  }
  return [figma.currentPage];
}

// ---- 설치된 폰트 목록 (내 PC + Figma 폰트) --------------------
let FONT_CACHE = null;
async function fontIndex() {
  if (FONT_CACHE) return FONT_CACHE;
  const list = await figma.listAvailableFontsAsync();
  const famStyles = {};
  for (const f of list) (famStyles[f.fontName.family] = famStyles[f.fontName.family] || []).push(f.fontName.style);
  FONT_CACHE = famStyles;
  return famStyles;
}
const norm = (s) => String(s).toLowerCase().replace(/[\s_-]/g, '');
const WEIGHTS = [['extralight', 200], ['ultralight', 200], ['thin', 100], ['light', 300], ['regular', 400], ['book', 400], ['normal', 400],
  ['medium', 500], ['semibold', 600], ['demibold', 600], ['extrabold', 800], ['ultrabold', 800], ['heavy', 800], ['bold', 700], ['black', 900]];
function weightOf(style) {
  const n = norm(style);
  for (const [k, w] of WEIGHTS) if (n.includes(k)) return w;
  return 400;
}
// 원래 굵기(style)와 가장 가까운 스타일을 대상 폰트에서 고름
function pickStyle(famStyles, target, wanted) {
  const styles = famStyles[target] || [];
  if (!styles.length) return wanted;
  const exact = styles.find((s) => norm(s) === norm(wanted));
  if (exact) return exact;
  const wantItalic = /italic|oblique/i.test(wanted);
  const w = weightOf(wanted);
  let best = styles[0], bd = 1e9;
  for (const s of styles) {
    const d = Math.abs(weightOf(s) - w) + (/italic|oblique/i.test(s) === wantItalic ? 0 : 1000);
    if (d < bd) { bd = d; best = s; }
  }
  return best;
}

// ---- 1. 폰트 -------------------------------------------------
// 탐색: 사용 중인 폰트를 모두 모아 "없는 폰트"를 표시. 적용: 사용자가 고른 대체 폰트로 교체.
async function fontStep(pages, userMap, apply) {
  const famStyles = await fontIndex();
  const has = (f) => (famStyles[f.family] || []).includes(f.style);
  const texts = [];
  for (const page of pages) texts.push(...page.findAllWithCriteria({ types: ['TEXT'] }));
  const usage = {}; // family -> { count, texts, styles, missing }
  for (let i = 0; i < texts.length; i++) {
    const seenInText = {};
    for (const s of texts[i].getStyledTextSegments(['fontName'])) {
      const fam = s.fontName.family;
      const u = usage[fam] || (usage[fam] = { family: fam, count: 0, texts: 0, styles: {}, missing: false });
      u.count++; u.styles[s.fontName.style] = 1;
      if (!seenInText[fam]) { u.texts++; seenInText[fam] = 1; }
      if (!has(s.fontName)) u.missing = true;
    }
    if (i % 40 === 0) await prog('사용 중인 폰트 찾는 중', (i / texts.length) * (apply ? 0.3 : 1));
  }
  const fonts = Object.values(usage).map((u) => ({
    family: u.family, texts: u.texts, styles: Object.keys(u.styles), missing: u.missing,
    suggest: u.missing ? (DEFAULT_FONT_MAP[u.family] || null) : null,
  })).sort((a, b) => (b.missing - a.missing) || (b.texts - a.texts));
  const missing = fonts.filter((f) => f.missing);
  const missingTexts = missing.reduce((n, f) => n + f.texts, 0);
  const base = { label: '폰트 교체', fonts, failed: [] };
  if (!apply) return Object.assign(base, { found: '없는 폰트 ' + missing.length + '종 · 텍스트 ' + missingTexts + '개 (전체 ' + fonts.length + '종 사용 중)', done: null });

  const chosen = Object.keys(userMap || {}).filter((k) => userMap[k]);
  if (!chosen.length) return Object.assign(base, { found: '없는 폰트 ' + missing.length + '종', done: '교체할 폰트를 고르지 않아 건너뜀' });
  let fixed = 0, partial = 0;
  const failed = [];
  for (let i = 0; i < texts.length; i++) {
    const t = texts[i];
    if (i % 25 === 0) await prog('폰트 바꾸는 중', 0.3 + (i / texts.length) * 0.7);
    try {
      const segments = t.getStyledTextSegments(['fontName']);
      const mapped = segments.filter((s) => userMap[s.fontName.family]);
      if (!mapped.length) continue;
      // 고르지 않은 '없는 폰트'가 같이 있으면 원래 모양을 복원할 수 없어 건너뜀
      if (segments.some((s) => !userMap[s.fontName.family] && !has(s.fontName))) { partial++; continue; }
      const resolve = (s) => {
        const tgt = userMap[s.fontName.family];
        return tgt ? { family: tgt, style: pickStyle(famStyles, tgt, s.fontName.style) } : s.fontName;
      };
      const first = resolve(mapped[0]);
      await figma.loadFontAsync(first);
      t.fontName = first; // 누락 폰트는 setRangeFontName이 막히므로: 통째 지정 → 구간별 복원
      for (const s of segments) {
        const f = resolve(s);
        await figma.loadFontAsync(f);
        t.setRangeFontName(s.start, s.end, f);
      }
      fixed++;
    } catch (e) { failed.push(t.id + ': ' + String(e.message).slice(0, 60)); }
  }
  return Object.assign(base, {
    found: '없는 폰트 ' + missing.length + '종', failed,
    done: fixed + '개 텍스트 교체' + (partial ? ' (고르지 않은 폰트가 섞인 ' + partial + '개는 건너뜀)' : ''),
  });
}

// ---- 2. 슬라이스 ---------------------------------------------
async function sliceStep(pages, apply) {
  await prog('슬라이스 찾는 중', 0.1);
  let found = 0, removed = 0, skipped = 0;
  for (const page of pages) {
    for (const s of page.findAllWithCriteria({ types: ['SLICE'] })) {
      found++;
      if (!apply) continue;
      try { s.remove(); removed++; } catch (e) { skipped++; } // 인스턴스 안 슬라이스는 마스터에서 지우면 사라짐
    }
  }
  return { label: '슬라이스 삭제', found: found + '개', done: apply ? removed + '개 삭제 (건너뜀 ' + skipped + ')' : null, failed: [] };
}

// ---- 3. 숨김 레이어 ------------------------------------------
async function hiddenStep(pages, apply) {
  await prog('숨김 레이어 찾는 중', 0.1);
  let found = 0, removed = 0, skipped = 0;
  for (const page of pages) {
    const hidden = page.findAll((n) => n.visible === false && n.type !== 'COMPONENT' && n.type !== 'COMPONENT_SET');
    for (const n of hidden) {
      // 숨김 노드의 자식은 따로 세지 않음 (부모가 삭제되면 같이 사라짐)
      if (n.removed || (n.parent && n.parent.visible === false)) continue;
      found++;
      if (!apply) continue;
      try { n.remove(); removed++; } catch (e) { skipped++; }
    }
  }
  return { label: '숨김 레이어 삭제', found: found + '개', done: apply ? removed + '개 삭제 (건너뜀 ' + skipped + ')' : null, failed: [] };
}

// ---- 4. 아이콘·로고 마스터의 배경 fill -----------------------
// 이름이 ic/·icon·logo 로 시작하는 컴포넌트의 자체 fill 제거
async function iconBgStep(pages, apply) {
  await prog('아이콘 배경 찾는 중', 0.1);
  let found = 0, done = 0;
  const names = [];
  for (const page of pages) {
    for (const c of page.findAllWithCriteria({ types: ['COMPONENT'] })) {
      if (!/^(ic[\/_]|icon|logo)/i.test(c.name)) continue;
      if (c.fills === figma.mixed || !c.fills.some((f) => f.visible !== false)) continue;
      found++; names.push(c.name);
      if (apply) { c.fills = []; done++; }
    }
  }
  return { label: '아이콘·로고 배경 제거', found: found + '개', done: apply ? done + '개 제거' : null, failed: [], detail: names.slice(0, 20) };
}

// ---- 5. Sketch 마스크 모서리 보정 ----------------------------
// Sketch의 둥근 마스크가 Figma에서 적용 안 돼 직각으로 나올 때:
// 모서리 반경이 있는 'Mask' 사각형(실제 마스크 isMask=false) 바로 위 형제가
// 같은 영역을 덮고 모서리가 0이면 → 반경을 직접 복사 + 프레임은 clipsContent
function insideInstance(n) {
  for (let p = n.parent; p; p = p.parent) if (p.type === 'INSTANCE') return true;
  return false;
}
function sameArea(a, b) {
  return Math.abs(a.x - b.x) < 1.5 && Math.abs(a.y - b.y) < 1.5 &&
         Math.abs(a.width - b.width) < 1.5 && Math.abs(a.height - b.height) < 1.5;
}
async function maskStep(pages, apply) {
  await prog('마스크 모서리 확인 중', 0.1);
  let found = 0, done = 0, skippedReal = 0, skippedOther = 0;
  const detail = [];
  for (const page of pages) {
    for (const m of page.findAllWithCriteria({ types: ['RECTANGLE'] })) {
      if (!/mask/i.test(m.name) || insideInstance(m)) continue;
      if (m.cornerRadius === figma.mixed || !(m.cornerRadius > 0)) continue;
      if (m.isMask) { skippedReal++; continue; } // 이미 Figma 마스크로 동작 중 → 건드리지 않음
      const sibs = m.parent.children;
      const target = sibs.slice(sibs.indexOf(m) + 1).find((n) => n.visible !== false);
      if (!target || !sameArea(m, target) || !('cornerRadius' in target) ||
          target.cornerRadius === figma.mixed || target.cornerRadius > 0) { skippedOther++; continue; }
      found++;
      if (detail.length < 15) detail.push(target.name + ' → ' + m.cornerRadius);
      if (!apply) continue;
      target.cornerRadius = m.cornerRadius;
      if (target.type === 'FRAME') target.clipsContent = true;
      done++;
    }
  }
  return { label: '마스크 모서리 보정', found: found + '곳', done: apply ? done + '곳 적용' : null, failed: [],
    detail: detail.concat(['(이미 마스크로 동작 ' + skippedReal + ', 대상 아님 ' + skippedOther + ')']) };
}

// ---- 6. 중복 레이어 (안전 삭제) -------------------------------
// 같은 부모 안에서 종류·위치·크기·채움·선·모서리(·텍스트 내용)가 모두 같은 형제를 후보로 잡음.
// 적용: 후보를 숨김 → 맨 위 프레임을 PNG로 내보내 숨기기 전과 바이트 비교
//       → 같을 때만 삭제, 다르면 되돌림. (그룹·프레임·컴포넌트·인스턴스·마스크는 대상 제외)
function dupSig(n) {
  return JSON.stringify([
    n.type, Math.round(n.x * 10), Math.round(n.y * 10), Math.round(n.width * 10), Math.round(n.height * 10),
    ('fills' in n && n.fills !== figma.mixed) ? n.fills : null,
    ('strokes' in n) ? n.strokes : null,
    ('cornerRadius' in n) ? String(n.cornerRadius) : null,
    n.type === 'TEXT' ? n.characters : null,
  ]);
}
function rootFrame(n) {
  let p = n;
  while (p.parent && p.parent.type !== 'PAGE') p = p.parent;
  return p;
}
function sameBytes(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
async function dupStep(pages, apply) {
  const skipTypes = ['INSTANCE', 'COMPONENT', 'COMPONENT_SET', 'GROUP', 'FRAME', 'SECTION'];
  const cands = [];
  for (let pi = 0; pi < pages.length; pi++) {
    await prog('중복 후보 찾는 중', (pi / pages.length) * (apply ? 0.3 : 1));
    for (const parent of pages[pi].findAll((n) => 'children' in n && n.type !== 'INSTANCE')) {
      const seen = {};
      for (const k of parent.children) {
        if (skipTypes.includes(k.type) || ('isMask' in k && k.isMask) || k.visible === false) continue;
        const sg = dupSig(k);
        if (seen[sg]) cands.push(k); else seen[sg] = k.id;
      }
    }
  }
  const detail = cands.slice(0, 15).map((n) => n.name + ' (' + n.type + ')'); // 삭제 전에 읽어 둠
  let removed = 0, restored = 0;
  const failed = [];
  if (apply) {
    const baseline = {}; // 프레임 id → 기준 PNG
    for (let i = 0; i < cands.length; i++) {
      const k = cands[i];
      await prog('중복 레이어 화면 비교 중', 0.3 + (i / cands.length) * 0.7);
      try {
        const root = rootFrame(k);
        if (!baseline[root.id]) baseline[root.id] = await root.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 1 } });
        k.visible = false;
        const after = await root.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 1 } });
        if (sameBytes(baseline[root.id], after)) { k.remove(); removed++; }
        else { k.visible = true; restored++; }
      } catch (e) {
        try { k.visible = true; } catch (_) {}
        failed.push(k.id + ': ' + String(e.message).slice(0, 60));
      }
    }
  }
  return { label: '중복 레이어 점검', found: cands.length + '개 후보',
    done: apply ? removed + '개 삭제 (화면이 달라져 복구 ' + restored + ')' : null, failed,
    detail };
}

// ---- 7. 색 빠진 아이콘 후보 (목록만, 수정 안 함) -----------------
// 아이콘 크기(<=64)의 컴포넌트 중
//  (a) 보이는 칠/선이 전부 흰색 → 흰 선·흰 채움만 남은 아이콘
//  (b) 보이는 칠/선이 하나도 없음 → fill 꺼짐 등으로 안 보이는 아이콘
// 단, 뒤에 색 배경(아이콘 영역 절반 이상을 덮는 비흰색 칠)이 있으면 정상으로 보고 제외.
// 흰 아이콘이 색 원 위에 놓이는 경우는 사용처에서 정상일 수 있으니 '사용처 수'를 함께 보여줌.
const LEAF_TYPES = ['VECTOR', 'BOOLEAN_OPERATION', 'RECTANGLE', 'ELLIPSE', 'STAR', 'POLYGON', 'LINE', 'TEXT'];
function visiblePaints(n) {
  const out = [];
  if ('fills' in n && n.fills !== figma.mixed) for (const f of n.fills) if (f.visible !== false && (f.opacity === undefined || f.opacity > 0)) out.push(f);
  if ('strokes' in n) for (const f of n.strokes) if (f.visible !== false && (f.opacity === undefined || f.opacity > 0)) out.push(f);
  return out;
}
function isWhitePaint(f) {
  return f.type === 'SOLID' && f.color.r > 0.95 && f.color.g > 0.95 && f.color.b > 0.95;
}
async function faintIconStep(pages, apply) {
  const items = [];
  const comps = [];
  for (const page of pages) comps.push(...page.findAllWithCriteria({ types: ['COMPONENT'] }));
  for (let i = 0; i < comps.length; i++) {
    const c = comps[i];
    if (i % 20 === 0) await prog('색 빠진 아이콘 찾는 중', i / comps.length);
    if (c.width > 64 || c.height > 64) continue;
    if (c.parent && c.parent.type === 'COMPONENT_SET') continue;
    const own = visiblePaints(c);
    if (own.some((f) => !isWhitePaint(f))) continue; // 자체 색 배경 있음
    const leaves = c.findAll((k) => LEAF_TYPES.includes(k.type) && !('isMask' in k && k.isMask));
    if (!leaves.length) continue;
    let white = 0, colored = 0, bg = false;
    for (const k of leaves) {
      const paints = visiblePaints(k);
      if (!paints.length) continue;
      if (paints.every(isWhitePaint)) { white++; continue; }
      colored++;
      if (k.width * k.height >= c.width * c.height * 0.5 && 'fills' in k && k.fills !== figma.mixed && k.fills.some((f) => f.visible !== false && !isWhitePaint(f))) bg = true;
    }
    if (bg || colored > 0) continue;
    if (white === 0 && own.length === 0 && /^(ic|icon)/i.test(c.name) === false) continue; // 아이콘 이름 아닌 빈 컴포넌트는 제외
    const reason = white > 0 ? '흰색만 있음' : '보이는 칠·선 없음';
    let uses = 0;
    try { uses = (await c.getInstancesAsync()).length; } catch (e) {}
    items.push({ id: c.id, name: c.name, note: reason + ' · 사용처 ' + uses });
  }
  return { label: '색 빠진 아이콘 후보', found: items.length + '개 (목록만)', done: null, failed: [], items: items.slice(0, 60) };
}

// ---- 정리 전후 화면 비교 ---------------------------------------
// 대상: 선택한 최상위 프레임이 있으면 그것, 없으면 범위 안 페이지들의 최상위 프레임(최대 MAX_FRAMES개)
const MAX_FRAMES = 12;
async function snapshot(pages, ids, label) {
  let frames = [];
  if (ids) {
    for (const id of ids) { const n = await figma.getNodeByIdAsync(id); if (n && n.removed !== true) frames.push(n); }
  } else {
    const sel = figma.currentPage.selection.filter((n) => n.parent && n.parent.type === 'PAGE' && 'exportAsync' in n);
    if (sel.length) frames = sel;
    else for (const page of pages) frames.push(...page.children.filter((n) => ['FRAME', 'COMPONENT', 'SECTION'].includes(n.type) && n.visible !== false));
  }
  const total = frames.length;
  frames = frames.slice(0, MAX_FRAMES);
  const out = [];
  for (let i = 0; i < frames.length; i++) {
    await prog(label, i / frames.length);
    try {
      const bytes = await frames[i].exportAsync({ format: 'PNG', constraint: { type: 'WIDTH', value: 360 } });
      out.push({ id: frames[i].id, name: frames[i].name, bytes });
    } catch (e) { /* 내보낼 수 없는 노드는 건너뜀 */ }
  }
  return { items: out, total };
}

// ---- 8. 고정폭 텍스트 줄바꿈 보정 ------------------------------
// Sketch 박스 폭(예: 50)이 가져오며 반올림돼 49가 되면 "19,800"이 "19,80 / 0"으로 두 줄이 됨.
// 대상: 폭·높이 고정(NONE)이고 공백이 없는 짧은 텍스트 중, 자연 폭이 현재 폭보다 크고 실제로 줄바꿈되는 것.
// 보정: 폭을 필요한 만큼(올림) 늘림. 정렬 기준은 유지 — 오른쪽 정렬은 오른쪽 끝, 가운데는 중심 고정.
// 인스턴스 안의 텍스트는 마스터에서 고쳐야 하므로 건너뜀. 오토레이아웃 자식은 레이아웃이 위치를 잡음.
async function textWidthStep(pages, apply) {
  const items = []; let done = 0, skipped = 0;
  const failed = [];
  const texts = [];
  for (const page of pages) texts.push(...page.findAllWithCriteria({ types: ['TEXT'] }));
  for (let i = 0; i < texts.length; i++) {
    const t = texts[i];
    if (i % 20 === 0) await prog('고정폭 텍스트 확인 중', i / texts.length);
    if (t.textAutoResize !== 'NONE' || /\s/.test(t.characters.trim()) || insideInstance(t)) continue;
    try {
      for (const sg of t.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(sg.fontName);
      const a = t.clone(); a.textAutoResize = 'WIDTH_AND_HEIGHT'; const nw = a.width, nh = a.height; a.remove();
      const b = t.clone(); b.textAutoResize = 'HEIGHT'; const wh = b.height; b.remove();
      if (!(nw > t.width + 0.01 && wh > nh * 1.4)) continue;
      const target = Math.ceil(nw - 0.001);
      items.push({ id: t.id, name: t.characters.slice(0, 14), note: t.width + ' → ' + target + 'px' });
      if (!apply) continue;
      const delta = target - t.width;
      const inAuto = t.parent && 'layoutMode' in t.parent && t.parent.layoutMode !== 'NONE' && t.layoutPositioning !== 'ABSOLUTE';
      const x = t.x;
      t.resize(target, t.height);
      if (!inAuto) {
        if (t.textAlignHorizontal === 'RIGHT') t.x = x - delta;
        else if (t.textAlignHorizontal === 'CENTER') t.x = x - delta / 2;
      }
      done++;
    } catch (e) { skipped++; failed.push(t.id + ': ' + String(e.message).slice(0, 60)); }
  }
  return { label: '고정폭 텍스트 보정', found: items.length + '곳', done: apply ? done + '곳 보정 (건너뜀 ' + skipped + ')' : null, failed, items: items.slice(0, 40) };
}

// ---- 실행 -----------------------------------------------------
const STEP_LIST = [
  ['fonts', (p, a, m) => fontStep(p, m.fontMap, a)],
  ['slices', (p, a) => sliceStep(p, a)],
  ['hidden', (p, a) => hiddenStep(p, a)],
  ['iconBg', (p, a) => iconBgStep(p, a)],
  ['masks', (p, a) => maskStep(p, a)],
  ['dupes', (p, a) => dupStep(p, a)],
  ['faint', (p, a) => faintIconStep(p, a)],
  ['textw', (p, a) => textWidthStep(p, a)],
];

async function run(msg, apply, stageOffset, stageTotal) {
  const pages = await getPages(msg.scope);
  const active = STEP_LIST.filter(([k]) => msg.steps[k]);
  PROG.n = stageTotal || active.length || 1;
  PROG.i = stageOffset || 0;
  const report = [];
  for (const [key, fn] of active) {
    report.push(await fn(pages, apply, msg));
    PROG.i++;
  }
  if (!(apply && msg.compare)) figma.ui.postMessage({ type: 'progress', label: '마무리하는 중', pct: 100 }); // 전후 비교가 남았으면 100%를 미룸
  figma.ui.postMessage({ type: apply ? 'applied' : 'scanned', report, pages: pages.length, file: figma.root.name, scope: msg.scope });
}

figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === 'init') {
      const fi = await fontIndex();
      figma.ui.postMessage({ type: 'init', families: Object.keys(fi).sort((a, b) => a.localeCompare(b)), file: figma.root.name });
    }
    if (msg.type === 'scan') { PROG.last = -1; await run(msg, false); }
    if (msg.type === 'apply') {
      PROG.last = -1;
      const active = STEP_LIST.filter(([k]) => msg.steps[k]).length;
      const total = active + (msg.compare ? 2 : 0);
      let before = null;
      if (msg.compare) {
        const pages = await getPages(msg.scope);
        PROG.n = total; PROG.i = 0;
        before = await snapshot(pages, null, '정리 전 화면 저장 중');
      }
      await run(msg, true, msg.compare ? 1 : 0, total);
      if (before) {
        PROG.n = total; PROG.i = total - 1;
        const after = await snapshot(null, before.items.map((i) => i.id), '정리 후 화면 저장 중');
        const pairs = before.items.map((b) => {
          const a = after.items.find((x) => x.id === b.id);
          return a ? { id: b.id, name: b.name, before: b.bytes, after: a.bytes } : null;
        }).filter(Boolean);
        figma.ui.postMessage({ type: 'compare', pairs, total: before.total, shown: pairs.length });
      }
    }
    if (msg.type === 'select') {
      const nodes = [];
      for (const id of msg.ids) { const n = await figma.getNodeByIdAsync(id); if (n) nodes.push(n); }
      if (nodes.length) {
        let page = nodes[0]; while (page && page.type !== 'PAGE') page = page.parent;
        if (page && page !== figma.currentPage) await figma.setCurrentPageAsync(page);
        figma.currentPage.selection = nodes;
        figma.viewport.scrollAndZoomIntoView(nodes);
      }
    }
  } catch (e) {
    figma.ui.postMessage({ type: 'error', message: String(e && e.message || e) });
  }
};
