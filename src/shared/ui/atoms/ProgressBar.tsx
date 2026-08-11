import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface ProgressBarProps {
    value: number // 0..1
    className?: string
    animate?: boolean
    /** 스크린리더용 설명. 예: "기본 도감 수집률" */
    label?: string
    /** 채움 색. 달성/완료 진행(챌린지 등)은 lime, 그 외는 primary (핸드오프 §Colors) */
    tone?: 'primary' | 'lime'
}

/**
 * §3.2 진행률 바. 기본 도감·챌린지 도감 전용.
 * 제작 도감에서는 사용 금지 (§6).
 */
export function ProgressBar({ value, className = '', animate = true, label, tone = 'primary' }: ProgressBarProps) {
    const reduceMotion = useReducedMotion()
    const ratio = Math.max(0, Math.min(1, value))
    const pct = ratio * 100
    const shouldAnimate = animate && !reduceMotion
    const fillClass = tone === 'lime' ? 'bg-lime-500' : 'bg-action-primary'

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
                initial={shouldAnimate ? { width: 0 } : false}
                animate={{ width: `${pct}%` }}
                transition={shouldAnimate ? { duration: 0.8, ease: 'easeOut' } : { duration: 0 }}
            />
        </div>
    )
}
