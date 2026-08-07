import React, { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface BottomSheetProps {
    /** 시트 제목. 접근 가능한 이름으로도 쓰임 */
    title: string
    /** 제목을 시각적으로도 보여줄지. false면 스크린리더에만 노출 */
    showTitle?: boolean
    onClose: () => void
    children: React.ReactNode
    /** 아래로 끌어 닫기 허용 (댓글 시트 등) */
    draggable?: boolean
    className?: string
    /** 패널 높이 제한. 기본은 내용만큼 */
    maxHeightClass?: string
}

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * §3.2 하단 시트. 도움말·참여자 관리·댓글이 공유.
 * §5 포커스 트랩 + 닫을 때 트리거로 포커스 복귀 + Escape 닫기.
 * §7 전환 300ms, prefers-reduced-motion 시 즉시 표시.
 */
export function BottomSheet({
    title,
    showTitle = true,
    onClose,
    children,
    draggable = false,
    className = '',
    maxHeightClass = 'max-h-[80%]',
}: BottomSheetProps) {
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
            // 닫을 때 트리거로 포커스 복귀
            trigger?.focus?.()
        }
    }, [onClose])

    return (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
            <button
                type="button"
                aria-label={`${title} 닫기`}
                className="absolute inset-0 bg-black/35"
                onClick={onClose}
            />

            <motion.section
                ref={panelRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                drag={draggable ? 'y' : false}
                dragConstraints={{ top: 0, bottom: 180 }}
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                    if (draggable && info.offset.y > 90) onClose()
                }}
                initial={reduceMotion ? false : { y: '100%' }}
                animate={{ y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease: 'easeOut' }}
                className={`relative z-10 flex ${maxHeightClass} flex-col rounded-t-3xl bg-surface-app shadow-modal outline-none ${className}`}
            >
                <div className="flex shrink-0 flex-col items-center pt-3">
                    <span aria-hidden className="h-1 w-10 rounded-full bg-cream-300" />
                </div>
                {showTitle ? (
                    <h2 className="shrink-0 px-5 pt-3 font-display text-xl text-content-primary">{title}</h2>
                ) : null}
                {children}
            </motion.section>
        </div>
    )
}
