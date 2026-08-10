import React, { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface AlertModalProps {
    title?: string
    message: string
    buttonText?: string
    onClose: () => void
}

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * 전역 또는 페이지 단위로 브라우저 alert 대신 띄울 수 있는 공통 얼럿 모달.
 * 포커스 트랩, Escape 닫기, framer-motion 애니메이션 지원.
 */
export function AlertModal({ title = '알림', message, buttonText = '확인', onClose }: AlertModalProps) {
    const panelRef = useRef<HTMLElement>(null)
    const reduceMotion = useReducedMotion()

    useEffect(() => {
        const trigger = document.activeElement as HTMLElement | null
        const panel = panelRef.current
        panel?.focus()

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.stopPropagation()
                onClose()
                return
            }
            if (event.key !== 'Tab' || !panel) return

            const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
            if (!items.length) return
            const first = items[0]
            const last = items[items.length - 1]
            const active = document.activeElement

            if (event.shiftKey && (active === first || active === panel)) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && active === last) {
                event.preventDefault()
                first.focus()
            }
        }

        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('keydown', onKeyDown)
            trigger?.focus?.()
        }
    }, [onClose])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* 어두운 배경 */}
            <button
                type="button"
                aria-label="닫기"
                className="absolute inset-0 bg-black/35 transition-opacity"
                onClick={onClose}
            />

            {/* 모달 카드 */}
            <motion.section
                ref={panelRef}
                tabIndex={-1}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="alert-title"
                aria-describedby="alert-message"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
                className="relative z-10 w-full max-w-sm rounded-3xl bg-cream-100 p-6 shadow-modal outline-none flex flex-col items-center text-center border border-cream-200"
            >
                <span className="text-3xl mb-3" aria-hidden="true">
                    ⚠️
                </span>

                {title && (
                    <h2 id="alert-title" className="font-display text-xl text-brown mb-2">
                        {title}
                    </h2>
                )}

                <p
                    id="alert-message"
                    className="text-sm font-medium text-brown-soft mb-6 whitespace-pre-wrap leading-relaxed"
                >
                    {message}
                </p>

                <button
                    type="button"
                    onClick={onClose}
                    className="h-cta w-full rounded-full bg-orange-500 font-display text-lg text-white shadow-card hover:bg-orange-600 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
                >
                    {buttonText}
                </button>
            </motion.section>
        </div>
    )
}
