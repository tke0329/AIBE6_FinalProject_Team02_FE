'use client'

import { useRouter } from 'next/navigation'
import { BadgeCustom } from '@/features/challenge/BadgeCustom'
import { useAppState } from '@/shared/store/AppStateProvider'
import { ROUTES } from '@/shared/lib/routes'

/** `/challenge/new/badge` 완주 보상 뱃지 직접 만들기 */
export default function BadgeCustomPage() {
    const router = useRouter()
    const { setCustomBadge } = useAppState()

    return (
        <BadgeCustom
            onBack={() => router.push(ROUTES.challengeNew)}
            onSave={(badge) => {
                setCustomBadge(badge)
                router.push(ROUTES.challengeNew)
            }}
        />
    )
}
