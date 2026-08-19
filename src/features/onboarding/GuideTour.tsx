'use client'

import { CoachTour } from '@/shared/ui'
import { GUIDES } from './guides'
import type { Guide } from './useGuide'

/**
 * `useGuide`가 준 상태를 그대로 그린다.
 * 화면 쪽 배선을 `<GuideTour guide={guide} />` 한 줄로 끝내려고 둔 얇은 겹
 */
export function GuideTour({ guide }: { guide: Guide }) {
    if (!guide.open) return null
    const { label, steps } = GUIDES[guide.key]
    return <CoachTour steps={steps} label={label} onClose={guide.close} />
}
