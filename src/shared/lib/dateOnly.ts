/**
 * `YYYY-MM-DD` 문자열과 `Date` 사이를 오간다. **시각은 다루지 않는다.**
 *
 * 로그잇(`features/made/logitTypes.ts`)에만 있던 것을 옮겼다 — 챌린짓 종료일도 같은
 * 처리가 필요해서다. 각자 갖고 있으면 한쪽만 고쳐져 하루씩 어긋나는 날이 온다.
 */

/**
 * 그 지역의 자정으로 읽는다.
 *
 * `new Date('2026-08-13')`은 **UTC 자정**이라 UTC-N 브라우저에서 하루 전으로 밀린다.
 * 한국(UTC+9)에서는 안 드러나지만, 해외에서 열면 종료일이 하루 당겨져 보인다.
 */
export function parseDateOnly(date: string): Date {
    const [year, month, day] = date.split('-').map(Number)
    return new Date(year, month - 1, day)
}

export function formatDateOnly(value: Date): string {
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${value.getFullYear()}-${month}-${day}`
}

/** 오늘 자정. 지난 날짜를 막을 때 기준으로 쓴다 */
export function todayDateOnly(): Date {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

const LABEL = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })

/** `2026년 8월 13일 (목)` */
export function dateOnlyLabel(date: string): string {
    return LABEL.format(parseDateOnly(date))
}
