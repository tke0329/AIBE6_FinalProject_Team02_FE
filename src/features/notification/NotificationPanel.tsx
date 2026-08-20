'use client'

import type { NotificationItem, NotificationType } from '@/features/notification/api'
import {
    ArrowLeftIcon,
    BellIcon,
    CheckIcon,
    ImagePlusIcon,
    HeartIcon,
    MessageSquareIcon,
    UserPlusIcon,
    UsersIcon,
    XIcon,
} from 'lucide-react'

interface Props {
    notifications: NotificationItem[] | null // null이면 로딩 중
    onBack: () => void
    onOpen: (notification: NotificationItem) => void
    onDelete: (notification: NotificationItem) => void
}

const TYPE_LABEL: Record<NotificationType, string> = {
    MADE_DEX_JOINED: '로그잇에 새로운 멤버가 참여했어요',
    MADE_DEX_RECORD_CREATED: '로그잇에 새 기록이 올라왔어요',
    MADE_DEX_RECORD_ADDED: '로그잇에 새 기록이 올라왔어요',
    MADE_DEX_MEMBER_RECORD_CREATED: '로그잇에 새 기록이 올라왔어요',
    FRIEND_CARD_REGISTERED: '친구가 오늘의 식단을 기록했어요',
    MADE_DEX_COMMENT_ADDED: '내 기록에 댓글이 달렸어요',
    MADE_DEX_COMMENT_LIKED: '내 댓글을 좋아해요',
    MADE_DEX_RECORD_LIKED: '내 기록을 좋아해요',
    CHALLENGE_REVIEW_ADDED: '내가 개설한 챌린지에 리뷰가 작성됐어요.',
    CHALLENGE_CARD_REVIEW_ADDED: '내가 개설한 챌린지 카드에 리뷰가 작성됐어요.',
    CHALLENGE_REVIEW_LIKED: '내 리뷰를 좋아해요',
    FRIEND_REQUEST_RECEIVED: '친구 요청이 도착했어요',
    FRIEND_REQUEST_ACCEPT: '친구 요청을 수락했어요',
    FRIEND_REQUEST_REJECT: '친구 요청이 거절됐어요',
    FOOD_REPORT_APPROVE: '제보한 음식이 승인됐어요',
    FOOD_REPORT_REJECT: '제보한 음식이 거절됐어요',
}

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
    MADE_DEX_JOINED: <UsersIcon size={18} aria-hidden />,
    MADE_DEX_RECORD_CREATED: <ImagePlusIcon size={18} aria-hidden />,
    MADE_DEX_RECORD_ADDED: <ImagePlusIcon size={18} aria-hidden />,
    MADE_DEX_MEMBER_RECORD_CREATED: <ImagePlusIcon size={18} aria-hidden />,
    FRIEND_CARD_REGISTERED: <UsersIcon size={18} aria-hidden />,
    MADE_DEX_COMMENT_ADDED: <MessageSquareIcon size={18} aria-hidden />,
    MADE_DEX_COMMENT_LIKED: <HeartIcon size={18} aria-hidden />,
    MADE_DEX_RECORD_LIKED: <HeartIcon size={18} aria-hidden />,
    CHALLENGE_REVIEW_ADDED: <MessageSquareIcon size={18} aria-hidden />,
    CHALLENGE_CARD_REVIEW_ADDED: <MessageSquareIcon size={18} aria-hidden />,
    CHALLENGE_REVIEW_LIKED: <HeartIcon size={18} aria-hidden />,
    FRIEND_REQUEST_RECEIVED: <UserPlusIcon size={18} aria-hidden />,
    FRIEND_REQUEST_ACCEPT: <CheckIcon size={18} aria-hidden />,
    FRIEND_REQUEST_REJECT: <XIcon size={18} aria-hidden />,
    FOOD_REPORT_APPROVE: <CheckIcon size={18} aria-hidden />,
    FOOD_REPORT_REJECT: <XIcon size={18} aria-hidden />,
}

function notificationLabel(notification: NotificationItem): string {
    const actor = notification.actorNickname?.trim()
    const target = notification.targetName?.trim()
    const madeDexName = notification.madeDexName?.trim()

    // 제보 승인/반려는 서버가 음식이름·사유를 합쳐 message로 내려준다 → 아래 범용 message 폴백이 그대로 표시

    if (notification.message?.trim()) return notification.message

    if (notification.type === 'MADE_DEX_JOINED' && actor && madeDexName) {
        return `${madeDexName}에 ${actor}님이 참여했어요`
    }
    if (
        (notification.type === 'MADE_DEX_RECORD_CREATED' ||
            notification.type === 'MADE_DEX_RECORD_ADDED' ||
            notification.type === 'MADE_DEX_MEMBER_RECORD_CREATED') &&
        actor &&
        target
    ) {
        return `${actor}님이 ${target}에 기록을 올렸어요`
    }
    if (notification.type === 'MADE_DEX_RECORD_LIKED' && actor) {
        return `${actor}님이 내 기록을 좋아해요`
    }
    if (notification.type === 'MADE_DEX_COMMENT_LIKED' && actor) {
        return `${actor}님이 내 댓글을 좋아해요`
    }
    if (notification.type === 'FRIEND_CARD_REGISTERED' && actor) {
        return `${actor}님이 오늘의 식단을 기록했어요`
    }
    if (notification.type === 'FRIEND_REQUEST_RECEIVED' && actor) {
        return `${actor}님이 친구 요청을 보냈어요`
    }
    if (notification.type === 'FRIEND_REQUEST_ACCEPT' && actor) {
        return `${actor}님이 친구 요청을 수락했어요`
    }
    if (notification.type === 'FRIEND_REQUEST_REJECT' && actor) {
        return `${actor}님이 친구 요청을 거절했어요`
    }

    return TYPE_LABEL[notification.type]
}

/** `방금 전` / `n분 전` / `n시간 전` / `n일 전` / 그 이후는 날짜 */
function formatRelativeTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime()
    const diffMin = Math.floor(diffMs / 60_000)
    if (diffMin < 1) return '방금 전'
    if (diffMin < 60) return `${diffMin}분 전`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour}시간 전`
    const diffDay = Math.floor(diffHour / 24)
    if (diffDay < 7) return `${diffDay}일 전`
    return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(new Date(iso))
}

interface NotificationSection {
    label: string
    items: NotificationItem[]
}

/**
 * 시간대별 구간으로 나눈다. 서버가 이미 최신순으로 줘서 구간 안에서도 순서가 유지된다.
 * 파인더·노션의 "오늘/어제/지난 7일/지난 30일" 구간과 같은 감각 — 몇 시간 전인지보다
 * 어느 묶음인지가 눈에 먼저 들어와야 쭉 훑어보기 편하다
 */
function groupByRecency(notifications: NotificationItem[]): NotificationSection[] {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const dayMs = 24 * 60 * 60 * 1000

    const sections: NotificationSection[] = [
        { label: '오늘', items: [] },
        { label: '어제', items: [] },
        { label: '지난 7일', items: [] },
        { label: '지난 30일', items: [] },
        { label: '그 이전', items: [] },
    ]

    for (const notification of notifications) {
        const diffDays = Math.floor((startOfToday.getTime() - new Date(notification.createdAt).getTime()) / dayMs)
        if (diffDays <= 0) sections[0].items.push(notification)
        else if (diffDays === 1) sections[1].items.push(notification)
        else if (diffDays <= 7) sections[2].items.push(notification)
        else if (diffDays <= 30) sections[3].items.push(notification)
        else sections[4].items.push(notification)
    }

    return sections.filter((section) => section.items.length > 0)
}

/** `/my/notifications` — 마이페이지 알림 탭. 서버가 이미 최신순으로 정렬해 준 목록을 그대로 쌓아 보여준다 */
export function NotificationPanel({ notifications, onBack, onOpen, onDelete }: Props) {
    return (
        <div className="flex h-full flex-col bg-surface-app">
            <header className="flex items-center gap-3 px-5 py-4">
                <button onClick={onBack} aria-label="뒤로가기">
                    <ArrowLeftIcon size={22} className="text-neutral-900" />
                </button>
                <span className="font-display text-xl text-neutral-900">알림</span>
            </header>

            <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-8">
                {notifications === null ? (
                    <p className="py-16 text-center text-sm text-neutral-800">불러오는 중…</p>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <BellIcon size={28} aria-hidden className="mb-2 text-content-muted" />
                        <p className="text-sm text-neutral-800">아직 도착한 알림이 없어요.</p>
                    </div>
                ) : (
                    groupByRecency(notifications).map((section, index) => (
                        <section key={section.label}>
                            <div className={`flex items-center gap-3 pb-2 ${index === 0 ? 'pt-0' : 'pt-5'}`}>
                                <span aria-hidden className="h-px flex-1 bg-neutral-100" />
                                <span className="shrink-0 text-xs font-bold text-content-muted">{section.label}</span>
                                <span aria-hidden className="h-px flex-1 bg-neutral-100" />
                            </div>
                            <ul className="space-y-2">
                                {section.items.map((n) => (
                                    <li key={n.notificationId}>
                                        <div
                                            className={`flex items-stretch gap-1 rounded-2xl shadow-card ${
                                                n.read ? 'bg-surface-card' : 'bg-watermelon-50'
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => onOpen(n)}
                                                className="flex min-w-0 flex-1 items-start gap-3 p-4 text-left"
                                            >
                                                <span
                                                    aria-hidden
                                                    className={`mt-0.5 shrink-0 ${
                                                        n.read ? 'text-content-muted' : 'text-watermelon-500'
                                                    }`}
                                                >
                                                    {TYPE_ICON[n.type]}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span
                                                        className={`block text-sm ${
                                                            n.read
                                                                ? 'text-content-secondary'
                                                                : 'font-medium text-content-primary'
                                                        }`}
                                                    >
                                                        {notificationLabel(n)}
                                                    </span>
                                                    <span className="mt-1 block text-xs text-content-muted">
                                                        {formatRelativeTime(n.createdAt)}
                                                    </span>
                                                </span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDelete(n)}
                                                aria-label="알림 지우기"
                                                className="flex w-11 shrink-0 items-center justify-center text-content-muted"
                                            >
                                                <XIcon size={16} aria-hidden />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))
                )}
            </main>
        </div>
    )
}
