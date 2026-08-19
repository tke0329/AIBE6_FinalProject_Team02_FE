'use client'

import { useAuth } from '@/features/auth/AuthContext'
import { fetchUnreadNotificationCount, markAllNotificationsAsRead, markNotificationAsRead } from '@/features/notification/api'
import { connectNotificationStream } from '@/features/notification/realtime'
import { useToast } from '@/shared/ui'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

interface NotificationContextValue {
    unreadCount: number
    refreshUnreadCount: () => Promise<void>
    markAsRead: (notificationId: number) => Promise<void>
    markAllAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth()
    const toast = useToast()
    const [unreadCount, setUnreadCount] = useState(0)
    // 좋아요 토글을 반복하면 BE가 같은 알림 row를 재사용해 같은 notificationId를 다시 push한다.
    // 한 번 센 id는 다시 세거나 토스트를 띄우지 않는다
    const seenNotificationIds = useRef(new Set<number>())

    const refreshUnreadCount = useCallback(async () => {
        if (!isAuthenticated) {
            setUnreadCount(0)
            return
        }

        try {
            setUnreadCount(await fetchUnreadNotificationCount())
        } catch {
            setUnreadCount(0)
        }
    }, [isAuthenticated])

    useEffect(() => {
        void refreshUnreadCount()
    }, [refreshUnreadCount])

    useEffect(() => {
        if (!isAuthenticated) return

        return connectNotificationStream((notification) => {
            const alreadySeen = seenNotificationIds.current.has(notification.notificationId)
            seenNotificationIds.current.add(notification.notificationId)
            if (alreadySeen) return

            setUnreadCount((count) => count + (notification.read ? 0 : 1))

            if (notification.type === 'FRIEND_REQUEST_RECEIVED') {
                toast.info('친구 요청이 도착했어요')
            } else if (notification.type === 'FRIEND_REQUEST_ACCEPT') {
                toast.success('친구 요청을 수락했어요')
            } else if (notification.type === 'FRIEND_REQUEST_REJECT') {
                toast.info('친구 요청이 거절됐어요')
            } else {
                toast.info('새 알림이 도착했어요')
            }
        })
    }, [isAuthenticated, toast])

    useEffect(() => {
        if (!isAuthenticated) return

        const refreshOnFocus = () => {
            if (document.visibilityState === 'visible') void refreshUnreadCount()
        }

        document.addEventListener('visibilitychange', refreshOnFocus)
        window.addEventListener('focus', refreshOnFocus)
        return () => {
            document.removeEventListener('visibilitychange', refreshOnFocus)
            window.removeEventListener('focus', refreshOnFocus)
        }
    }, [isAuthenticated, refreshUnreadCount])

    const markAsRead = useCallback(
        async (notificationId: number) => {
            setUnreadCount((count) => Math.max(0, count - 1))
            try {
                await markNotificationAsRead(notificationId)
            } catch {
                await refreshUnreadCount()
            }
        },
        [refreshUnreadCount],
    )

    const markAllAsRead = useCallback(async () => {
        setUnreadCount(0)
        try {
            await markAllNotificationsAsRead()
        } catch {
            await refreshUnreadCount()
        }
    }, [refreshUnreadCount])

    return (
        <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount, markAsRead, markAllAsRead }}>
            {children}
        </NotificationContext.Provider>
    )
}

export function useNotifications(): NotificationContextValue {
    const ctx = useContext(NotificationContext)
    if (!ctx) throw new Error('useNotifications must be used within <NotificationProvider>')
    return ctx
}
