export type FoodCategory =
    | '밥·죽·한 그릇'
    | '면'
    | '국·탕·찌개'
    | '고기 구이·볶음'
    | '튀김·치킨·까스'
    | '해산물·회'
    | '분식·길거리'
    | '빵·버거·피자·브런치'
    | '디저트·음료'

export interface DexCard {
    photos: string[]
    memo?: string
    location?: string
    date: string
    tags?: string[]
}

export interface DexEntry {
    id: number
    name: string
    emoji: string
    category: FoodCategory
    illustrationUrl?: string
    collected: boolean
    stars?: number
    firstDate?: string
    cards?: DexCard[]
    /** 최근에 처음 열린 칸 — 그리드에 New 스티커가 붙는다. 판정은 서버가 한다 */
    recentlyUnlocked?: boolean
    /** 운영진 검토를 기다리는 칸 — New와 같은 자리에 검토대기 스티커가 붙는다 */
    awaitingReview?: boolean
}

/**
 * 서버 카테고리 표기 → 화면 표기
 */
const SERVER_CATEGORY_LABELS: Record<string, FoodCategory> = {
    '밥·죽·한그릇': '밥·죽·한 그릇',
    '밥·죽·한 그릇': '밥·죽·한 그릇',
    면: '면',
    '국·탕·찌개': '국·탕·찌개',
    '고기·구이·볶음': '고기 구이·볶음',
    '고기 구이·볶음': '고기 구이·볶음',
    '튀김·치킨·가스': '튀김·치킨·까스',
    '튀김·치킨·까스': '튀김·치킨·까스',
    '해산물·회': '해산물·회',
    '분식·길거리': '분식·길거리',
    '빵·버거·피자·브런치': '빵·버거·피자·브런치',
    '디저트·음료': '디저트·음료',
}

/**
 * 모르는 표기면 undefined. 목록 렌더는 기본값으로 메워도 되지만
 * 라우팅은 엉뚱한 탭으로 보내느니 전체 탭으로 두는 편이 낫다
 */
export function normalizeCategory(serverCategory: string): FoodCategory | undefined {
    return SERVER_CATEGORY_LABELS[serverCategory]
}

export const CATEGORY_META: Array<{
    category: FoodCategory
    shortLabel: string
    dotClass: string
    total: number
}> = [
    { category: '밥·죽·한 그릇', shortLabel: '밥·죽', dotClass: 'bg-amber-500', total: 25 },
    { category: '면', shortLabel: '면', dotClass: 'bg-orange-500', total: 25 },
    { category: '국·탕·찌개', shortLabel: '국·탕', dotClass: 'bg-blue-600', total: 30 },
    { category: '고기 구이·볶음', shortLabel: '고기', dotClass: 'bg-red-500', total: 25 },
    { category: '튀김·치킨·까스', shortLabel: '튀김·치킨', dotClass: 'bg-orange-400', total: 15 },
    { category: '해산물·회', shortLabel: '해산물', dotClass: 'bg-teal-500', total: 25 },
    { category: '분식·길거리', shortLabel: '분식', dotClass: 'bg-rose-500', total: 20 },
    { category: '빵·버거·피자·브런치', shortLabel: '브런치', dotClass: 'bg-red-400', total: 20 },
    { category: '디저트·음료', shortLabel: '디저트', dotClass: 'bg-purple-500', total: 15 },
]

/** Representative menu slots from the CatchEat dex. */
export const DEX_ENTRIES: DexEntry[] = [
    {
        id: 1,
        name: '파스타',
        emoji: '🍝',
        category: '면',
        collected: true,
        stars: 2,
        firstDate: '2026.05.14',
        cards: [
            {
                photos: ['🍝', '🥖', '🍷'],
                memo: '트러플 크림이 최고였다',
                location: '성수동 A식당',
                date: '2026.05.14',
            },
            {
                photos: ['🍝', '🦪', '🍋', '🥗', '🍰'],
                memo: '봉골레도 괜찮음',
                location: '연남동 파스타집',
                date: '2026.06.21',
            },
        ],
    },
    {
        id: 2,
        name: '김치찌개',
        emoji: '🍲',
        category: '국·탕·찌개',
        collected: true,
        stars: 1,
        firstDate: '2026.05.20',
        cards: [
            {
                photos: ['🍲', '🍚'],
                memo: '든든한 백반',
                location: '을지로 노포',
                date: '2026.05.20',
            },
        ],
    },
    {
        id: 3,
        name: '초밥',
        emoji: '🍣',
        category: '해산물·회',
        collected: true,
        stars: 3,
        firstDate: '2026.05.02',
        cards: [
            {
                photos: ['🍣', '🍵'],
                memo: '친구와 먹은 오마카세',
                location: '연남동 스시집',
                date: '2026.05.02',
            },
            {
                photos: ['🍣', '🥢', '🍶'],
                memo: '제철 광어가 좋았다',
                location: '한남 스시',
                date: '2026.06.18',
            },
            {
                photos: ['🍣', '🦐', '🥣', '🍮'],
                memo: '세 번째 수집 완료!',
                location: '성수 스시바',
                date: '2026.07.02',
            },
        ],
    },
    { id: 4, name: '라면', emoji: '🍜', category: '면', collected: false },
    { id: 5, name: '떡볶이', emoji: '🍢', category: '분식·길거리', collected: false },
    { id: 6, name: '치킨', emoji: '🍗', category: '튀김·치킨·까스', collected: false },
    { id: 7, name: '햄버거', emoji: '🍔', category: '빵·버거·피자·브런치', collected: false },
    { id: 8, name: '피자', emoji: '🍕', category: '빵·버거·피자·브런치', collected: false },
    { id: 9, name: '만두', emoji: '🥟', category: '분식·길거리', collected: false },
    { id: 10, name: '호떡', emoji: '🥮', category: '분식·길거리', collected: false },
    { id: 11, name: '삼겹살', emoji: '🥓', category: '고기 구이·볶음', collected: false },
    { id: 12, name: '냉면', emoji: '🍲', category: '면', collected: false },
    { id: 13, name: '김밥', emoji: '🍙', category: '밥·죽·한 그릇', collected: false },
    { id: 14, name: '떡', emoji: '🍡', category: '디저트·음료', collected: false },
    { id: 15, name: '아이스크림', emoji: '🍦', category: '디저트·음료', collected: false },
    { id: 16, name: '칼국수', emoji: '🍜', category: '면', collected: false },
    { id: 17, name: '비빔밥', emoji: '🥘', category: '밥·죽·한 그릇', collected: false },
    { id: 18, name: '순대국', emoji: '🍲', category: '국·탕·찌개', collected: false },
    { id: 19, name: '새우튀김', emoji: '🍤', category: '해산물·회', collected: false },
    { id: 20, name: '토스트', emoji: '🥪', category: '빵·버거·피자·브런치', collected: false },
    { id: 21, name: '돈까스', emoji: '🥩', category: '튀김·치킨·까스', collected: false },
    { id: 22, name: '불고기', emoji: '🥘', category: '고기 구이·볶음', collected: false },
]

export const AI_CANDIDATES = [
    { id: 16, name: '칼국수', emoji: '🍜' },
    { id: 23, name: '잔치국수', emoji: '🍲' },
    { id: 24, name: '수제비', emoji: '🥣' },
]
