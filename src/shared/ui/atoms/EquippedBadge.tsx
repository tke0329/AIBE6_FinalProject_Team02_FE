import React from 'react'
import { SparklesIcon, UtensilsIcon } from 'lucide-react'

export type BadgeId = 'silver-spoon' | 'spring-discoverer' | 'gold-spoon'

interface EquippedBadgeProps {
    badge?: BadgeId
    label?: string
    size?: number
}

const badgeConfig: Record<BadgeId, { label: string; icon: React.ReactNode; color: string }> = {
    'silver-spoon': { label: '은수저 수집가', icon: <UtensilsIcon />, color: 'text-slate-400' },
    'spring-discoverer': {
        label: '봄 제철 탐험가',
        icon: <SparklesIcon />,
        color: 'text-pink-500',
    },
    'gold-spoon': { label: '금수저 수집가', icon: <UtensilsIcon />, color: 'text-amber-500' },
}

export function badgeLabel(badge: BadgeId) {
    return badgeConfig[badge].label
}

/** Small earned badge placed immediately before a member's nickname. */
export function EquippedBadge({ badge = 'silver-spoon', label, size = 17 }: EquippedBadgeProps) {
    const config = badgeConfig[badge]
    return (
        <span
            className={`inline-flex shrink-0 items-center ${config.color}`}
            title={`대표 뱃지: ${label ?? config.label}`}
            aria-label={`대표 뱃지: ${label ?? config.label}`}
            style={{ width: size, height: size }}
        >
            {React.cloneElement(config.icon as React.ReactElement<{ size?: number; strokeWidth?: number }>, {
                size,
                strokeWidth: 2.4,
            })}
        </span>
    )
}

export function BadgeMark({ badge, size = 16 }: { badge: BadgeId; size?: number }) {
    return <EquippedBadge badge={badge} size={size} />
}

export function BadgeMedalIcon({ badge, className = '' }: { badge: BadgeId; className?: string }) {
    const config = badgeConfig[badge]
    return (
        <span className={`inline-flex h-full w-full items-center justify-center ${config.color} ${className}`}>
            {React.cloneElement(config.icon as React.ReactElement<{ size?: number; strokeWidth?: number }>, {
                size: 26,
                strokeWidth: 2.1,
            })}
        </span>
    )
}
