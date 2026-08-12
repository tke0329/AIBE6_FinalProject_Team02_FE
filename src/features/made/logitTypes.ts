/** BE MadeDexSlot 상수와 맞춘다 — 넘기면 서버가 막는다 */
export const SLOT_NAME_MAX = 20
export const MIN_SLOTS = 1
export const MAX_SLOTS = 6

/** BE MadeDexRecord 상수. 기본 도감의 5장과 공유하지 않는다 (DESIGN §6) */
export const RECORD_MIN_PHOTOS = 1
export const RECORD_MAX_PHOTOS = 8
export const CAPTION_MAX = 100

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
    thumbnailCropX: number
    thumbnailCropY: number
    recordIds: number[]
    /** 대표 사진을 낸 기록의 먹은 시각. 빈 카드이거나 적지 않았으면 null */
    loggedAt: string | null
}

export interface LogitFeedSlot {
    slotId: number
    name: string
    /** 숨긴 슬롯은 그날 기록이 있을 때만 내려온다 — 읽기 전용으로 그린다 */
    hidden: boolean
    cards: LogitFeedCard[]
}

export interface LogitFeed {
    /** 조회한 날 `YYYY-MM-DD` */
    date: string
    /** 서버(Asia/Seoul)의 오늘. 조회한 날과 별개라 과거를 봐도 오늘을 잃지 않는다 */
    today: string
    slots: LogitFeedSlot[]
}

interface LogitRecordFields {
    slotId: number
    /** `HH:mm`. 적지 않으면 null이고, 화면에도 시각을 띄우지 않는다 */
    loggedTime: string | null
}

/** 글은 사진마다 붙는다. 기록 전체 메모는 없다 */
export interface LogitPhotoInput {
    imageKey: string
    caption: string | null
    cropX: number | null
    cropY: number | null
}

export interface LogitRecordCreateRequest extends LogitRecordFields {
    /**
     * 등록은 오늘만 된다. 이 값은 "언제 걸로 남길지" 고르는 게 아니라
     * 클라이언트가 지금 며칠이라 믿는지 서버에 확인받는 값이다.
     * 어긋나면 서버가 MADE_DEX_RECORD_PAST_DATE로 거절한다.
     */
    loggedOn: string
    photos: LogitPhotoInput[]
}

/**
 * 유지할 기존 사진과 새로 올린 것을 나눠 보낸다. 최종 순서는 keep 다음에 new.
 * 날짜는 보내지 않는다 — 기록이 놓인 날은 만든 뒤 바뀌지 않는다.
 */
export interface LogitRecordUpdateRequest extends LogitRecordFields {
    keepPhotos: Array<{ photoId: number; caption: string | null; cropX: number | null; cropY: number | null }>
    newPhotos: LogitPhotoInput[]
}

// --- 하루 카드 ---

export interface DayCardAuthor {
    userId: number
    nickname: string | null
    profileImageUrl: string | null
    me: boolean
}

/** 아이템에 담긴 사진 한 장 */
export interface DayCardPhoto {
    photoId: number
    caption: string | null
    imageUrl: string | null
    cropX: number
    cropY: number
}

/** 카드에 놓이는 아이템 = 기록 하나
 * 선반에는 대표(첫 장)만 놓고 장수를 숫자로 표시함
 * 애니메이션은 photos를 전부 날리므로 나머지 사진도 함께 옴
 * photos는 비지 않음 — 대표는 photos[0] */
export interface DayCardItem {
    recordId: number
    author: DayCardAuthor
    photos: DayCardPhoto[]
}

/** 하루 카드 한 층 = 끼니
 * items는 가입 순으로 정렬 */
export interface DayCardSlot {
    slotId: number
    name: string
    sortOrder: number
    hidden: boolean
    items: DayCardItem[]
}

export interface DayCardParticipant {
    userId: number
    nickname: string | null
    profileImageUrl: string | null
    me: boolean
    /** 담은 사진 수 */
    count: number
    /** 사진에 붙인 글(있는 것만) */
    captions: string[]
}

export interface DayCardStats {
    foodCount: number
    participantCount: number
    recordedSlotCount: number
}

export interface LogitDayCard {
    date: string
    /** 로그잇 참여자 전원, 가입 순 */
    members: DayCardAuthor[]
    slots: DayCardSlot[]
    participants: DayCardParticipant[]
    stats: DayCardStats
}

/** 캘린더 마커. daysWithRecords는 그 달에 기록이 있는 날(일) */
export interface DayCardCalendar {
    year: number
    month: number
    daysWithRecords: number[]
}

export function authorName(author: DayCardAuthor | DayCardParticipant): string {
    return author.nickname?.trim() || '이름 없는 참여자'
}

export interface LogitRecordPhoto {
    photoId: number
    /** 서명된 조회 URL. 원본 S3 key는 서버가 내보내지 않는다 */
    url: string
    caption: string | null
    cropX: number
    cropY: number
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
    /** 먹은 시각. 적지 않았으면 null */
    loggedAt: string | null
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

/** `2026-08-07T16:00:00` → `16:00`. 서버가 이미 한국 시각으로 주므로 변환하지 않는다 */
export function timeLabel(loggedAt: string): string {
    return loggedAt.slice(11, 16)
}

/** `16:00` → `오후 4:00`. 고르는 화면에서는 24시간 표기가 낯설다 */
export function timeText(time: string): string {
    const [hour, minute] = time.split(':').map(Number)
    const hour12 = hour % 12 === 0 ? 12 : hour % 12
    return `${hour >= 12 ? '오후' : '오전'} ${hour12}:${String(minute).padStart(2, '0')}`
}

const LABEL = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

/** today는 서버가 준 기준일이다 */
export function dateLabel(date: string, today: string): string {
    if (date === today) return '오늘'
    if (date === shiftDate(today, -1)) return '어제'
    return LABEL.format(parseDate(date))
}
