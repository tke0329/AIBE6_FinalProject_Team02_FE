import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface ConfirmModalProps {
    title?: string
    message: string
    confirmText?: string
    cancelText?: string
    danger?: boolean
    onConfirm: () => void
    onCancel: () => void
}

/** 브라우저 confirm() 대신 쓰는 공통 확인 모달 (예/아니오). */
export function ConfirmModal({
    title = '확인',
    message,
    confirmText = '확인',
    cancelText = '취소',
    danger = false,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    const reduceMotion = useReducedMotion()

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button type="button" aria-label="닫기" className="absolute inset-0 bg-black/35" onClick={onCancel} />
            <motion.section
                role="alertdialog"
                aria-modal="true"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
                className="relative z-10 flex w-full max-w-sm flex-col items-center rounded-3xl border border-neutral-100 bg-surface-raised p-6 text-center shadow-modal"
            >
                {title && <h2 className="mb-2 font-display text-xl text-neutral-900">{title}</h2>}
                <p className="mb-6 whitespace-pre-wrap text-sm font-medium leading-relaxed text-neutral-800">
                    {message}
                </p>
                <div className="flex w-full gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="h-cta flex-1 rounded-full bg-neutral-100 font-display text-base text-neutral-800 active:scale-95"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`h-cta flex-1 rounded-full font-display text-base text-white shadow-card active:scale-95 ${
                            danger ? 'bg-red-500 hover:bg-red-600' : 'bg-watermelon-500 hover:bg-watermelon-600'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </motion.section>
        </div>
    )
}
