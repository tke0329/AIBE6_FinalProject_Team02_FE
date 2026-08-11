import { DEX_ENTRIES, DexEntry, normalizeCategory } from '@/shared/data/dex'
import { apiFetch } from '@/shared/lib/api'
import { getLocalDexIllustrationUrl } from '@/shared/lib/dexIllustrations'

interface BasicDexResponse {
    id: number
    name: string
    category: string
    illustrationUrl: string | null
}

interface MyBasicDexResponse {
    id: number
    name: string
    category: string
    illustrationUrl: string | null
    unlocked: boolean
    rank: number
    firstCollectedAt: string | null
    cardCount: number
    /** 최근 첫 해금 — New 스티커. 서버 시각으로 판정된 값이다 */
    recentlyUnlocked: boolean
    /** 운영진 검토 대기 — 검토대기 스티커 */
    awaitingReview: boolean
}

const DEFAULT_FOOD_ICON = '🍽️'

/** 목록은 칸이 비면 안 되므로 모르는 카테고리도 어딘가에는 넣는다 */
const FALLBACK_CATEGORY = '밥·죽·한 그릇'

// 성공 응답을 세션 동안 재사용해 재요청을 막고, 동시 호출도 하나의 요청으로 묶는다.
// 실패 시에는 캐시하지 않아 다음 호출에서 다시 시도할 수 있게 한다.
let cachedEntries: Promise<DexEntry[]> | null = null

export async function fetchBasicDexEntries(): Promise<DexEntry[]> {
    if (!cachedEntries) {
        cachedEntries = apiFetch<BasicDexResponse[]>('/api/v1/dex/basic')
            .then((items) =>
                items.map((item) => {
                    const local = DEX_ENTRIES.find((entry) => entry.id === item.id || entry.name === item.name)

                    const entry = {
                        ...local,
                        id: item.id,
                        name: item.name,
                        emoji: local?.emoji ?? DEFAULT_FOOD_ICON,
                        category: normalizeCategory(item.category) ?? FALLBACK_CATEGORY,
                        collected: local?.collected ?? false,
                    }
                    return {
                        ...entry,
                        illustrationUrl:
                            item.illustrationUrl ?? local?.illustrationUrl ?? getLocalDexIllustrationUrl(entry),
                    }
                }),
            )
            .catch((error) => {
                cachedEntries = null
                throw error
            })
    }
    return cachedEntries
}

// "2026-05-14T10:23:45" 형태의 ISO datetime을 화면 표기용 "2026.05.14"로 변환한다.
function formatServerDate(value: string): string {
    return value.slice(0, 10).replaceAll('-', '.')
}

interface MyBasicDexDetailCardResponse {
    id: number
    /** 대표 사진이 0번째, 나머지는 등록 순서(sortOrder) */
    photos: string[]
    memo: string | null
    locationName: string | null
    collectedAt: string
    verificationStatus: string
}

interface MyBasicDexDetailResponse {
    id: number
    name: string
    category: string
    illustrationUrl: string | null
    unlocked: boolean
    rank: number
    firstCollectedAt: string | null
    cards: MyBasicDexDetailCardResponse[]
}

/**
 * 로그인한 유저 기준 도감 조회. 200칸 전체를 내려주되 유저가 실제로 등록한
 * 항목만 unlocked=true로 표시되므로, 그대로 `collected`에 반영하면 된다.
 * 로그인 세션에 종속된 데이터라 `fetchBasicDexEntries`와 달리 모듈 캐시를 두지 않는다.
 */
export async function fetchMyBasicDexEntries(): Promise<DexEntry[]> {
    const items = await apiFetch<MyBasicDexResponse[]>('/api/v1/dex/me/basic')
    return items.map((item) => {
        const local = DEX_ENTRIES.find((entry) => entry.id === item.id || entry.name === item.name)

        const entry = {
            id: item.id,
            name: item.name,
            emoji: local?.emoji ?? DEFAULT_FOOD_ICON,
            category: normalizeCategory(item.category) ?? FALLBACK_CATEGORY,
            collected: item.unlocked,
            stars: item.unlocked ? item.rank : undefined,
            firstDate: item.firstCollectedAt ? formatServerDate(item.firstCollectedAt) : undefined,
            recentlyUnlocked: item.recentlyUnlocked,
            awaitingReview: item.awaitingReview,
        }
        return {
            ...entry,
            illustrationUrl: item.illustrationUrl ?? local?.illustrationUrl ?? getLocalDexIllustrationUrl(entry),
        }
    })
}

/**
 * New 스티커를 봤다고 서버에 알린다. 상세를 여는 순간 호출
 */
export async function markNewBadgeSeen(slotId: number): Promise<void> {
    await apiFetch<void>(`/api/v1/dex/me/basic/${slotId}/new-badge-seen`, { method: 'PATCH' })
}

/**
 * 도감 카드 상세(등록 사진/메모/위치 등)까지 포함한 단일 슬롯 조회.
 * 목록(`/me/basic`)엔 카드 내용이 없어 상세 화면 진입 시 슬롯 단위로 따로 불러온다.
 */
export async function fetchMyBasicDexDetail(slotId: number): Promise<DexEntry> {
    const item = await apiFetch<MyBasicDexDetailResponse>(`/api/v1/dex/me/basic/${slotId}`)
    const local = DEX_ENTRIES.find((entry) => entry.id === item.id || entry.name === item.name)

    const entry = {
        id: item.id,
        name: item.name,
        emoji: local?.emoji ?? DEFAULT_FOOD_ICON,
        category: normalizeCategory(item.category) ?? FALLBACK_CATEGORY,
        collected: item.unlocked,
        stars: item.unlocked ? item.rank : undefined,
        firstDate: item.firstCollectedAt ? formatServerDate(item.firstCollectedAt) : undefined,
        cards: item.cards.map((card) => ({
            photos: card.photos.length ? card.photos : [local?.emoji ?? DEFAULT_FOOD_ICON],
            memo: card.memo ?? undefined,
            location: card.locationName ?? undefined,
            date: formatServerDate(card.collectedAt),
        })),
    }
    return {
        ...entry,
        illustrationUrl: item.illustrationUrl ?? local?.illustrationUrl ?? getLocalDexIllustrationUrl(entry),
    }
}
