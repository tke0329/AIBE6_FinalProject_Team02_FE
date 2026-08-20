import { apiFetch } from '@/shared/lib/api'

/** GET /api/v1/my/profile 응답 */
export interface MyProfile {
    nickname: string
    nicknameChangeable: boolean // 지금 닉네임 변경 가능한지 (1개월 제한 통과 여부)
    nicknameChangeableAt: string | null // 다음 변경 가능 시각. null이면 즉시 가능
    profileImageUrl: string | null // 표시용 이미지 URL. null이면 사진 없음(닉네임 첫 글자)
}

// PATCH /api/v1/my/profile-image — 프로필 사진 설정 (업로드된 S3 key 저장)
export function patchProfileImage(key: string): Promise<void> {
    return apiFetch<void>('/api/v1/my/profile-image', {
        method: 'PATCH',
        body: JSON.stringify({ key }),
    })
}

// DELETE /api/v1/my/profile-image — 프로필 사진 제거 (닉네임 첫 글자로 복귀)
export function removeProfileImage(): Promise<void> {
    return apiFetch<void>('/api/v1/my/profile-image', { method: 'DELETE' })
}

// POST /api/v1/my/nickname — 최초 닉네임 세팅 (온보딩 전)
// 규칙: 2~8자, 한글/영문/숫자/밑줄
export function postInitialNickname(nickname: string): Promise<void> {
    return apiFetch<void>('/api/v1/my/nickname', {
        method: 'POST',
        body: JSON.stringify({ nickname }),
    })
}

// GET /api/v1/my/profile — 마이페이지 프로필(닉네임 + 변경 가능 여부/가능 시각)
export function getMyProfile(): Promise<MyProfile> {
    return apiFetch<MyProfile>('/api/v1/my/profile')
}

/**
 * GET /api/v1/my/nickname/availability — 남이 쓰고 있는지만 답한다.
 *
 * 형식 검사는 담기지 않는다 — 프론트가 같은 규칙(`NICKNAME_RE`)을 들고 있어 즉시 알려줄 수 있고,
 * 형식이 어긋난 값을 보내면 서버가 400을 준다. 그래서 **형식을 통과한 값만** 물어봐야 한다.
 *
 * 지금 내 닉네임은 `available: true`로 온다 — 변경 API가 같은 값을 no-op으로 통과시키기 때문
 */
export function checkNicknameAvailability(nickname: string): Promise<{ available: boolean }> {
    return apiFetch<{ available: boolean }>(`/api/v1/my/nickname/availability?nickname=${encodeURIComponent(nickname)}`)
}

// PATCH /api/v1/my/nickname — 닉네임 변경 (1개월 1회)
// 너무 이르면 NICKNAME_CHANGE_TOO_SOON, 중복이면 NICKNAME_DUPLICATED 메시지가 던져진다.
export function patchNickname(nickname: string): Promise<void> {
    return apiFetch<void>('/api/v1/my/nickname', {
        method: 'PATCH',
        body: JSON.stringify({ nickname }),
    })
}

// DELETE /api/v1/my — 회원 탈퇴(소프트 삭제)
// 세션 정리는 호출부에서 이어서 logout()으로 처리
export function withdrawAccount(): Promise<void> {
    return apiFetch<void>('/api/v1/my', { method: 'DELETE' })
}

// GET /api/v1/my/badges 항목 (BE MyBadgeResponse와 일치)
export interface MyBadge {
    id: number
    name: string
    code: string | null // 시스템 뱃지 식별자 → public 에셋 매핑 (챌린짓 커스텀은 null)
    imageUrl: string | null // 챌린짓 커스텀 업로드(S3). 시스템 뱃지는 null → code로 렌더
    description: string | null // 획득 조건 문구
    acquiredAt: string // ISO
    equipped: boolean // 현재 대표 뱃지 여부
}

// GET /api/v1/my/badges — 내가 획득한 뱃지 목록(장착 표시 포함)
export function getMyBadges(): Promise<MyBadge[]> {
    return apiFetch<MyBadge[]>('/api/v1/my/badges')
}

/**
 * GET /api/v1/users/me/reviews 항목 (BE `MyReviewResponseDTO`와 일치).
 *
 * 대상별 리뷰(`features/challenge/api.ts`의 `Review`)와 다른 타입이다 —
 * 작성자 정보가 없고(언제나 나) **대상 정보가 있다.** 목록에서는 어느 챌린짓의
 * 무엇에 남긴 리뷰인지가 먼저 보여야 하고, 그건 대상별 응답에 담겨 있지 않다
 */
export interface MyReview {
    id: number
    reviewType: 'FOOD' | 'CHALLENGE'
    challengeId: number
    challengeName: string
    slotId: number | null // 챌린짓 리뷰면 null
    foodName: string | null // 챌린짓 리뷰면 null
    content: string | null // 별점만 남길 수도 있어 null 가능
    rating: number | null // 1~5, 내용만 남기면 null
    likeCount: number
    createdAt: string // ISO
    updatedAt: string // ISO
}

// GET /api/v1/users/me/reviews — 내가 쓴 리뷰(최신순). 삭제된 챌린짓 것은 서버가 걸러 준다
export function getMyReviews(): Promise<MyReview[]> {
    return apiFetch<MyReview[]>('/api/v1/users/me/reviews')
}

/**
 * GET /api/v1/users/me/liked-reviews 항목 (BE `LikedReviewResponseDTO`와 일치).
 *
 * `MyReview`와 갈리는 곳 두 개 — **작성자가 남일 수 있어** 작성자 정보가 있고,
 * **정렬 기준이 `likedAt`**(내가 누른 시각)이다. 오래전 리뷰를 오늘 좋아요하면 맨 위다
 */
export interface LikedReview {
    id: number
    reviewType: 'FOOD' | 'CHALLENGE'
    challengeId: number
    challengeName: string
    slotId: number | null // 챌린짓 리뷰면 null
    foodName: string | null // 챌린짓 리뷰면 null
    reviewerId: number
    reviewerNickname: string | null
    reviewerProfileImageUrl: string | null
    content: string | null
    rating: number | null
    likeCount: number
    createdAt: string // 리뷰가 쓰인 시각
    likedAt: string // 내가 좋아요한 시각 (목록 정렬 기준)
}

// GET /api/v1/users/me/liked-reviews — 좋아요한 리뷰(내가 누른 순). 챌린짓·음식 리뷰 모두
export function getLikedReviews(): Promise<LikedReview[]> {
    return apiFetch<LikedReview[]>('/api/v1/users/me/liked-reviews')
}

/**
 * GET /api/v1/users/me/logit-comments 항목 (BE `MyLogitCommentResponseDTO`와 일치).
 *
 * 리뷰와 달리 별점이 없다 — 로그잇 댓글은 평가가 아니라 대화다.
 * 삭제된 기록·삭제된 로그잇·내가 나간 로그잇의 것은 서버가 걸러 준다
 */
export interface MyLogitComment {
    commentId: number
    madeDexId: number
    madeDexName: string
    recordId: number
    loggedOn: string // YYYY-MM-DD, 기록의 날짜
    slotName: string
    content: string
    likeCount: number
    createdAt: string // ISO
    updatedAt: string | null // 고친 적 없으면 null
}

// GET /api/v1/users/me/logit-comments — 내가 쓴 로그잇 댓글(최신순)
export function getMyLogitComments(): Promise<MyLogitComment[]> {
    return apiFetch<MyLogitComment[]>('/api/v1/users/me/logit-comments')
}

/**
 * GET /api/v1/users/me/liked-logit-records 항목 (BE `LikedLogitRecordResponseDTO`와 일치).
 *
 * 기록에는 본문 글이 없다 — **사진이 본문**이라 썸네일과 크롭 값이 온다.
 * 사진 없이 올린 기록은 `thumbnailUrl`이 null이고 크롭은 기본값(50)이 온다.
 *
 * 정렬 기준은 `likedAt`(내가 누른 시각)이다
 */
export interface LikedLogitRecord {
    recordId: number
    madeDexId: number
    madeDexName: string
    loggedOn: string // YYYY-MM-DD
    slotName: string
    authorId: number
    authorNickname: string | null
    authorProfileImageUrl: string | null
    thumbnailUrl: string | null
    thumbnailCropX: number // 0~100 (%). object-position에 그대로 넣는다
    thumbnailCropY: number
    likeCount: number
    likedAt: string // 내가 좋아요한 시각 (목록 정렬 기준)
}

// GET /api/v1/users/me/liked-logit-records — 좋아요한 로그잇 기록(내가 누른 순)
export function getLikedLogitRecords(): Promise<LikedLogitRecord[]> {
    return apiFetch<LikedLogitRecord[]>('/api/v1/users/me/liked-logit-records')
}

// PATCH /api/v1/my/badges/equip — 대표 뱃지 장착/해제 (badgeId=null이면 해제)
export function equipBadge(badgeId: number | null): Promise<void> {
    return apiFetch<void>('/api/v1/my/badges/equip', {
        method: 'PATCH',
        body: JSON.stringify({ badgeId }),
    })
}
