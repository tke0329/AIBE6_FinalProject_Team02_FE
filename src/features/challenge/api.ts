import { apiFetch } from '@/shared/lib/api'

export type PeriodType = 'PERMANENT' | 'LIMITED'

export interface CreateSlotInput {
    foodName: string
    placeName?: string | null
    lat?: number | null
    lng?: number | null
    imageKey?: string | null // 개설자가 등록한 목표 음식 사진(S3 key)
    storeName?: string | null // 가게명
    description?: string | null // 설명/팁(선택)
}

export interface CreateChallengePayload {
    name: string
    description?: string | null
    imageKey?: string | null // 대표 이미지(S3 key, 선택)
    periodType: PeriodType
    startsAt?: string | null // ISO, null이면 지금부터
    endsAt?: string | null // LIMITED면 필수
    rewardBadgeId?: number | null
    slots: CreateSlotInput[]
}

export interface CreateChallengeResult {
    challengeId: number
    remainingTickets: number
}

/** 이번 달 남은 개설권 */
export function fetchCreationTickets() {
    return apiFetch<{ remaining: number }>('/api/v1/challenges/creation-tickets')
}

/** 챌린지 개설 */
export function createChallenge(payload: CreateChallengePayload) {
    return apiFetch<CreateChallengeResult>('/api/v1/challenges', {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}
export interface ChallengeSummary {
    id: number
    name: string
    description: string | null
    periodType: PeriodType
    startsAt: string
    endsAt: string | null
    participantCount: number
    totalSlots: number // 전체 목표 수 (내 챌린짓 진행도용, 탐색은 0)
    unlockedCount: number // 내가 해금한 수 (내 챌린짓 진행도용, 탐색은 0)
    rankScore: number | null // 현재 정렬 지표값(최근 7일 조회/참여/해금). 최신순·완료면 null
    joined: boolean // 요청 유저의 참여 여부(탐색 목록 참여중 표시)
    imageUrl: string | null // 대표 이미지(프리사인 URL)
}

// 탐색 정렬 기준. 랭킹 3종은 최근 7일 기준
export type ChallengeSort = 'LATEST' | 'VIEWS' | 'PARTICIPANTS' | 'UNLOCKS'

/** 목록 페이지 응답 (BE PageResponse<T>와 대응) */
export interface PageResponse<T> {
    content: T[]
    page: number
    size: number
    totalElements: number
    totalPages: number
    hasNext: boolean
}

/** 챌린지 탐색 (진행중/완료 · 정렬 · 페이지) */
export function fetchChallenges(
    status: 'ONGOING' | 'FINISHED' = 'ONGOING',
    sort: ChallengeSort = 'LATEST',
    page = 0,
    size = 10,
) {
    const q = new URLSearchParams({
        status,
        sort,
        page: String(page),
        size: String(size),
    })
    return apiFetch<PageResponse<ChallengeSummary>>(`/api/v1/challenges?${q.toString()}`)
}

/** 챌린지 이름 검색 (무한스크롤 — 탐색 목록과 동일한 페이지 구조) */
export function searchChallenges(keyword: string, page = 0, size = 10) {
    const q = new URLSearchParams({
        keyword,
        page: String(page),
        size: String(size),
    })
    return apiFetch<PageResponse<ChallengeSummary>>(`/api/v1/challenges/search?${q.toString()}`)
}

export type MyChallengeRelation = 'CREATED' | 'JOINED' | 'COMPLETED'

/** 내 챌린지 (개설한 / 참여 중 / 완료한) */
export function fetchMyChallenges(relation: MyChallengeRelation) {
    return apiFetch<ChallengeSummary[]>(`/api/v1/challenges/mine?relation=${relation}`)
}

export interface ChallengeSlotDetail {
    id: number
    foodName: string
    placeName: string | null
    slotOrder: number
    unlocked: boolean
    imageUrl: string | null // 개설자가 등록한 목표 사진(프리사인 URL). 미해금이면 흑백 표시
    myImageUrl: string | null // 내가 인증한 사진(해금 시). 없으면 null
    unlockedAt: string | null // 내가 인증한 시각. 없으면 null
    storeName: string | null // 가게명
    description: string | null // 설명/팁
}

export interface ChallengeDetailData {
    id: number
    name: string
    description: string | null
    periodType: PeriodType
    startsAt: string
    endsAt: string | null
    rewardBadgeId: number | null
    participantCount: number
    joined: boolean
    completed: boolean
    imageUrl: string | null // 대표 이미지(프리사인 URL)
    slots: ChallengeSlotDetail[]
}

/** 챌린지 상세 */
export function fetchChallengeDetail(id: string | number) {
    return apiFetch<ChallengeDetailData>(`/api/v1/challenges/${id}`)
}

/** 챌린지 참여 */
export function joinChallenge(id: string | number) {
    return apiFetch<{ participantId: number }>(`/api/v1/challenges/${id}/participants`, {
        method: 'POST',
    })
}

/** 챌린지 포기(나가기) — 내 참여·인증 기록 삭제 */
export function leaveChallenge(id: string | number) {
    return apiFetch<void>(`/api/v1/challenges/${id}/participants`, {
        method: 'DELETE',
    })
}

export interface UnlockResult {
    unlockedCount: number
    totalSlots: number
    completed: boolean
}

/** 슬롯 인증(해금). imageKey는 사전에 S3에 올린 인증 사진 key. */
export function unlockSlot(
    id: string | number,
    slotId: string | number,
    imageKey: string,
    lat: number | null = null, // 위치 인증 챌린짓면 현재 위치
    lng: number | null = null,
) {
    return apiFetch<UnlockResult>(`/api/v1/challenges/${id}/unlocks`, {
        method: 'POST',
        body: JSON.stringify({ slotId: Number(slotId), imageKey, lat, lng }),
    })
}

export interface RewardPreset {
    code: string
    name: string
}

/** 보상 프리셋 목록 */
export function fetchRewardPresets() {
    return apiFetch<RewardPreset[]>('/api/v1/challenges/reward-badges/presets')
}

/** 보상 뱃지 생성 */
export function createRewardBadge(payload: { name: string; presetCode?: string | null; imageKey?: string | null }) {
    return apiFetch<{ badgeId: number }>('/api/v1/challenges/reward-badges', {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export interface RewardBadgeInfo {
    id: number
    name: string
    code: string | null
    imageUrl: string | null // 제작=프리사인 URL, 프리셋=null(code로 매핑)
}

/** 보상 뱃지 표시 정보(상세 미리보기·완료 팝업) */
export function fetchRewardBadge(badgeId: number | string) {
    return apiFetch<RewardBadgeInfo>(`/api/v1/challenges/reward-badges/${badgeId}`)
}

/** 리뷰 작성자의 대표 뱃지 표시 정보(서버) */
export interface ReviewerBadge {
    name: string
    code: string | null
    imageUrl: string | null
}

export interface Review {
    id: number
    reviewerId: number
    reviewerNickname: string | null
    reviewerProfileImageUrl: string | null
    reviewerEquippedBadge: ReviewerBadge | null
    content: string | null
    rating: number | null
    likeCount: number
    likedByMe: boolean // 내가 좋아요 눌렀는지
    mine: boolean // 내가 쓴 리뷰인지(수정/삭제 노출)
    createdAt: string
    updatedAt: string | null
}

export interface ReviewWritePayload {
    content?: string | null
    rating?: number | null
}

/** 음식 리뷰 목록(해당 슬롯) */
export function fetchFoodReviews(challengeId: string | number, slotId: string | number) {
    return apiFetch<Review[]>(`/api/v1/challenges/${challengeId}/slots/${slotId}/reviews`)
}

/** 음식 리뷰 작성 — 해당 슬롯 해금 후 */
export function writeFoodReview(challengeId: string | number, slotId: string | number, payload: ReviewWritePayload) {
    return apiFetch<{ reviewId: number }>(`/api/v1/challenges/${challengeId}/slots/${slotId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ content: payload.content ?? null, rating: payload.rating ?? null }),
    })
}

/** 챌린지 리뷰 목록 */
export function fetchChallengeReviews(challengeId: string | number) {
    return apiFetch<Review[]>(`/api/v1/challenges/${challengeId}/reviews`)
}

/** 챌린지 리뷰 작성 — 챌린지 완료 후 */
export function writeChallengeReview(challengeId: string | number, payload: ReviewWritePayload) {
    return apiFetch<{ reviewId: number }>(`/api/v1/challenges/${challengeId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ content: payload.content ?? null, rating: payload.rating ?? null }),
    })
}

/** 리뷰 수정 — 작성자 본인 */
export function editReview(reviewId: string | number, payload: ReviewWritePayload) {
    return apiFetch<void>(`/api/v1/challenges/reviews/${reviewId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content: payload.content ?? null, rating: payload.rating ?? null }),
    })
}

/** 리뷰 삭제 — 작성자 본인 */
export function deleteReview(reviewId: string | number) {
    return apiFetch<void>(`/api/v1/challenges/reviews/${reviewId}`, {
        method: 'DELETE',
    })
}

/** 리뷰 좋아요 토글 */
export function toggleReviewLike(reviewId: string | number) {
    return apiFetch<{ liked: boolean; likeCount: number }>(`/api/v1/challenges/reviews/${reviewId}/likes`, {
        method: 'POST',
    })
}
