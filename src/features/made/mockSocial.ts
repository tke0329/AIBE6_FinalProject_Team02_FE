/**
 * 좋아요·댓글 **목업**. 서버에 아직 없다.
 *
 * BE에 `MadeDexRecordLike` · 댓글 테이블과 엔드포인트가 생기면 **이 파일을 지우고**
 * 같은 모양의 API 훅으로 갈아끼운다. 그래서 화면에 흩어 두지 않고 여기 모았다.
 *
 * ## 무작위를 쓰지 않는다
 *
 * `Math.random()`이면 시트를 다시 열 때마다 좋아요 수가 바뀌어서 **버그처럼 보인다.**
 * `recordId`로 정해 두면 같은 기록은 항상 같은 값이라, 목업인 걸 몰라도 이상하지 않다.
 *
 * ## 참고 — 챌린짓의 좋아요는 목업이 아니다
 *
 * `features/challenge`의 리뷰 좋아요는 `ReviewLike` + `POST /reviews/{id}/likes`로
 * **실제로 동작한다.** 그쪽 코드를 이 파일의 선례로 삼지 말 것
 */

export interface MockComment {
    id: number
    author: string
    /** 사람 색을 정하는 값. Avatar의 colorKey에 그대로 넘긴다 */
    userId: number
    text: string
    /** `3시간 전` 같은 이미 만들어진 문구. 목업이라 계산하지 않는다 */
    when: string
}

/** 댓글 입력 길이 제한. 목업이지만 BE가 생겨도 이 값을 쓸 수 있게 여기 둔다 */
export const COMMENT_MAX = 200

const NAMES = ['민지', '수빈', '현우', '지호', '예린', '태윤']

const LINES = [
    '이거 어디서 먹은 거야? 나도 가고 싶다',
    '색깔부터 맛있어 보이네',
    '오늘 저녁 이걸로 정했다',
    '이 조합 진짜 좋아하는데',
    '사진 잘 찍었다 ㅋㅋ',
    '나도 어제 이거 먹었어!',
    '보기만 해도 배고파지네',
]

const WHENS = ['방금', '12분 전', '1시간 전', '3시간 전', '어제']

/** 기록마다 고정된 좋아요 수. 0도 나와야 "아직 없음"을 눈으로 볼 수 있다 */
export function mockLikeCount(recordId: number): number {
    return recordId % 7
}

/** 내가 이미 눌렀는지. 절반쯤 눌린 상태로 두면 두 모양을 다 확인할 수 있다 */
export function mockLikedByMe(recordId: number): boolean {
    return recordId % 3 === 0
}

/** 기록마다 고정된 댓글. 0~4개 */
export function mockComments(recordId: number): MockComment[] {
    const count = recordId % 5
    return Array.from({ length: count }, (_, index) => {
        const seed = recordId + index * 3
        return {
            id: seed,
            author: NAMES[seed % NAMES.length],
            userId: seed,
            text: LINES[seed % LINES.length],
            when: WHENS[index % WHENS.length],
        }
    })
}
