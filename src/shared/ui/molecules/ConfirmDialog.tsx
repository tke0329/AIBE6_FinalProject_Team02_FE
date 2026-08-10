import React from 'react'

interface ConfirmDialogProps {
    title: string
    message: React.ReactNode
    /** 실행 버튼 문구. "확인" 대신 무슨 일이 일어나는지 적는다 */
    actionText: string
    onCancel: () => void
    onConfirm: () => void
}

/** 되돌릴 수 없는 동작 앞에 세우는 확인 창. 진행 상태와 실패는 호출한 화면이 알린다 */
export function ConfirmDialog({ title, message, actionText, onCancel, onConfirm }: ConfirmDialogProps) {
    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 px-5">
            <section role="dialog" aria-modal="true" className="w-full rounded-3xl bg-cream-50 p-5 shadow-pop">
                <h2 className="font-display text-xl text-brown">{title}</h2>
                <p className="mt-2 break-keep text-sm leading-5 text-brown-soft">{message}</p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-2xl bg-cream-200 py-3 text-sm font-bold text-brown-soft"
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-2xl bg-orange-500 py-3 text-sm font-bold text-white"
                    >
                        {actionText}
                    </button>
                </div>
            </section>
        </div>
    )
}
