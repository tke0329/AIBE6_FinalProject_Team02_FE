import React, { useRef, useState } from 'react'
import { XIcon } from 'lucide-react'

import { BottomSheet } from '@/shared/ui'
import { INVITE_CODE_LENGTH, normalizeInviteCode } from './types'

interface Props {
    /** 코드 확인과 참여는 다음 화면이 맡는다. 여기서는 코드만 받는다 */
    onSubmit: (code: string) => void
    onClose: () => void
}

/** 클립보드 읽기는 https·localhost가 아니면 없고, 있어도 사용자가 거부할 수 있다 */
async function readClipboard(): Promise<string | null> {
    if (!navigator.clipboard?.readText) return null
    try {
        return await navigator.clipboard.readText()
    } catch {
        return null
    }
}

export function MadeDexCodeSheet({ onSubmit, onClose }: Props) {
    const [code, setCode] = useState('')
    const [pasteFailed, setPasteFailed] = useState(false)

    const boxes = useRef<Array<HTMLInputElement | null>>([])

    const focusBox = (index: number) => {
        boxes.current[Math.min(Math.max(index, 0), INVITE_CODE_LENGTH - 1)]?.focus()
    }

    const change = (next: string) => {
        setCode(normalizeInviteCode(next))
        setPasteFailed(false)
    }

    const changeAt = (index: number, value: string) => {
        const typed = normalizeInviteCode(value)
        if (!typed) {
            change(code.slice(0, index) + code.slice(index + 1))
            return
        }
        // 입력한 길이만 덮어쓰고 뒤 글자는 남긴다. 가운데 자리를 고쳐도 뒤가 지워지지 않는다
        const next = normalizeInviteCode(code.slice(0, index) + typed + code.slice(index + typed.length))
        change(next)
        focusBox(Math.min(index + typed.length, next.length))
    }

    const keyDownAt = (index: number, event: React.KeyboardEvent) => {
        if (event.key !== 'Backspace' || code[index]) return
        // 빈 칸에서 지우면 앞 칸의 글자를 지우며 돌아간다
        event.preventDefault()
        change(code.slice(0, Math.max(index - 1, 0)) + code.slice(index))
        focusBox(index - 1)
    }

    const paste = async () => {
        const text = await readClipboard()
        if (text === null) {
            setPasteFailed(true)
            return
        }
        const pasted = normalizeInviteCode(text)
        change(pasted)
        focusBox(pasted.length)
    }

    return (
        <BottomSheet title="초대 코드 입력" showTitle={false} onClose={onClose}>
            <div className="flex items-center justify-between px-5 pt-3">
                <h2 className="font-display text-xl text-content-primary">초대 코드 입력</h2>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="닫기"
                    className="flex h-11 w-11 items-center justify-center rounded-full text-content-secondary"
                >
                    <XIcon size={22} aria-hidden />
                </button>
            </div>

            <div className="px-5 pb-8 pt-6">
                <div className="flex justify-center gap-2">
                    {Array.from({ length: INVITE_CODE_LENGTH }, (_, index) => (
                        <input
                            key={index}
                            ref={(element) => {
                                boxes.current[index] = element
                            }}
                            value={code[index] ?? ''}
                            onChange={(event) => changeAt(index, event.target.value)}
                            onKeyDown={(event) => keyDownAt(index, event)}
                            onFocus={(event) => event.target.select()}
                            inputMode="text"
                            autoCapitalize="characters"
                            autoComplete="off"
                            aria-label={`초대 코드 ${index + 1}번째 자리`}
                            className="h-14 w-12 rounded-2xl bg-neutral-100 text-center font-display text-2xl uppercase text-content-primary outline-none focus:ring-2 focus:ring-watermelon-400"
                        />
                    ))}
                </div>

                <div className="mt-4 flex justify-center">
                    <button
                        type="button"
                        onClick={() => void paste()}
                        className="min-h-touch rounded-full px-4 text-sm font-bold text-content-secondary"
                    >
                        복사한 코드 붙여넣기
                    </button>
                </div>

                {pasteFailed && (
                    <p className="mt-2 text-center text-sm text-content-secondary">
                        클립보드를 읽지 못했어요. 코드를 직접 입력해 주세요.
                    </p>
                )}

                <button
                    type="button"
                    disabled={code.length !== INVITE_CODE_LENGTH}
                    onClick={() => onSubmit(code)}
                    className="mt-8 w-full rounded-2xl bg-action-primary py-4 font-display text-lg text-content-on-action shadow-card disabled:bg-action-disabled-bg disabled:text-action-disabled-text disabled:shadow-none"
                >
                    완료
                </button>
            </div>
        </BottomSheet>
    )
}
