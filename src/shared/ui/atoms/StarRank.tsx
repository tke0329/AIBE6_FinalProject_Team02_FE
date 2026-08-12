import React from 'react'
import { StarIcon } from 'lucide-react'

interface StarRankProps {
    value: number // filled stars 0..3
    size?: number
}

export function StarRank({ value, size = 14 }: StarRankProps) {
    return (
        <div className="flex items-center gap-0.5" aria-label={`별 랭크 ${value} / 3`}>
            {[0, 1, 2].map((i) => (
                <StarIcon
                    key={i}
                    size={size}
                    className={i < value ? 'text-watermelon-500' : 'text-neutral-200'}
                    fill={i < value ? 'currentColor' : 'none'}
                    strokeWidth={2}
                />
            ))}
        </div>
    )
}
