/** BE MadeDexSlot 상수와 맞춘다 — 넘기면 서버가 막는다 */
export const SLOT_NAME_MAX = 20
export const MIN_SLOTS = 1
export const MAX_SLOTS = 6

/** BE MadeDexRecord 상수. 기본 도감의 5장과 공유하지 않는다 (DESIGN §6) */
export const RECORD_MIN_PHOTOS = 1
export const RECORD_MAX_PHOTOS = 8
export const FOOD_NAME_MAX = 100
export const MEMO_MAX = 100

export interface LogitSlot {
    slotId: number
    name: string
    sortOrder: number
    hidden: boolean
    /** 기록이 있으면 삭제가 아니라 숨김으로 처리된다 */
    hasRecords: boolean
}

/** 한 슬롯에서 한 사람이 남긴 것 전부를 카드 한 장으로 접은 것. recordCount가 0이면 점선 빈 카드다 */
export interface LogitFeedCard {
    userId: number
    nickname: string | null
    profileImageUrl: string | null
    me: boolean
    recordCount: number
    thumbnailUrl: string | null
    foodNames: string[]
    recordIds: number[]
}

export interface LogitFeedSlot {
    slotId: number
    name: string
    /** 숨긴 슬롯은 그날 기록이 있을 때만 내려온다 — 읽기 전용으로 그린다 */
    hidden: boolean
    cards: LogitFeedCard[]
}

export interface LogitFeed {
    /** 서버(Asia/Seoul) 기준일 `YYYY-MM-DD`. 클라이언트가 오늘을 계산하지 않는다 */
    date: string
    slots: LogitFeedSlot[]
}

export interface LogitRecordPhoto {
    photoId: number
    /** 서명된 조회 URL. 원본 S3 key는 서버가 내보내지 않는다 */
    url: string
}

export interface LogitRecordDetail {
    recordId: number
    slotId: number
    slotName: string
    loggedOn: string
    authorId: number
    authorNickname: string | null
    mine: boolean
    photos: LogitRecordPhoto[]
    foodNames: string[]
    memo: string | null
    locationName: string | null
    lat: number | null
    lng: number | null
    createdAt: string
}

/** 기록이 있어 지우지 못하고 숨긴 경우 hidden=true */
export interface SlotDeleteResult {
    hidden: boolean
}

export function cardName(card: LogitFeedCard): string {
    return card.nickname?.trim() || '이름 없는 참여자'
}

/**
 * `YYYY-MM-DD`를 그 지역의 자정으로 읽는다.
 * `new Date('2026-08-07')`은 UTC 자정이라 UTC-N 브라우저에서 하루 전으로 밀린다.
 */
export function parseDate(date: string): Date {
    const [year, month, day] = date.split('-').map(Number)
    return new Date(year, month - 1, day)
}

export function formatDate(value: Date): string {
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${value.getFullYear()}-${month}-${day}`
}

export function shiftDate(date: string, days: number): string {
    const moved = parseDate(date)
    moved.setDate(moved.getDate() + days)
    return formatDate(moved)
}

const LABEL = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

/** today는 서버가 준 기준일이다 */
export function dateLabel(date: string, today: string): string {
    if (date === today) return '오늘'
    if (date === shiftDate(today, -1)) return '어제'
    return LABEL.format(parseDate(date))
}
