import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface ProgressBarProps {
    value: number // 0..1
    className?: string
    animate?: boolean
    /** 스크린리더용 설명. 예: "기본 도감 수집률" */
    label?: string
}

/**
 * §3.2 진행률 바. 기본 도감·챌린지 도감 전용.
 * 제작 도감에서는 사용 금지 (§6).
 */
export function ProgressBar({ value, className = '', animate = true, label }: ProgressBarProps) {
    const reduceMotion = useReducedMotion()
    const ratio = Math.max(0, Math.min(1, value))
    const pct = ratio * 100
    const shouldAnimate = animate && !reduceMotion

    return (
        <div
            role="progressbar"
            aria-label={label ?? '진행률'}
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            className={`h-2 w-full overflow-hidden rounded-full bg-cream-300 ${className}`}
        >
            <motion.div
                className="h-full rounded-full bg-action-primary"
                initial={shouldAnimate ? { width: 0 } : false}
                animate={{ width: `${pct}%` }}
                transition={shouldAnimate ? { duration: 0.8, ease: 'easeOut' } : { duration: 0 }}
            />
        </div>
    )
}
