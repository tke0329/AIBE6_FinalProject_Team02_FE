'use client'

import { motion, useDragControls, useReducedMotion } from 'framer-motion'
import React, { useCallback, useState } from 'react'
import { useFocusTrap } from '@/shared/ui/hooks/useFocusTrap'

interface BottomSheetProps {
    /** 시트 제목. 접근 가능한 이름으로도 쓰임 */
    title: string
    /** 제목을 시각적으로도 보여줄지. false면 스크린리더에만 노출 */
    showTitle?: boolean
    onClose: () => void
    children: React.ReactNode
    /**
     * 지금 닫을 수 있는지. 기본 true.
     *
     * false면 딤·Escape·손잡이 드래그가 모두 무시된다 — 되돌릴 수 없는 요청이 진행 중일 때
     * (탈퇴처럼) 시트가 닫혀 결과를 못 보는 것을 막는다.
     *
     * "어떻게 닫는가"(§3.2.1 전역 계약)와는 축이 다르다. 그건 시트마다 달라선 안 되지만,
     * "지금 닫을 수 있는가"는 일시적 상태라 호출부만 알 수 있다.
     */
    dismissible?: boolean
    className?: string
    /** 패널 높이 제한. 기본은 내용만큼 */
    maxHeightClass?: string
}

/** §7 바텀시트 전환 300ms */
const SLIDE_MS = 0.3
/** 딤은 조금 빨리 깔린다 — 배경이 먼저 잡히고 그 위로 시트가 올라오는 순서가 자연스럽다 */
const DIM_MS = 0.22
/** 이만큼 끌어내리면 닫는다 */
const CLOSE_DISTANCE = 90
/** 짧게 튕겨도 닫는다 — 거리만 보면 빠른 플릭이 무시된다 */
const CLOSE_VELOCITY = 500

/**
 * §3.2 하단 시트. 도움말·참여자 관리·댓글이 공유.
 * §5 포커스 트랩 + 닫을 때 트리거로 포커스 복귀 + Escape 닫기.
 * §7 전환 300ms, prefers-reduced-motion 시 즉시 표시.
 *
 * 부드럽게 올라오게 만드는 데 세 가지가 필요했다.
 *
 * 1. **wrapper에 overflow-hidden** — 패널이 translateY(100%)로 시작하므로 컨테이너 밖으로
 *    넘치는 영역이 생긴다. 그 상태에서 무엇이든 스크롤을 유발하면(아래 2번) 뒷화면이 밀린다.
 *    넘침을 잘라 두면 스크롤할 여지가 구조적으로 없어진다.
 * 2. **focus({ preventScroll: true })** — 포커스 트랩 때문에 애니메이션 시작 전에 패널에
 *    포커스를 주는데, 그때 패널은 화면 밖이라 브라우저가 조상을 스크롤해 끌어올린다.
 *    그 뒤 패널이 제자리로 오면 넘침이 사라져 scrollTop이 0으로 클램프되므로,
 *    "밀렸다가 되돌아오는" 덜컹거림으로 보인다.
 * 3. **닫힘 애니메이션** — 호출부 10곳이 `{open && <BottomSheet/>}` 형태라 부모에
 *    AnimatePresence가 없다. 그래서 내려가는 연출을 이 안에서 끝내고 `onClose`를 뒤로 미룬다.
 *    (한계: children 안의 버튼이 부모 onClose를 직접 부르면 그 경로는 즉시 닫힌다)
 *
 * ## 닫는 방법은 시트마다 다르지 않다 (전역 계약)
 *
 * 어느 시트든 **① 바깥(딤) 누르기 ② 손잡이를 끌어내리기 ③ Escape** 셋으로 닫힌다.
 * 호출부가 켜고 끄는 옵션이 아니다 — 예전에는 `draggable`/`dragHandleOnly`가 opt-in이라
 * 10곳 중 3곳만 끌어 닫혔고, 그마저 둘은 패널 전체 / 하나는 손잡이로 갈려 있었다.
 *
 * **손잡이 기준으로 통일한 이유**: framer는 `dragListener`가 켜지면 패널에 `touch-action: none`을
 * 걸어 **안쪽 세로 스크롤을 막는다.** 도움말·구성 편집·기록 상세·날짜 휠처럼 내부 스크롤을 쓰는
 * 시트가 절반이 넘어서, 패널 전체 드래그는 전역화할 수 없다.
 * `dragListener={false}` + `dragControls`로 손잡이에서만 시작하면 스크롤과 끌어 닫기가 공존한다.
 */
export function BottomSheet({
    title,
    showTitle = true,
    onClose,
    children,
    dismissible = true,
    className = '',
    maxHeightClass = 'max-h-[80%]',
}: BottomSheetProps) {
    const reduceMotion = useReducedMotion()
    const dragControls = useDragControls()
    const [closing, setClosing] = useState(false)

    /**
     * 내려가는 연출을 먼저 보여 주고 실제 닫기는 끝난 뒤에 알린다.
     * 모션을 끈 사용자에겐 기다릴 이유가 없어 바로 닫는다.
     */
    const requestClose = useCallback(() => {
        // 진행 중인 요청이 있으면 어떤 경로로도 닫지 않는다.
        // 호출부에서 onClose를 무시하는 방식으로는 안 된다 — 내려가는 연출은 이미 끝난 뒤라
        // 화면 밖으로 내려간 채 마운트만 남는다
        if (!dismissible) return
        if (reduceMotion) {
            onClose()
            return
        }
        setClosing(true)
    }, [dismissible, onClose, reduceMotion])

    // 포커스 가두기·Escape·복귀는 Dialog와 공유한다 (preventScroll이 위 주석 2번을 막는 지점)
    const panelRef = useFocusTrap<HTMLElement>(requestClose)

    return (
        // overflow-hidden — 패널이 화면 밖에서 시작하므로 넘침을 잘라 스크롤 여지를 없앤다 (주석 1번)
        <div className="absolute inset-0 z-50 flex flex-col justify-end overflow-hidden">
            {/*
                no-touch-expand가 없으면 전역 아이콘버튼 규칙(globals.css)이 position을 relative로 덮어
                배경이 높이 0으로 찌그러진다 — 딤도 안 보이고 바깥을 눌러도 닫히지 않는다
            */}
            <motion.button
                type="button"
                aria-label={`${title} 닫기`}
                // 닫을 수 없는 동안은 스크린리더에도 그렇게 알린다
                disabled={!dismissible}
                aria-disabled={!dismissible}
                className="no-touch-expand absolute inset-0 bg-black/35"
                onClick={requestClose}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: closing ? 0 : 1 }}
                transition={reduceMotion ? { duration: 0 } : { duration: DIM_MS, ease: 'easeOut' }}
            />

            <motion.section
                ref={panelRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                drag="y"
                // false 고정 — 켜면 touch-action:none이 걸려 안쪽 스크롤이 죽는다. 손잡이에서만 시작한다
                dragListener={false}
                dragControls={dragControls}
                dragConstraints={{ top: 0, bottom: 180 }}
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                    // 충분히 내렸거나, 짧아도 빠르게 튕겼으면 닫는다. 아니면 animate가 제자리로 되돌린다
                    if (info.offset.y > CLOSE_DISTANCE || info.velocity.y > CLOSE_VELOCITY) requestClose()
                }}
                initial={reduceMotion ? false : { y: '100%' }}
                animate={{ y: closing ? '100%' : 0 }}
                transition={reduceMotion ? { duration: 0 } : { duration: SLIDE_MS, ease: 'easeOut' }}
                // 내려가는 연출이 끝난 뒤에야 부모에게 알린다. 올라올 때도 호출되므로 closing으로 가른다
                onAnimationComplete={() => {
                    if (closing) onClose()
                }}
                className={`relative z-10 flex ${maxHeightClass} flex-col rounded-t-3xl bg-surface-app shadow-modal outline-none ${className}`}
            >
                {/*
                    끌어 닫기의 유일한 시작점이라 모든 시트에 항상 있다.
                    가로로는 패널 전체가 잡히고 세로 28px — WCAG 2.2 §2.5.8(24×24)을 넘는다.
                    딤 누르기·Escape라는 동등한 대안이 있어 44px까지는 요구되지 않는다
                */}
                <div
                    className={`flex shrink-0 flex-col items-center py-3 ${
                        dismissible ? 'cursor-grab touch-none active:cursor-grabbing' : 'cursor-default opacity-40'
                    }`}
                    // 못 끄는 동안은 드래그를 시작하지도 않는다 — 끌렸다가 되돌아오면 고장으로 읽힌다
                    onPointerDown={dismissible ? (event) => dragControls.start(event) : undefined}
                >
                    <span aria-hidden className="h-1 w-10 rounded-full bg-neutral-200" />
                </div>
                {showTitle ? (
                    <h2 className="shrink-0 px-5 pt-3 font-display text-xl text-content-primary">{title}</h2>
                ) : null}
                {children}
            </motion.section>
        </div>
    )
}
