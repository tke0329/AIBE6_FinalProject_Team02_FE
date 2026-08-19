'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { RegisterUpload } from '@/features/register/RegisterUpload'
import { useRegisterFlow } from '@/features/register/RegisterFlowContext'
import { useRegistrationExitHref } from '@/features/register/useRegistrationExit'
import { useAppState, useDexState } from '@/shared/store/AppStateProvider'
import { goBackOr, pushInApp } from '@/shared/lib/backNav'
import { ROUTES } from '@/shared/lib/routes'
import { Suspense, useEffect } from 'react'

/** `/register` 등록 1단계 — 사진 올리기 + 음식 이름 고르기 */
function RegisterUploadContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const exitHref = useRegistrationExitHref()
    const { entries } = useDexState()
    const { setSelectedFoodId } = useAppState()
    const { photosReady, selectedSlots, addSlot } = useRegisterFlow()
    const foodIdParam = searchParams.get('foodId')
    const foodId = foodIdParam ? Number(foodIdParam) : null

    useEffect(() => {
        if (foodId === null || !Number.isFinite(foodId)) return
        const entry = entries.find((item) => item.id === foodId)
        if (!entry) return
        setSelectedFoodId(entry.id)
        addSlot(entry)
    }, [addSlot, entries, foodId, setSelectedFoodId])

    return (
        <RegisterUpload
            entries={entries}
            canProceed={photosReady && selectedSlots.length > 0}
            /*
             * ←는 **왔던 자리로 되돌아간다**(`back`). `push(exitHref)`였을 때
             * 시작한 화면이 히스토리에 하나 더 쌓여, 뒤로가기가 등록 ↔ 그 화면을
             * 오가는 고리가 됐다 — 앱을 벗어날 방법이 없어 보였다.
             * 딥링크로 등록이 첫 항목일 때만 `exitHref`로 밀어 넣는다
             */
            onBack={() => goBackOr(router, exitHref)}
            onNext={() => pushInApp(router, ROUTES.registerAnalyze)}
        />
    )
}

export default function RegisterUploadPage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-full items-center justify-center bg-surface-app">
                    <p className="text-sm text-neutral-800">불러오는 중…</p>
                </div>
            }
        >
            <RegisterUploadContent />
        </Suspense>
    )
}
