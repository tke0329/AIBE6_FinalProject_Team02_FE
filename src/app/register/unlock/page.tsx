'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RevealCard, UnlockReveal } from '@/features/register/UnlockReveal'
import { useRegisterFlow } from '@/features/register/RegisterFlowContext'
import { useRegistrationExitHref } from '@/features/register/useRegistrationExit'
import { useDexState } from '@/shared/store/AppStateProvider'
import { ROUTES } from '@/shared/lib/routes'

/** `/register/unlock` 등록 완료 — 시그니처 해금 연출 (§7) */
export default function RegisterUnlockPage() {
    const router = useRouter()
    const exitHref = useRegistrationExitHref()
    const { unlockResult } = useRegisterFlow()
    const { findEntry } = useDexState()

    useEffect(() => {
        if (!unlockResult) router.replace(ROUTES.register)
    }, [unlockResult, router])

    if (!unlockResult) return null

    // 서버 응답에는 일러스트가 없다 — 이미 받아 둔 도감 200칸에서 붙인다
    const cards: RevealCard[] = unlockResult.unlocked.map((slot) => {
        const entry = findEntry(slot.slotId)
        return {
            slotId: slot.slotId,
            name: slot.slotName,
            emoji: entry?.emoji ?? '🍽️',
            illustrationUrl: entry?.illustrationUrl,
            rank: slot.rank,
            firstUnlock: slot.firstUnlock,
        }
    })

    return (
        <UnlockReveal
            cards={cards}
            awaitingReview={unlockResult.awaitingReview.map((slot) => slot.slotName)}
            collectedCount={unlockResult.collectedCount}
            totalSlots={unlockResult.totalSlots}
            onGoDex={() => router.push(exitHref)}
        />
    )
}
