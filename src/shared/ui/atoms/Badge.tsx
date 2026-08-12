import React from 'react'

/**
 * §3.2 상태 뱃지. 새 형태가 필요하면 컴포넌트를 만들지 말고 variant를 추가할 것.
 *
 * - `dday`   D-3 같은 남은 기간
 * - `type`   카운트/위치인증 등 분류 라벨
 * - `member` 참여자 이니셜 아바타 (겹쳐 쌓는 용도)
 * - `reward` 완주 보상 뱃지 (이모지 또는 커스텀 이미지)
 */
export type BadgeVariant = 'dday' | 'type' | 'member' | 'reward'

interface BadgeProps {
    variant: BadgeVariant
    children?: React.ReactNode
    className?: string
    /** reward 전용 — 커스텀 뱃지 이미지 URL */
    imageSrc?: string
    /** reward/member 전용 — 접근 가능한 이름 */
    label?: string
}

const variantClass: Record<BadgeVariant, string> = {
    dday: 'inline-flex items-center rounded-full bg-watermelon-100 px-2 py-1 text-xs font-bold text-watermelon-600',
    type: 'inline-flex items-center rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium text-content-secondary',
    member: 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white bg-watermelon-100 text-xs font-bold text-watermelon-600',
    reward: 'flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/60 text-2xl',
}

export function Badge({ variant, children, className = '', imageSrc, label }: BadgeProps) {
    if (variant === 'reward') {
        return (
            <span className={`${variantClass.reward} ${className}`}>
                {imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element -- 사용자가 캔버스로 그린 dataURL이라 next/image 최적화 대상이 아님
                    <img src={imageSrc} alt={label ?? '보상 뱃지'} className="h-full w-full object-cover" />
                ) : (
                    <span aria-hidden>{children}</span>
                )}
            </span>
        )
    }

    if (variant === 'member') {
        return (
            <span className={`${variantClass.member} ${className}`} title={label} aria-label={label}>
                <span aria-hidden>{children}</span>
            </span>
        )
    }

    return <span className={`${variantClass[variant]} ${className}`}>{children}</span>
}
