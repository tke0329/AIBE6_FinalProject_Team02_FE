'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { AlertTriangleIcon } from 'lucide-react'
import { Button } from '@/shared/ui/atoms/Button'
import { useFocusTrap } from '@/shared/ui/hooks/useFocusTrap'

interface DialogAction {
    label: string
    onClick: () => void
    /** 요청이 도는 중. 버튼이 잠기고 스피너가 뜬다 */
    loading?: boolean
}

interface DialogProps {
    title: string
    /** 줄바꿈이 필요하면 ReactNode로 넘긴다. 문자열이면 `\n`이 그대로 살아난다 */
    message: React.ReactNode
    /** 주 동작. 생략하면 "확인" 버튼 하나만 있는 알림 창이 된다 */
    action?: DialogAction
    /** 취소 문구. `action`이 있을 때만 그려진다 */
    cancelText?: string
    /**
     * 되돌릴 수 없는 동작. 경고 아이콘이 뜨고 주 버튼이 붉어진다.
     *
     * 남발하면 무뎌진다 — 삭제·탈퇴처럼 **되돌릴 수 없을 때만**.
     * 단순 확인은 기본형으로 충분하다.
     */
    danger?: boolean
    /**
     * 지금 닫을 수 있는지. 기본 true.
     * false면 딤·Escape가 무시된다 — 처리 중에 닫혀 결과를 못 보는 것을 막는다
     * (BottomSheet의 `dismissible`과 같은 규칙).
     */
    dismissible?: boolean
    onClose: () => void
}

/**
 * 화면 가운데 뜨는 확인·알림 창.
 *
 * 예전에는 `AlertModal`(알림) · `ConfirmModal`(예/아니오) · `ConfirmDialog`(위험 동작)
 * 셋으로 갈려 있었다. 하는 일이 같은데 **포커스 트랩은 하나에만 있었고**, 하나는
 * `absolute`·둘은 `fixed`라 데스크톱에서 뜨는 위치도 달랐다. 셋을 여기로 합쳤다.
 *
 * - 알림      → `action` 없이. 확인 버튼 하나
 * - 확인      → `action` 지정
 * - 위험 동작 → `action` + `danger`
 *
 * ## 이건 여기 쓰지 않는다
 *
 * **선택지가 셋 이상이거나 안에서 무언가를 입력해야 하면 `BottomSheet`를 쓴다.**
 * 가운데 창은 화면을 완전히 막아서, 오래 머무를 내용이 들어가면 답답하다.
 */
export function Dialog({
    title,
    message,
    action,
    cancelText = '취소',
    danger = false,
    dismissible = true,
    onClose,
}: DialogProps) {
    const reduceMotion = useReducedMotion()
    // 닫을 수 없는 동안에는 Escape도 무시한다
    const panelRef = useFocusTrap<HTMLElement>(() => {
        if (dismissible) onClose()
    })

    return (
        // fixed — `.app-shell-content`가 transform으로 컨테이닝 블록이라 폰 폭 컬럼 안에 갇힌다.
        // absolute로 두면 중간에 낀 relative 부모(화면 루트 9곳이 그렇다)에 붙어 위치가 달라진다
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
            <motion.button
                type="button"
                aria-label={`${title} 닫기`}
                disabled={!dismissible}
                aria-disabled={!dismissible}
                // no-touch-expand — 전역 아이콘버튼 규칙(globals.css)이 position을 덮어
                // 딤이 높이 0으로 찌그러지는 것을 막는다
                className="no-touch-expand absolute inset-0 bg-black/35"
                onClick={() => dismissible && onClose()}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
            />

            <motion.section
                ref={panelRef}
                tabIndex={-1}
                // 위험 경고는 즉시 읽혀야 하고, 일반 확인은 열릴 때 순서대로 읽히면 된다
                role={danger ? 'alertdialog' : 'dialog'}
                aria-modal="true"
                aria-label={title}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
                className="relative z-10 flex w-full flex-col items-center rounded-3xl bg-surface-raised p-6 text-center shadow-modal outline-none"
            >
                {danger && (
                    <AlertTriangleIcon size={28} aria-hidden className="mb-3 text-feedback-error" strokeWidth={2} />
                )}

                <h2 className="font-display text-xl text-content-primary">{title}</h2>

                <div className="whitespace-pre-wrap break-keep pb-6 pt-2 text-sm leading-6 text-content-secondary">
                    {message}
                </div>

                {action ? (
                    <div className="grid w-full grid-cols-2 gap-2">
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={onClose}
                            // 처리 중에는 취소도 막는다 — 취소만 눌리면 결과를 못 보고 사라진다
                            disabled={action.loading}
                        >
                            {cancelText}
                        </Button>
                        <Button
                            variant={danger ? 'danger' : 'primary'}
                            size="md"
                            onClick={action.onClick}
                            loading={action.loading}
                        >
                            {action.label}
                        </Button>
                    </div>
                ) : (
                    <Button size="md" fullWidth onClick={onClose}>
                        확인
                    </Button>
                )}
            </motion.section>
        </div>
    )
}
