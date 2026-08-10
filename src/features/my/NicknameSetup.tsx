'use client'

import { NICKNAME_HINT, NICKNAME_MAX, NICKNAME_RE } from '@/features/my/nickname'
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

    const submit = () => {
        if (valid && !submitting) onSubmit(trimmed)
    }

    return (
        <div className="flex h-full flex-col bg-cream-100">
            <div className="flex flex-1 flex-col justify-center px-8">
                <h1 className="font-display text-2xl text-brown">닉네임을 정해주세요</h1>
                <p className="mt-2 text-sm text-brown-soft">
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
                    className="mt-8 h-cta w-full rounded-2xl border-2 border-cream-300 bg-white px-4 font-display text-lg text-brown outline-none focus:border-orange-400"
                />

                {/* 클라 형식 안내 → 서버 에러 순으로 노출 (한 줄만) */}
                <p className="mt-2 min-h-[1.25rem] text-sm text-orange-600">
                    {showHint ? NICKNAME_HINT : (error ?? '')}
                </p>
            </div>

            <div className="px-6 pb-10">
                <button
                    onClick={submit}
                    disabled={!valid || submitting}
                    className="h-cta w-full rounded-full bg-orange-500 font-display text-lg text-white shadow-card transition active:scale-[0.98] disabled:bg-cream-300 disabled:text-brown-muted disabled:shadow-none"
                >
                    {submitting ? '저장 중…' : '시작하기'}
                </button>
            </div>
        </div>
    )
}
