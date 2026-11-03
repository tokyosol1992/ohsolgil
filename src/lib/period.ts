// 기간 표기 규칙 (2026-11-03 사용자 결정): 연차("8년 차")는 쓰지 않고
// 연도 범위는 `YYYY - YYYY`, 날짜는 `YYYY.MM.DD`, 범위는 ` - `(앞뒤 띄어쓰기)로 잇는다.
// 재직 중이면 끝을 '현재'로 적는다 (2026-11-03 사용자 결정).
// 형식이 어긋나면 빌드에서 바로 멈추도록 검사한다.
const RE = /^\d{4}(\.\d{2}\.\d{2})?$/;
export const PRESENT = '현재';

function check(v: string) {
  if (!RE.test(v)) throw new Error(`기간 형식 오류: "${v}" — YYYY 또는 YYYY.MM.DD (재직 중이면 끝을 "현재")로 적어 주세요`);
  return v;
}

/** `YYYY - YYYY` / `YYYY.MM.DD - YYYY.MM.DD` / 재직 중 `YYYY.MM.DD - 현재`. 시작이나 끝이 비면 null */
export function period(start?: string, end?: string): string | null {
  if (!start || !end) return null;
  return `${check(start)} - ${end === PRESENT ? PRESENT : check(end)}`;
}

/** 자리 표시용 (기간을 아직 받지 않은 경력) */
export const PERIOD_PLACEHOLDER = 'YYYY.MM.DD - YYYY.MM.DD';
