import { apiFetch } from '@/shared/lib/api'

// BE domain/notification/entity/NotificationType.java 와 동일
export type NotificationType =
    | 'MADE_DEX_JOINED'
    | 'MADE_DEX_RECORD_CREATED'
    | 'MADE_DEX_RECORD_ADDED'
    | 'MADE_DEX_MEMBER_RECORD_CREATED'
    | 'FRIEND_CARD_REGISTERED'
    | 'MADE_DEX_COMMENT_ADDED'
    | 'MADE_DEX_COMMENT_LIKED'
    | 'MADE_DEX_RECORD_LIKED'
    | 'CHALLENGE_REVIEW_ADDED'
    | 'CHALLENGE_CARD_REVIEW_ADDED'
    | 'CHALLENGE_REVIEW_LIKED'
    | 'FRIEND_REQUEST_RECEIVED'
    | 'FRIEND_REQUEST_ACCEPT'
    | 'FRIEND_REQUEST_REJECT'
    | 'FOOD_REPORT_APPROVE'
    | 'FOOD_REPORT_REJECT'

/** GET /api/v1/notifications 응답 항목 (BE NotificationDTO와 일치) */
export interface NotificationItem {
    notificationId: number
    type: NotificationType
    actorId: number
    targetId: number | null
    read: boolean
    createdAt: string // ISO LocalDateTime
    actorNickname?: string | null
    targetName?: string | null
    message?: string | null
    challengeId?: number | null
    slotId?: number | null
    madeDexId?: number | null
    recordId?: number | null
    madeDexName?: string | null
}

/** BE가 실제로 내려주는 원본 모양 — 라우팅용 ID들은 payload 안에 들어있다 */
interface RawNotificationItem extends NotificationItem {
    payload?: {
        challengeId?: number
        slotId?: number
        madeDexId?: number
        recordId?: number
        madeDexName?: string
    } | null
}

/** payload에 담겨온 라우팅용 ID를 최상위 필드로 펼친다 (REST/WebSocket 공통 진입점) */
export function normalizeNotification(raw: RawNotificationItem): NotificationItem {
    const payload = raw.payload
    if (!payload) return raw

    return {
        ...raw,
        challengeId: raw.challengeId ?? payload.challengeId ?? null,
        slotId: raw.slotId ?? payload.slotId ?? null,
        madeDexId: raw.madeDexId ?? payload.madeDexId ?? null,
        recordId: raw.recordId ?? payload.recordId ?? null,
        madeDexName: raw.madeDexName ?? payload.madeDexName ?? null,
    }
}

/** 내 알림 목록 — 서버가 이미 createdAt DESC로 정렬해 준다 */
export function fetchNotifications(): Promise<NotificationItem[]> {
    return apiFetch<RawNotificationItem[]>('/api/v1/notifications').then((items) => items.map(normalizeNotification))
}

/** 안읽은 알림 수 */
export function fetchUnreadNotificationCount(): Promise<number> {
    return apiFetch<number>('/api/v1/notifications/unread-count')
}

/** 읽음 처리 */
export function markNotificationAsRead(notificationId: number): Promise<void> {
    return apiFetch<void>(`/api/v1/notifications/${notificationId}/read`, { method: 'PATCH' })
}

/** 알림함 진입 시 한 번에 전부 읽음 처리 */
export function markAllNotificationsAsRead(): Promise<void> {
    return apiFetch<void>('/api/v1/notifications/read-all', { method: 'PATCH' })
}

/** 삭제. 소프트 삭제라 같은 알림이 다시 오면 새로 쌓인다 */
export function deleteNotification(notificationId: number): Promise<void> {
    return apiFetch<void>(`/api/v1/notifications/${notificationId}`, { method: 'DELETE' })
}
