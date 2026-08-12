'use client'

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2Icon, InfoIcon, XCircleIcon } from 'lucide-react'

type ToastTone = 'success' | 'error' | 'info'

interface Toast {
    id: number
    tone: ToastTone
    message: string
}

interface ToastApi {
    /** 동작이 끝났음을 알린다. "저장했어요"처럼 **결과**를 적는다 */
    success: (message: string) => void
    /** 실패. 다음에 무엇을 하면 되는지까지 적으면 좋다 */
    error: (message: string) => void
    /** 좋고 나쁨이 없는 알림 */
    info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

/** 성공은 금방 사라져도 되지만, 실패는 읽을 시간이 필요하다 */
const DURATION: Record<ToastTone, number> = { success: 2600, error: 4500, info: 3200 }

/** 넘치면 위쪽(오래된 것)부터 밀어낸다. 넷 이상 쌓이면 읽기 전에 지나간다 */
const MAX_VISIBLE = 3

/** 하단 탭·고정 CTA를 피하는 높이. globals.css의 `.pb-cta`와 같은 값 */
const BOTTOM_OFFSET = 'calc(5rem + env(safe-area-inset-bottom))'

const TONE_STYLE: Record<ToastTone, { icon: React.ReactNode; className: string }> = {
    success: {
        icon: <CheckCircle2Icon size={18} aria-hidden />,
        className: 'bg-content-primary text-content-on-dark',
    },
    error: {
        icon: <XCircleIcon size={18} aria-hidden />,
        className: 'bg-feedback-error text-content-on-dark',
    },
    info: {
        icon: <InfoIcon size={18} aria-hidden />,
        className: 'bg-content-primary text-content-on-dark',
    },
}

/**
 * 화면 아래에서 잠깐 떴다 사라지는 알림.
 *
 * ## 무엇을 여기 띄우고, 무엇을 띄우지 않는가
 *
 * **띄운다** — 되돌릴 필요 없는 동작의 결과. 저장했다, 복사했다, 장착했다.
 * 지금 이 앱에는 성공 피드백이 아예 없어서 눌렀는데 아무 반응이 없는 화면이 많다.
 *
 * **띄우지 않는다** — 입력값이 틀렸다는 안내. 그건 틀린 칸 바로 아래(`TextField`의 `error`)에
 * 붙어 있어야 어디를 고쳐야 할지 알 수 있다. 토스트는 사라지고 나면 다시 볼 수 없다.
 *
 * **띄우지 않는다** — 사용자가 반드시 읽고 결정해야 하는 것. 그건 `Dialog`다.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])
    const reduceMotion = useReducedMotion()
    // 같은 밀리초에 두 개가 뜨면 key가 겹친다. 단순 증가값이 안전하다
    const nextId = useRef(0)

    const push = useCallback((tone: ToastTone, message: string) => {
        const id = nextId.current++
        setToasts((current) => [...current, { id, tone, message }].slice(-MAX_VISIBLE))
        window.setTimeout(() => {
            setToasts((current) => current.filter((toast) => toast.id !== id))
        }, DURATION[tone])
    }, [])

    // push가 안정적이라 이 객체도 한 번만 만들어진다 — 소비자가 매 렌더 리렌더되지 않게
    const api = useMemo<ToastApi>(
        () => ({
            success: (message) => push('success', message),
            error: (message) => push('error', message),
            info: (message) => push('info', message),
        }),
        [push],
    )

    return (
        <ToastContext.Provider value={api}>
            {children}

            {/*
                fixed — `.app-shell-content`가 transform으로 컨테이닝 블록이라
                데스크톱에서도 폰 폭 컬럼 안에 뜬다.
                pointer-events-none — 토스트가 떠 있는 동안 그 아래를 누를 수 있어야 한다
            */}
            <div
                className="pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-5"
                style={{ bottom: BOTTOM_OFFSET }}
            >
                <AnimatePresence initial={false}>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            // 실패는 하던 일을 멈추고 알려야 하고, 성공은 흐름을 끊지 않는다
                            role={toast.tone === 'error' ? 'alert' : 'status'}
                            aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
                            layout
                            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                            transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
                            className={`flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium shadow-modal ${
                                TONE_STYLE[toast.tone].className
                            }`}
                        >
                            {TONE_STYLE[toast.tone].icon}
                            <span className="min-w-0 break-keep">{toast.message}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    )
}

/**
 * 토스트를 띄우는 통로.
 *
 * Provider 밖에서 부르면 던진다 — 조용히 무시하면 "저장은 됐는데 아무 말이 없는" 화면이
 * 되어 원인을 찾기 어렵다.
 */
export function useToast(): ToastApi {
    const api = useContext(ToastContext)
    if (!api) throw new Error('useToast는 ToastProvider 안에서만 쓸 수 있습니다 (layout.tsx에 배선돼 있음)')
    return api
}
