'use client'

import React from 'react'
import { ArrowLeftIcon } from 'lucide-react'
import { ProgressBar } from '../atoms/ProgressBar'

interface WizardHeaderProps {
    /** 0부터. 표시는 +1 */
    step: number
    total: number
    onBack: () => void
    /** 뒤로가기 설명. 첫 단계에서 화면을 나가는 경우 등 */
    backLabel?: string
    /** 무엇을 만드는 중인지. 스크린리더가 읽는 진행 바 이름에 들어간다 */
    label?: string
}

/**
 * 여러 단계로 만드는 화면의 머리글 — 뒤로가기 + 진행 바 + `2/5`.
 *
 * **로그잇 개설과 챌린짓 개설이 같은 것을 쓴다.** 원래 로그잇은 동그란 숫자 점,
 * 챌린짓은 진행 바여서 같은 앱의 두 화면이 다른 앱처럼 보였다. 여기로 모아 두면
 * 다시 갈라지지 않는다.
 *
 * ## 바는 공통 `ProgressBar`를 그대로 쓴다
 *
 * 처음에는 여기서 직접 그렸다. 그러면 앱에 진행 바가 두 종류(수집률 바 / 개설 바)가
 * 생기고, 트랙 색·높이·움직임이 조금씩 어긋난다. 같은 것을 쓰면 그럴 일이 없다.
 *
 * ## 색은 초록이다
 *
 * §1.1.1의 구분을 **요소의 뜻**으로 읽는다 — 진행 바는 어느 화면에 있든 "차오르는 것",
 * 즉 "된 것"이다. 처음에는 "만드는 도중이니 하는 것"이라며 핑크로 뒀는데, 그러면 같은
 * 모양의 바가 화면에 따라 색이 달라져 규칙이 오히려 어지러워진다. 화면이 아니라
 * 요소로 가르는 쪽이 맞다.
 */
export function WizardHeader({ step, total, onBack, backLabel = '뒤로가기', label = '개설' }: WizardHeaderProps) {
    return (
        <header className="flex shrink-0 items-center gap-3 px-5 pb-2 pt-4">
            <button type="button" onClick={onBack} aria-label={backLabel} className="min-h-touch shrink-0">
                <ArrowLeftIcon size={22} aria-hidden className="text-content-primary" />
            </button>

            <ProgressBar
                value={(step + 1) / total}
                label={`${label} 진행 ${step + 1}/${total}단계`}
                className="flex-1"
            />

            {/* 바만 있으면 몇 단계 남았는지 세어야 한다. 숫자를 옆에 같이 둔다 */}
            <span aria-hidden className="shrink-0 text-xs font-bold tabular-nums text-content-secondary">
                {step + 1}/{total}
            </span>
        </header>
    )
}
