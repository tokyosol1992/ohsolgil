# Oh SolGil 포트폴리오 (AI 작업자용 노트)

- 사용자와는 **한국어**로 대화. 작업 후 이 파일의 「현재 상태」 갱신.
- 형제 사이트: **MoHo** (https://tokyosol1992.github.io, 저장소 `tokyosol1992/tokyosol1992.github.io`) — 팁·AI·툴·기록 라이브러리. 이 저장소는 **개인 홍보용 포트폴리오** (junheedot.com 스타일 한 페이지).
- 배포: `main`에 push → GitHub Actions → GitHub Pages (`tokyosol1992.github.io/ohsolgil`). 추후 커스텀 도메인 연결 예정(BASE는 워크플로가 자동 주입).
- 스택: Astro 7, 순수 CSS(`src/styles/global.css`, 다크 고정). 페이지는 `src/pages/index.astro` 하나, 데이터는 상단 배열.
- 시안: https://claude.ai/artifact/E2awrer8gqNuoPrWADrMPG (사용자 승인됨)
- 규칙: **경력·성과·요약·연락처는 사용자에게 받은 것만** 채움(지금은 "입력 예정" 자리 표시). 프로젝트 이름 8개는 Figma 포트폴리오 표지 기준.

## 현재 상태 (2026-10-28)
- ✅ 시안 그대로 구현·**배포 완료**: https://tokyosol1992.github.io/ohsolgil (소개·경력·프로젝트·문서·연락처·MoHo 링크, 모바일 가로 스크롤 없음)
- (2026-10-28) 헤더: `position:fixed`, 맨 위는 **투명·화면 전체 폭**(max 1760px), 스크롤 24px 넘으면 `header.is-scrolled`로 **콘텐츠 폭(`--content` 1040px)으로 좁아지며 반투명 블러**(`src/scripts/header.ts`). 콘텐츠 폭은 `.wrap`(= `--content` + 좌우 `--gutter`)이라 스크롤 후 헤더 양 끝과 본문 양 끝이 일치
- (2026-10-28) 헤더 **유리(glass) 질감** + **섹션 메뉴**: 스크롤 후 **어두운 틴트**(`rgba(9,9,11,.62)`) + `blur(20px) saturate(1.7) brightness(.85)` + 약한 반사선(처음엔 흰 틴트였는데 "혼자 밝다"는 피드백으로 어둡게). 메뉴(About·Experience·Projects·Docs·Contact = 섹션 id)는 스크롤 위치로 현재 항목을 표시하고 `.nav-ind` 유리 하이라이트가 미끄러져 이동. 모바일(≤720px)은 햄버거 → 유리 드롭다운(`#menu`, 번호 01~05). 메뉴 항목은 `index.astro` 상단 `menu` 배열 한 곳에서 관리
- (2026-10-28) GNB 구성(reactbits 방식): **로고 `/` 메뉴**가 왼쪽에 이어지고 CTA(`Resume`)만 오른쪽 끝. 메뉴·CTA 라벨은 **영어**(About · Experience · Projects · Docs · Contact)로 로고와 톤을 맞춤. 본문 섹션 제목(h2)·부제도 영어(메뉴와 동일), 카드 안 내용(핵심 역량·경력·프로젝트 요약 등 자리 표시)은 한글
- (2026-10-28) 히어로는 화면 전체 폭(`.hero-full`) + 뒤에 **닷 그리드 캔버스**(`src/scripts/dot-grid.ts`, reactbits DotGrid 참고): 마우스 주변 닷이 파랑으로 그라데이션 점등, 마우스 속도만큼 밀렸다가 스프링으로 복귀, 클릭 충격파. 상수(`SIZE`·`GAP`·`PROXIMITY`·`SPRING`·`DAMPING` 등)는 파일 상단. 모션 줄이기면 정지 닷만
- ⚠️ 빌드(esbuild 최소화)가 `backdrop-filter`에서 **`blur(0)`을 `blur()`로 깨뜨리고**, `-webkit-backdrop-filter`를 표준 속성보다 뒤에 쓰면 표준 쪽을 지움 → `blur(.1px)`을 쓰고 **`-webkit-` 먼저, 표준 속성 나중** 순서로 쓸 것
- 프로젝트 카드는 상세 페이지 없음("상세 준비 중"). 문서 버튼은 PDF 연결 전. 경력·요약·연락처는 "입력 예정" 자리 표시
- 배포 설정 메모: Pages Source = GitHub Actions. `github-pages` 환경(Settings → Environments)이 `main`을 허용해야 배포됨(처음엔 막혀 있어 사용자가 허용함)
- 클라우드 세션에서 이 저장소 푸시는 Claude GitHub App에 저장소 권한이 있어야 함. 배포된 github.io는 curl로 안 열리니 Actions 결과로 확인
- MoHo 푸터·홈 Contact에 이 사이트 링크 추가·배포됨(MoHo 저장소 PR #14). 히어로 한글 문구·버튼은 사용자 결정으로 **한글 유지**(헤더·섹션 제목·부제만 영어)
- 날짜별 작업 기록은 `HISTORY.md` 참고

## 다음 할 일
1. 사용자에게 받아 채우기: 핵심 역량 3문장, 경력(회사·기간·직무·성과), 프로젝트 요약, 이메일·LinkedIn
2. 포트폴리오·이력서 PDF를 `public/`에 넣고 문서 버튼 연결
3. 프로젝트 상세 페이지 추가
4. OG 이미지·파비콘, 커스텀 도메인 연결(사용자가 도메인 구매 후)
