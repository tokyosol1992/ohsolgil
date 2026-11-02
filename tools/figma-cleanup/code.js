// Sketch → Figma 정리 플러그인 (뼈대)
// 흐름: UI에서 옵션 선택 → 'scan'(미리보기, 아무것도 안 바꿈) → 'apply'(적용) → 리포트
figma.showUI(__html__, { width: 360, height: 560 });

const DEFAULT_FONT_MAP = {
  NotoSansCJKkr: 'Pretendard Variable',
  'Noto Sans CJK KR': 'Pretendard Variable',
  AppleSDGothicNeo: 'Pretendard Variable',
  Pretendard: 'Pretendard Variable',
  PretendardVariable: 'Pretendard Variable',
  NanumBarunpen: 'Pretendard Variable',
  SFProText: 'SF Pro',
  SFPro: 'SF Pro',
};

async function getPages(scope) {
  if (scope === 'all') {
    await figma.loadAllPagesAsync();
    return figma.root.children;
  }
  return [figma.currentPage];
}

// ---- 1. 폰트 -------------------------------------------------
async function fontStep(pages, map, apply) {
  let texts = 0, segs = 0, fixed = 0;
  const failed = [];
  for (const page of pages) {
    for (const t of page.findAllWithCriteria({ types: ['TEXT'] })) {
      const segments = t.getStyledTextSegments(['fontName']);
      const bad = segments.filter((s) => map[s.fontName.family]);
      if (!bad.length) continue;
      texts++; segs += bad.length;
      if (!apply) continue;
      try {
        // 누락 폰트는 setRangeFontName이 막히므로: 통째 지정 → 구간별 복원
        const first = bad[0];
        const fam0 = map[first.fontName.family];
        await figma.loadFontAsync({ family: fam0, style: first.fontName.style });
        t.fontName = { family: fam0, style: first.fontName.style };
        for (const s of segments) {
          const fam = map[s.fontName.family] || s.fontName.family;
          const f = { family: fam, style: s.fontName.style };
          await figma.loadFontAsync(f);
          t.setRangeFontName(s.start, s.end, f);
        }
        fixed++;
      } catch (e) {
        failed.push(t.id + ': ' + String(e.message).slice(0, 60));
      }
    }
  }
  return { label: '누락 폰트 교체', found: texts + '개 텍스트 (' + segs + '구간)', done: apply ? fixed + '개 교체' : null, failed };
}

// ---- 2. 슬라이스 ---------------------------------------------
async function sliceStep(pages, apply) {
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
  let found = 0, removed = 0, skipped = 0;
  for (const page of pages) {
    const hidden = page.findAll((n) => n.visible === false && n.type !== 'COMPONENT' && n.type !== 'COMPONENT_SET');
    for (const n of hidden) {
      // 숨김 노드의 자식은 따로 세지 않음 (부모가 삭제되면 같이 사라짐)
      if (n.parent && n.parent.visible === false) continue;
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
  return { label: '아이콘·로고 배경 fill 제거', found: found + '개', done: apply ? done + '개 제거' : null, failed: [], detail: names.slice(0, 20) };
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
  return { label: 'Sketch 마스크 모서리 보정', found: found + '곳', done: apply ? done + '곳 적용' : null, failed: [],
    detail: detail.concat(['(이미 마스크로 동작 ' + skippedReal + ', 대상 아님 ' + skippedOther + ')']) };
}

async function run(msg, apply) {
  const pages = await getPages(msg.scope);
  const map = Object.assign({}, DEFAULT_FONT_MAP, msg.fontMap || {});
  const report = [];
  if (msg.steps.fonts) report.push(await fontStep(pages, map, apply));
  if (msg.steps.slices) report.push(await sliceStep(pages, apply));
  if (msg.steps.hidden) report.push(await hiddenStep(pages, apply));
  if (msg.steps.iconBg) report.push(await iconBgStep(pages, apply));
  if (msg.steps.masks) report.push(await maskStep(pages, apply));
  figma.ui.postMessage({ type: apply ? 'applied' : 'scanned', report, pages: pages.length });
}

figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === 'init') figma.ui.postMessage({ type: 'defaults', fontMap: DEFAULT_FONT_MAP });
    if (msg.type === 'scan') await run(msg, false);
    if (msg.type === 'apply') await run(msg, true);
  } catch (e) {
    figma.ui.postMessage({ type: 'error', message: String(e && e.message || e) });
  }
};
