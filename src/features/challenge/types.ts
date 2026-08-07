/** 챌린지 도감 (§6) — 개설자가 지정한 목표 리스트를 기본 도감형으로 해금 */

export interface RewardBadge {
    emoji: string
    name: string
    /** 뱃지 배경 톤 (Tailwind 클래스) */
    tone: string
    customImage?: string
    /** 프리셋 code */
    code?: string
}

export interface ChallengeTarget {
    id: string
    name: string
    emoji?: string
    /** 상세 도감 표시용 목표 음식 사진 (미해금이면 흑백) */
    imageUrl?: string
    /** 개설 화면에서만 사용 — 업로드 전 로컬 파일 */
    file?: File | null
    /** 위치 인증 챌린지 — 목표 장소 */
    placeName?: string | null
    lat?: number | null
    lng?: number | null
    /** 상세 기록 뷰 — 내가 인증한 사진/시각 (해금 시) */
    myImageUrl?: string | null
    unlockedAt?: string | null
}

export interface ChallengeData {
    id: string
    title: string
    emoji: string
    tag: string
    dday: string
    participants: number
    /** 랭킹 탭 지표값(최근 7일 조회/참여/해금), 최신순이면 null */
    score?: number | null
    mine?: string
    progress?: number
    owner: string
    joined?: boolean
    completed?: boolean
    /** 기간 한정 챌린지가 종료됐는지(참여·등록 불가) */
    ended?: boolean
    isCreator?: boolean
    target?: number
    targetRestaurants?: ChallengeTarget[]
    completedTargetIds?: string[]
    rewardBadge?: RewardBadge
}
