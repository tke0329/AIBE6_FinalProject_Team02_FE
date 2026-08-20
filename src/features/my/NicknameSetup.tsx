'use client'

import { NICKNAME_HINT, NICKNAME_MAX, NICKNAME_RE } from '@/features/my/nickname'
import { availabilityMessage, useNicknameAvailability } from '@/features/my/useNicknameAvailability'
import { useState } from 'react'

interface Props {
    /** 검증 통과한 닉네임 제출. 실제 저장/이동은 컨테이너가 담당 */
    onSubmit: (nickname: string) => void
    submitting: boolean
    /** 서버에서 온 에러 메시지(중복·형식 등) */
    error: string | null
}

/** 온보딩 전 최초 닉네임 세팅 화면. 1달 변경 제한과 무관하게 한 번만 정한다. */
export function NicknameSetup({ onSubmit, submitting, error }: Props) {
    const [value, setValue] = useState('')
    const trimmed = value.trim()
    const valid = NICKNAME_RE.test(trimmed)
    // 입력이 있는데 형식이 안 맞을 때만 안내 문구 노출
    const showHint = trimmed.length > 0 && !valid

    // 입력 중 중복 판정. 못 물어본 경우(failed)는 막지 않는다 — 저장할 때 서버가 다시 판정한다
    const availability = useNicknameAvailability(value)
    const taken = availability.state === 'taken'
    const canSubmit = valid && !taken && !submitting

    const submit = () => {
        if (canSubmit) onSubmit(trimmed)
    }

    /**
     * 한 줄만 보여준다.
     *
     * 막는 말(강조색) 형식 → 중복 → 서버 에러
     * 알리는 말(흐림)  확인 중 · 쓸 수 있음 · 확인 실패
     */
    const blocking = showHint ? NICKNAME_HINT : taken ? '이미 누가 쓰고 있어요.' : error
    const notice = blocking ? null : availabilityMessage(availability)

    return (
        <div className="flex h-full flex-col bg-surface-app">
            <div className="flex flex-1 flex-col justify-center px-8">
                <h1 className="font-display text-2xl text-neutral-900">닉네임을 정해주세요</h1>
                <p className="mt-2 text-sm text-neutral-800">
                    도감에서 사용할 이름이에요. 2~8자, 한글·영문·숫자·밑줄을 쓸 수 있어요.
                </p>

                <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submit()}
                    maxLength={NICKNAME_MAX}
                    placeholder="예) 먹킷냥이"
                    autoFocus
                    aria-label="닉네임"
                    className="mt-8 h-cta w-full rounded-2xl border-2 border-neutral-200 bg-white px-4 font-display text-lg text-neutral-900 outline-none focus:border-watermelon-400"
                />

                {/* 자리를 늘 잡아 둔다 — 문구가 떴다 사라질 때 아래 버튼이 흔들리지 않게 */}
                <p
                    className={`mt-2 min-h-[1.25rem] text-sm ${
                        blocking ? 'text-watermelon-600' : 'text-content-muted'
                    }`}
                    aria-live="polite"
                >
                    {blocking ?? notice ?? ''}
                </p>
            </div>

            <div className="px-6 pb-10">
                <button
                    onClick={submit}
                    disabled={!canSubmit}
                    className="h-cta w-full rounded-full bg-watermelon-500 font-display text-lg text-white shadow-card transition active:scale-[0.98] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none"
                >
                    {submitting ? '저장 중…' : '시작하기'}
                </button>
            </div>
        </div>
    )
}
