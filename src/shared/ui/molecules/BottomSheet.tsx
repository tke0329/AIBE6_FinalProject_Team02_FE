import { motion, useDragControls, useReducedMotion } from 'framer-motion'
import React, { useEffect, useRef } from 'react'

interface BottomSheetProps {
    /** 시트 제목. 접근 가능한 이름으로도 쓰임 */
    title: string
    /** 제목을 시각적으로도 보여줄지. false면 스크린리더에만 노출 */
    showTitle?: boolean
    onClose: () => void
    children: React.ReactNode
    /** 아래로 끌어 닫기 허용 (댓글 시트 등) */
    draggable?: boolean
    /**
     * 손잡이에서만 끌어 닫기. 시트 안에 세로 스크롤 영역(휠·긴 목록)이 있을 때 쓴다.
     * framer는 drag가 켜지면 패널에 touch-action을 걸어 안쪽 세로 스크롤을 막는데,
     * dragListener를 끄면 그 설정을 건너뛰므로 스크롤과 끌어 닫기를 함께 쓸 수 있다
     */
    dragHandleOnly?: boolean
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
    dragHandleOnly = false,
    className = '',
    maxHeightClass = 'max-h-[80%]',
}: BottomSheetProps) {
    const panelRef = useRef<HTMLElement>(null)
    const reduceMotion = useReducedMotion()
    const dragControls = useDragControls()
    const handleOnly = draggable && dragHandleOnly

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
            {/*
                no-touch-expand가 없으면 전역 아이콘버튼 규칙(globals.css)이 position을 relative로 덮어
                배경이 높이 0으로 찌그러진다 — 딤도 안 보이고 바깥을 눌러도 닫히지 않는다
            */}
            <button
                type="button"
                aria-label={`${title} 닫기`}
                className="no-touch-expand absolute inset-0 bg-black/35"
                onClick={onClose}
            />

            <motion.section
                ref={panelRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                drag={draggable ? 'y' : false}
                dragListener={handleOnly ? false : undefined}
                dragControls={handleOnly ? dragControls : undefined}
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
                {/* 손잡이. handleOnly면 여기서만 끌어 닫는다 — 잡을 자리를 주려고 아래도 띄운다 */}
                <div
                    className={`flex shrink-0 flex-col items-center pt-3 ${
                        handleOnly ? 'cursor-grab touch-none pb-2 active:cursor-grabbing' : ''
                    }`}
                    onPointerDown={handleOnly ? (event) => dragControls.start(event) : undefined}
                >
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
