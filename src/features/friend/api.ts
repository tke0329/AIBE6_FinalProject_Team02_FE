import type { ChallengeSummary, MyChallengeRelation } from '@/features/challenge/api'
import { apiFetch } from '@/shared/lib/api'

export type RelationStatus = 'SELF' | 'NONE' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'FRIEND'

export interface EquippedBadgeView {
    name: string
    code: string | null
    imageUrl: string | null
}
export interface UserBrief {
    userId: number
    nickname: string
    profileImageUrl: string | null
    equippedBadge: EquippedBadgeView | null
}
export interface UserSearchResult {
    user: UserBrief
    relationStatus: RelationStatus
}
export interface ReceivedRequest {
    requestId: number
    user: UserBrief
}

/** 닉네임 검색 */
export function searchUsers(nickname: string) {
    return apiFetch<UserSearchResult[]>(`/api/v1/users/search?nickname=${encodeURIComponent(nickname)}`)
}
/** 친구 요청 */
export function sendFriendRequest(targetUserId: number) {
    return apiFetch<void>('/api/v1/friends/requests', {
        method: 'POST',
        body: JSON.stringify({ targetUserId }),
    })
}
/** 받은/보낸 요청 목록 */
export function fetchFriendRequests(type: 'received' | 'sent' = 'received') {
    return apiFetch<ReceivedRequest[]>(`/api/v1/friends/requests?type=${type}`)
}
/** 요청 수락 */
export function acceptFriendRequest(requestId: number) {
    return apiFetch<void>(`/api/v1/friends/requests/${requestId}/accept`, {
        method: 'POST',
    })
}
/** 요청 거절/취소 */
export function deleteFriendRequest(requestId: number) {
    return apiFetch<void>(`/api/v1/friends/requests/${requestId}`, {
        method: 'DELETE',
    })
}
/** 내 친구 목록 */
export function fetchFriends() {
    return apiFetch<UserBrief[]>('/api/v1/friends')
}
/** 친구 삭제 */
export function removeFriend(otherUserId: number) {
    return apiFetch<void>(`/api/v1/friends/${otherUserId}`, { method: 'DELETE' })
}

export interface PublicProfile {
    user: UserBrief
    relationStatus: RelationStatus
}
/** 남의 기본도감 항목 */
export interface UserBasicDexItem {
    id: number
    name: string
    category: string
    illustrationUrl: string | null
    unlocked: boolean
    rank: number
    firstCollectedAt: string | null
    cardCount: number
}

/** 공개 프로필 */
export function fetchPublicProfile(id: number | 'me') {
    return apiFetch<PublicProfile>(`/api/v1/users/${id}/profile`)
}
/** 다른사람의 기본도감 */
export function fetchUserBasicDex(id: number | 'me') {
    return apiFetch<UserBasicDexItem[]>(`/api/v1/users/${id}/basic-dex`)
}
/** 다른사람의 챌린지도감 */
export function fetchUserChallenges(id: number | 'me', relation: MyChallengeRelation) {
    return apiFetch<ChallengeSummary[]>(`/api/v1/users/${id}/challenges?relation=${relation}`)
}
