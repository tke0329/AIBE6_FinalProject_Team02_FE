'use client'

import { deleteNotification, fetchNotifications, type NotificationItem } from '@/features/notification/api'
import { useNotifications } from '@/features/notification/NotificationContext'
import { NotificationPanel } from '@/features/notification/NotificationPanel'
import { resolveNotificationRoute } from '@/features/notification/resolveRoute'
import { ROUTES } from '@/shared/lib/routes'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

/** `/my/notifications` 마이페이지 알림 탭 */
export default function NotificationsPage() {
    const router = useRouter()
    const { markAsRead, markAllAsRead, refreshUnreadCount } = useNotifications()
    const [notifications, setNotifications] = useState<NotificationItem[] | null>(null)

    useEffect(() => {
        fetchNotifications()
            .then((items) => {
                // 서버에는 한 번에 읽음 처리한다 — 하나씩 눌러 확인할 필요 없다.
                // 하지만 화면은 원래 읽음 상태 그대로 보여줘서, 방금 들어온 알림은 이번에 볼 때까지는
                // 계속 분홍색으로 구분된다. 다음에 알림함을 열면 그때는 읽은 색으로 보인다.
                setNotifications(items)
                if (items.some((n) => !n.read)) void markAllAsRead()
            })
            .catch(() => setNotifications([]))
        // 진입할 때 한 번만 — markAllAsRead/markAsRead는 NotificationProvider가 안정된 참조로 준다
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const markLocalRead = (notificationId: number) => {
        setNotifications((prev) =>
            prev ? prev.map((n) => (n.notificationId === notificationId ? { ...n, read: true } : n)) : prev,
        )
    }

    const handleOpen = (notification: NotificationItem) => {
        if (!notification.read) {
            markLocalRead(notification.notificationId)
            markAsRead(notification.notificationId).catch(() => {})
        }

        resolveNotificationRoute(notification)
            .then((href) => {
                if (href !== ROUTES.myNotifications) router.push(href)
            })
            .catch(() => router.push(ROUTES.myNotifications))
    }

    const handleDelete = (notification: NotificationItem) => {
        setNotifications((prev) => (prev ? prev.filter((n) => n.notificationId !== notification.notificationId) : prev))
        deleteNotification(notification.notificationId)
            .then(() => {
                if (!notification.read) void refreshUnreadCount()
            })
            .catch(() => {
                // 실패하면 지운 자리 그대로 되돌린다
                setNotifications((prev) => (prev ? [...prev, notification].sort(byCreatedAtDesc) : prev))
            })
    }

    return (
        <NotificationPanel
            notifications={notifications}
            onBack={() => router.push(ROUTES.my)}
            onOpen={handleOpen}
            onDelete={handleDelete}
        />
    )
}

function byCreatedAtDesc(a: NotificationItem, b: NotificationItem): number {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}
