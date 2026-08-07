import React from 'react'

interface HelpIconProps {
    /** 무엇에 대한 도움말인지. 접근 가능한 이름에 그대로 들어감 */
    label: string
    onClick: () => void
    className?: string
}

/**
 * §3.2 도감 타이틀 옆 `?` 도움말 트리거.
 * 그려지는 원은 24px이지만 터치 타깃은 44px (§5).
 */
export function HelpIcon({ label, onClick, className = '' }: HelpIconProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={`${label} 도움말 열기`}
            className={`flex min-h-touch min-w-touch shrink-0 items-center justify-center text-content-muted ${className}`}
        >
            <span
                aria-hidden
                className="flex h-6 w-6 items-center justify-center rounded-full bg-cream-200 text-xs font-bold"
            >
                ?
            </span>
        </button>
    )
}
