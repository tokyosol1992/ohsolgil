# Oh SolGil 포트폴리오 (AI 작업자용 노트)

- 사용자와는 **한국어**로 대화. 작업 후 이 파일의 「현재 상태」 갱신.
- 형제 사이트: **MoHo** (https://tokyosol1992.github.io, 저장소 `tokyosol1992/tokyosol1992.github.io`) — 팁·AI·툴·기록 라이브러리. 이 저장소는 **개인 홍보용 포트폴리오** (junheedot.com 스타일 한 페이지).
- 배포: `main`에 push → GitHub Actions → GitHub Pages (`tokyosol1992.github.io/ohsolgil`). 추후 커스텀 도메인 연결 예정(BASE는 워크플로가 자동 주입).
- 스택: Astro 7, 순수 CSS(`src/styles/global.css`, 다크 고정). 페이지는 `src/pages/index.astro` 하나, 데이터는 상단 배열.
- 시안: https://claude.ai/artifact/E2awrer8gqNuoPrWADrMPG (사용자 승인됨)
- 규칙: **경력·성과·요약·연락처는 사용자에게 받은 것만** 채움(지금은 "입력 예정" 자리 표시). 프로젝트 이름 8개는 Figma 포트폴리오 표지 기준.

## 현재 상태 (2026-10-28)
- 시안 그대로 구현 완료(소개·경력·프로젝트·문서·연락처·MoHo 링크). 빌드 통과, 모바일 가로 스크롤 없음.
- 프로젝트 카드는 상세 페이지 없음("상세 준비 중"). 문서 버튼은 PDF 연결 전.

## 다음 할 일
1. 사용자에게 받아 채우기: 핵심 역량 3문장, 경력(회사·기간·직무·성과), 프로젝트 요약, 이메일·LinkedIn
2. 포트폴리오·이력서 PDF를 `public/`에 넣고 문서 버튼 연결
3. 프로젝트 상세 페이지 추가
4. MoHo 푸터에 이 사이트 링크 추가, OG 이미지·파비콘
