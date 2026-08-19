'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface ProgressBarProps {
    value: number // 0..1
    className?: string
    animate?: boolean
    /** 스크린리더용 설명. 예: "기본 도감 수집률" */
    label?: string
    /**
     * 채움 색. **기본이 초록(`point`)이다.**
     *
     * 진행·달성·수집은 §1.1의 구분에서 "된 것"이라 초록을 쓴다. 예전 기본값은
     * 핑크였는데, 화면이 온통 핑크여서 바가 어디까지 찼는지 눈에 잘 안 들어왔다.
     * 핑크로 되돌려야 할 자리(주 액션의 일부로 보여야 할 때)만 `primary`를 준다
     */
    tone?: 'point' | 'primary'
    /**
     * 차오르기 시작을 늦춘다(초). 목록에서 여러 개가 나란히 있을 때 쓴다 —
     * 열 줄이 동시에 차면 하나가 커진 것처럼 보여 움직임이 안 읽힌다.
     * `animate={false}`거나 모션을 끈 사용자에게는 무시된다
     */
    delay?: number
    /**
     * 차오르기 **시작점**(0..1). 기본은 0.
     *
     * 해금 연출처럼 "원래 여기까지였는데 이만큼 늘었다"를 보여 줘야 할 때 쓴다.
     * 0에서 시작하면 늘어난 몫이 얼마인지가 안 보인다
     */
    from?: number
}

/**
 * §3.2 진행률 바. 기본 도감·챌린지 도감 전용.
 * 제작 도감에서는 사용 금지 (§6).
 */
export function ProgressBar({
    value,
    className = '',
    animate = true,
    label,
    tone = 'point',
    delay = 0,
    from = 0,
}: ProgressBarProps) {
    const reduceMotion = useReducedMotion()
    const ratio = Math.max(0, Math.min(1, value))
    const pct = ratio * 100
    const fromPct = Math.max(0, Math.min(1, from)) * 100
    const shouldAnimate = animate && !reduceMotion
    const fillClass = tone === 'primary' ? 'bg-action-primary' : 'bg-rind-500'

    return (
        <div
            role="progressbar"
            aria-label={label ?? '진행률'}
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            className={`h-2 w-full overflow-hidden rounded-full bg-neutral-200 ${className}`}
        >
            <motion.div
                className={`h-full rounded-full ${fillClass}`}
                initial={shouldAnimate ? { width: `${fromPct}%` } : false}
                animate={{ width: `${pct}%` }}
                transition={shouldAnimate ? { duration: 0.8, ease: 'easeOut', delay } : { duration: 0 }}
            />
        </div>
    )
}
