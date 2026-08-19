import { normalizeNotification, type NotificationItem } from '@/features/notification/api'

type NotificationHandler = (notification: NotificationItem) => void

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'

function wsUrl(path: string): string {
    const url = new URL(path, API_BASE)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return url.toString()
}

function stompFrame(command: string, headers: Record<string, string>, body = ''): string {
    const lines = [command, ...Object.entries(headers).map(([key, value]) => `${key}:${value}`), '', body]
    return `${lines.join('\n')}\0`
}

function parseStompFrames(data: string): Array<{ command: string; body: string }> {
    return data
        .split('\0')
        .map((frame) => frame.trim())
        .filter(Boolean)
        .map((frame) => {
            const splitAt = frame.indexOf('\n\n')
            const head = splitAt >= 0 ? frame.slice(0, splitAt) : frame
            const body = splitAt >= 0 ? frame.slice(splitAt + 2) : ''
            return { command: head.split('\n')[0] ?? '', body }
        })
}

export function connectNotificationStream(onNotification: NotificationHandler): () => void {
    let closedByClient = false
    let socket: WebSocket | null = new WebSocket(wsUrl('/ws'))

    socket.addEventListener('open', () => {
        socket?.send(
            stompFrame('CONNECT', {
                'accept-version': '1.2',
                'heart-beat': '10000,10000',
            }),
        )
    })

    socket.addEventListener('message', (event) => {
        if (typeof event.data !== 'string') return

        for (const frame of parseStompFrames(event.data)) {
            if (frame.command === 'CONNECTED') {
                socket?.send(
                    stompFrame('SUBSCRIBE', {
                        id: 'notifications',
                        destination: '/user/queue/notifications',
                        ack: 'auto',
                    }),
                )
                continue
            }

            if (frame.command !== 'MESSAGE' || !frame.body) continue

            try {
                onNotification(normalizeNotification(JSON.parse(frame.body) as NotificationItem))
            } catch {
                // 서버가 예기치 않은 프레임을 보내도 연결은 유지한다.
            }
        }
    })

    socket.addEventListener('close', () => {
        if (!closedByClient) socket = null
    })

    return () => {
        closedByClient = true
        socket?.close()
        socket = null
    }
}
