import {
    fetchChallengeDetail,
    fetchChallengeReviews,
    fetchFoodReviews,
    fetchMyChallenges,
} from '@/features/challenge/api'
import type { NotificationItem } from '@/features/notification/api'
import { ROUTES } from '@/shared/lib/routes'

async function resolveChallengeReview(notification: NotificationItem): Promise<string | null> {
    if (!notification.targetId) return null

    if (notification.challengeId && notification.type !== 'CHALLENGE_CARD_REVIEW_ADDED') {
        return ROUTES.challengeReview(notification.challengeId, notification.targetId)
    }
    if (notification.challengeId && notification.slotId && notification.type === 'CHALLENGE_CARD_REVIEW_ADDED') {
        return ROUTES.challengeFoodReview(notification.challengeId, notification.slotId, notification.targetId)
    }

    const created = await fetchMyChallenges('CREATED')

    if (notification.type === 'CHALLENGE_REVIEW_ADDED' || notification.type === 'CHALLENGE_REVIEW_LIKED') {
        for (const challenge of created) {
            const reviews = await fetchChallengeReviews(challenge.id)
            if (reviews.some((review) => review.id === notification.targetId)) {
                return ROUTES.challengeReview(challenge.id, notification.targetId)
            }
        }
    }

    if (notification.type === 'CHALLENGE_CARD_REVIEW_ADDED') {
        for (const challenge of created) {
            const detail = await fetchChallengeDetail(challenge.id)
            for (const slot of detail.slots) {
                const reviews = await fetchFoodReviews(challenge.id, slot.id)
                if (reviews.some((review) => review.id === notification.targetId)) {
                    return ROUTES.challengeFoodReview(challenge.id, slot.id, notification.targetId)
                }
            }
        }
    }

    return null
}

export async function resolveNotificationRoute(notification: NotificationItem): Promise<string> {
    switch (notification.type) {
        case 'FRIEND_REQUEST_RECEIVED':
            return ROUTES.friendRequests
        case 'FRIEND_REQUEST_ACCEPT':
        case 'FRIEND_REQUEST_REJECT':
            return ROUTES.userProfile(notification.actorId)
        case 'MADE_DEX_JOINED':
        case 'MADE_DEX_RECORD_CREATED':
        case 'MADE_DEX_RECORD_ADDED':
        case 'MADE_DEX_MEMBER_RECORD_CREATED':
            return notification.targetId ? ROUTES.madeDex(notification.targetId) : ROUTES.made
        case 'CHALLENGE_REVIEW_ADDED':
        case 'CHALLENGE_CARD_REVIEW_ADDED':
        case 'CHALLENGE_REVIEW_LIKED':
            return (await resolveChallengeReview(notification)) ?? ROUTES.challenge
        case 'MADE_DEX_COMMENT_ADDED':
        case 'MADE_DEX_COMMENT_LIKED':
        case 'MADE_DEX_RECORD_LIKED':
        case 'FRIEND_CARD_REGISTERED':
            if (notification.madeDexId && notification.recordId) {
                return ROUTES.madeRecord(notification.madeDexId, notification.recordId)
            }
            return ROUTES.made
        default:
            return ROUTES.myNotifications
    }
}
