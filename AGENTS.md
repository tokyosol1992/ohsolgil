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

## Figma 정리 작업 (2026-10-29 시작, 사용자 요청 — 작업 메모)
- 원본: Sketch로 작업한 B2B 로그인·회원가입 화면(그로우포웍스), Figma로 연 파일 `1MW8hD1ayKZi6xZkfVDkqJ` (페이지 `로그인` node 0:678, 18개 화면). Figma 링크: https://www.figma.com/design/1MW8hD1ayKZi6xZkfVDkqJ/
- **목표**: Sketch→Figma 호환 문제로 Figma에서 안 나오는 영역은 나오게, 필요 없는 영역은 삭제, 비어 보이는 곳은 주변 파일을 읽고 컬러로 채워서 **바로 쓸 수 있는 Figma 파일로 최신화**. 다 끝나면 디자인을 갈무리해 프로토타입 파일에 더 멋진 문서로 취합 → 그 뒤 홈페이지(ohsolgil)에 적용.
- 진행 방식: 어려운 부분은 언제든 사용자에게 질문·요청. 이 대화에서 하나씩 바꿔 나감.
- 환경: 클라우드에서 www.figma.com 파일 다운로드(curl)는 막힘 → 스크린샷은 `get_screenshot`의 `enableBase64Response: true`로 확인. 수정은 `use_figma`(Figma MCP).
- 발견·조치: 툴팁 "마지막 단계에요 😄" 3곳(0:780, 0:818, 0:852)은 `NotoSansCJKkr` 누락 폰트라 글자가 안 보였음 → Pretendard Variable SemiBold로 교체·가운데 정렬 (완료). 파일 전체 폰트는 Pretendard Variable(Regular/Medium/SemiBold/Bold)
- 남은 점검: 약관 팝업(0:745) 뒤 배경이 단색 회색(딤만 있고 아래 화면 없음), 일부 프레임 `fills visible:false`·벡터 변환 뒤집힘(Sketch 잔재), 다른 페이지(온보딩·비밀번호 찾기 등) 동일 증상 여부

### Figma 정리 진행 기록 (2026-10-29)
- 결정(사용자): 약관 팝업은 **이전 화면 위에 딤**, 범위는 **파일 전체 페이지**, 점선으로 보이는 **슬라이스는 삭제**, 아이콘 색이 빠져 안 보이는 곳은 보이게 복구
- 완료: ① 누락 폰트(`NotoSansCJKkr`, 비가변 `Pretendard`) → `Pretendard Variable`로 교체 (툴팁 3, 온보딩 `그로우` 1, 커버 2) ② 마스터 컴포넌트의 슬라이스 30개 삭제(인스턴스는 자동 반영, 전 페이지 0개) ③ participant_solo/together 아이콘: fill 꺼짐+흰 stroke → 라벨색(#73787f) fill ④ ic/32/close 아이콘(마스터 0:1373): 흰 선 → 뒤로가기와 같은 #666 선 ⑤ 약관 팝업(0:745): `배경(이전 화면)`(0:769 복제, 잠금)+`딤`(검정 50%) 추가
- 남은 일(사용자 결정 대기): 스플래시(0:2, 0:6)의 로고 뒤 흰 네모·하단 그로우 로고 회색 네모 처리 / `feed/bottom/03`의 fill 꺼진 빈 사각형(0:405, 0:406) 정리 / 화면 안 중복 레이어 목록 확인 후 삭제 / 마지막으로 전 페이지 스크린샷 재검수
- 팁: 슬라이스·색 문제는 `use_figma`로 페이지별(페이지 전환은 호출당 1회) 감사. 인스턴스 내부 레이어는 마스터에서 고칠 것
- (2026-10-29 추가) 스플래시: 로고 마스터 3개(`logo_customer` 0:1297, `logo_typography(white)` 0:1353, `logo_typography(color)` 0:1365)의 배경 fill을 제거해 흰/회색 네모 해소. 온보딩 `feed/bottom/03`의 빈 사각형(0:405, 0:406) 삭제
- 중복 레이어 후보(삭제 전 사용자 확인 대기): 스플래시 default(0:6)의 상태바·홈바 중복(0:10, 0:11), 온보딩 `감사 (데이터)`의 Mask 중복(0:171 = 0:172). 나머지 페이지는 중복 없음
- (2026-10-29) 스플래시 default 중복 상태바·홈바(0:10, 0:11) 삭제. `감사` 그룹 Mask: 0:171은 실제 마스크, 0:172는 같은 크기·모양(#d8d8d8, 반경 12)의 마스크 아래 사각형 — 숨겨도 렌더링 차이 없음(삭제해도 안전하나 사용자 결정 대기)
- **소통 규칙(사용자 요청)**: 사용자는 디자이너(사람)라 `0:171` 같은 노드 ID로 설명하면 못 알아봄 → **화면 이름과 눈에 보이는 모습**으로 설명할 것
- **다음 계획**: 이 파일 마무리 후 Figma 폴더 https://www.figma.com/files/folder/424251949 안의 **모든 파일**을 같은 방식으로 정리 예정. 폴더 목록은 도구로 못 읽으니 사용자에게 파일 링크를 받아야 함. 반복 체크리스트: ① 누락 폰트 교체 ② 슬라이스 삭제 ③ 색 빠진 아이콘 복구 ④ 로고·아이콘 뒤 배경색 제거 ⑤ 중복·빈 레이어 정리 ⑥ 전 화면 렌더링 최종 점검
- (2026-10-29) 온보딩 마지막 화면 "thank you" 카드 뒤 숨은 회색 사각형(0:172) 삭제 완료, 화면 변화 없음. 이 파일의 정리 항목은 모두 완료 → 전 페이지 최종 점검 후 폴더 작업으로
