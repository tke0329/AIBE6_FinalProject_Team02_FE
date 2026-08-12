'use client'

import { NICKNAME_HINT, NICKNAME_MAX, NICKNAME_RE } from '@/features/my/nickname'
import { AppScreen, Button, PageHeader, Text, TextField } from '@/shared/ui'
import { useState } from 'react'

interface Props {
    currentNickname: string
    /** 지금 변경 가능한지 (1개월 제한 통과 여부) */
    changeable: boolean
    /** 다음 변경 가능 시각. null이면 즉시 가능 */
    changeableAt: string | null
    submitting: boolean
    error: string | null
    onSubmit: (nickname: string) => void
    onBack: () => void
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

/**
 * 닉네임 변경 화면. 1개월 1회 제한 — 아직 불가하면 다음 가능일을 안내하고 잠근다.
 *
 * ## 공통 컴포넌트 이관 예시 (2026-08-11)
 *
 * "손대는 화면은 공통으로 옮긴다"의 본보기로 먼저 옮긴 화면이다. 무엇이 어떻게 바뀌는지:
 *
 * | 이전 | 이후 |
 * |---|---|
 * | `div.flex.h-full` + `header` 손조립 | `AppScreen` + `PageHeader` |
 * | `input` 클래스 12줄 + 안내문 `p` 따로 | `TextField` (라벨·에러·힌트·카운터가 한 자리) |
 * | 버튼 클래스 문자열 | `Button` |
 * | `text-neutral-900` `text-neutral-800` 원시 토큰 | `Text` variant (색이 역할에 따라온다) |
 *
 * 눈에 보이는 이득은 **에러 자리**다. 예전에는 `min-h-[1.25rem]`으로 자리를 억지로 잡아
 * 문구가 떴다 사라질 때 아래가 흔들리지 않게 했는데, `TextField`는 그 처리를 안에서 한다.
 */
export function NicknameEdit({
    currentNickname,
    changeable,
    changeableAt,
    submitting,
    error,
    onSubmit,
    onBack,
}: Props) {
    const [value, setValue] = useState(currentNickname)
    const trimmed = value.trim()
    const formatOk = NICKNAME_RE.test(trimmed)
    const unchanged = trimmed === currentNickname
    // 형식이 틀렸을 때만 형식 안내 노출 (변경 없음은 조용히 버튼만 비활성)
    const showFormatHint = trimmed.length > 0 && !formatOk
    const canSubmit = changeable && formatOk && !unchanged && !submitting

    const submit = () => {
        if (canSubmit) onSubmit(trimmed)
    }

    /**
     * 무엇을 보여줄지 하나로 정한다. 우선순위: 변경 불가 안내 → 형식 안내 → 서버 에러.
     * `TextField`는 에러와 힌트를 동시에 띄우지 않으므로, 고를 책임이 화면에 있다.
     */
    const message =
        !changeable && changeableAt
            ? `${formatDate(changeableAt)}부터 바꿀 수 있어요.`
            : showFormatHint
              ? NICKNAME_HINT
              : error

    return (
        <AppScreen
            header={<PageHeader title="닉네임 수정" onBack={onBack} />}
            footer={
                <Button fullWidth onClick={submit} disabled={!canSubmit} loading={submitting}>
                    {submitting ? '저장 중…' : '변경하기'}
                </Button>
            }
        >
            <Text as="p" variant="secondary" className="pt-2">
                닉네임은 한 달에 한 번만 바꿀 수 있어요. 2~8자, 한글·영문·숫자·밑줄.
            </Text>

            <div className="pt-6">
                <TextField
                    label="닉네임"
                    hideLabel
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && submit()}
                    maxLength={NICKNAME_MAX}
                    disabled={!changeable || submitting}
                    error={message}
                    count={{ current: trimmed.length, max: NICKNAME_MAX }}
                />
            </div>
        </AppScreen>
    )
}
