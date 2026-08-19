'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RevealCard, UnlockReveal } from '@/features/register/UnlockReveal'
import { useRegisterFlow } from '@/features/register/RegisterFlowContext'
import { useRegistrationExitHref } from '@/features/register/useRegistrationExit'
import { normalizeCategory } from '@/shared/data/dex'
import { useAppState, useDexState } from '@/shared/store/AppStateProvider'
import { ROUTES } from '@/shared/lib/routes'

/** `/register/unlock` 등록 완료 — 시그니처 해금 연출 (§7) */
export default function RegisterUnlockPage() {
    const router = useRouter()
    const exitHref = useRegistrationExitHref()
    const { unlockResult } = useRegisterFlow()
    const { registrationSource } = useAppState()
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

    // 기본 도감은 방금 등록한 음식이 있는 카테고리로 보낸다 — 홈으로 돌려보내면
    // 새로 붙은 스티커를 사용자가 직접 찾아야 한다. 제작·챌린지는 시작한 곳으로 되돌아간다.
    // 여러 칸을 한 번에 열었으면 첫 음식 기준이고, 전부 검토 대기여도 그 칸으로 데려간다
    const firstSlot = unlockResult.unlocked[0] ?? unlockResult.awaitingReview[0]
    const dexHref =
        registrationSource === 'basic' && firstSlot ? ROUTES.basicDex(normalizeCategory(firstSlot.category)) : exitHref

    return (
        <UnlockReveal
            cards={cards}
            awaitingReview={unlockResult.awaitingReview.map((slot) => slot.slotName)}
            collectedCount={unlockResult.collectedCount}
            totalSlots={unlockResult.totalSlots}
            /*
             * replace — 해금 연출은 등록의 **마지막 장면**이다. push로 얹으면 도감에서
             * 뒤로갈 때 이 화면으로 되돌아오는데, 그때는 플로우 상태가 이미 사라져
             * (`RegisterFlowProvider`는 /register 밖으로 나가면 언마운트) 빈 등록
             * 1단계로 튕긴다. 갈아 끼우면 도감 뒤가 등록 앞 단계로 이어진다
             */
            onGoDex={() => router.replace(dexHref)}
        />
    )
}
