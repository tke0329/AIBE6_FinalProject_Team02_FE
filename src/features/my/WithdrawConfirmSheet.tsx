'use client'

import { BottomSheet } from '@/shared/ui'

interface Props {
    pending: boolean
    error: string | null
    onConfirm: () => void
    onClose: () => void
}

/** 회원 탈퇴 확인 시트
 * 되돌릴 수 없는 동작이라 한 번 더 확인받음 */
export function WithdrawConfirmSheet({ pending, error, onConfirm, onClose }: Props) {
    return (
        // 탈퇴 요청 중에는 딤·Escape·드래그로도 닫히지 않는다.
        // 되돌릴 수 없는 동작이라 결과(성공/오류)를 반드시 이 시트에서 보여줘야 한다
        <BottomSheet title="회원 탈퇴" onClose={onClose} dismissible={!pending}>
            <div className="px-5 pb-8 pt-3">
                <p className="text-sm leading-6 text-neutral-800">
                    탈퇴하면 프로필·닉네임 등 계정 정보가 삭제되며 되돌릴 수 없어요. 정말 탈퇴하시겠어요?
                </p>

                {error && <p className="mt-3 text-sm text-watermelon-600">{error}</p>}

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={pending}
                        className="h-cta flex-1 rounded-full border-2 border-neutral-200 bg-white font-display text-base text-neutral-900 transition active:scale-[0.98] disabled:opacity-60"
                    >
                        취소
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={pending}
                        className="h-cta flex-1 rounded-full bg-red-500 font-display text-base text-white shadow-card transition active:scale-[0.98] disabled:opacity-60"
                    >
                        {pending ? '처리 중…' : '탈퇴하기'}
                    </button>
                </div>
            </div>
        </BottomSheet>
    )
}
