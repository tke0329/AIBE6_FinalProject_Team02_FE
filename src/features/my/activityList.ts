/** 내 활동 목록(리뷰·로그잇)이 함께 쓰는 표시 헬퍼 */

/** `8월 12일`. 해가 바뀌면 연도까지 — 작년 것이 올해 것처럼 보이면 안 됨 */
export function reviewDate(iso: string): string {
    const d = new Date(iso)
    const md = `${d.getMonth() + 1}월 ${d.getDate()}일`
    return d.getFullYear() === new Date().getFullYear() ? md : `${d.getFullYear()}년 ${md}`
}

/**
 * `2026-08-12` → `8월 12일`. 해가 바뀌면 연도까지.
 *
 * `reviewDate`와 나눈 이유 — 이쪽은 **날짜만 있는 문자열**이다.
 * `new Date('2026-08-12')`는 UTC 자정으로 읽혀 한국 시간대에서 하루 앞으로 밀린다.
 * 그래서 파싱하지 않고 자른다
 */
export function activityDate(loggedOn: string): string {
    const [y, m, d] = loggedOn.split('-').map(Number)
    const md = `${m}월 ${d}일`
    return y === new Date().getFullYear() ? md : `${y}년 ${md}`
}

/**
 * 고친 적이 있는지.
 *
 * 1초 여유를 둔다 — 생성 시각과 수정 시각은 저장할 때 함께 찍혀 같은 값이지만,
 * 밀리초가 어긋나면 손대지 않은 글에 「수정됨」이 붙어 버린다.
 *
 * `updatedAt`이 없는 경우도 받는다 — 컬럼이 nullable이라 고친 적 없으면 비어 있을 수 있다
 */
export function wasEdited(item: { createdAt: string; updatedAt: string | null }): boolean {
    if (!item.updatedAt) return false
    return new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime() > 1000
}
