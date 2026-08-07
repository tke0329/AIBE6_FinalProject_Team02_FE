'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { RegisterUpload } from '@/features/register/RegisterUpload'
import { useRegisterFlow } from '@/features/register/RegisterFlowContext'
import { useRegistrationExitHref } from '@/features/register/useRegistrationExit'
import { useAppState, useDexState } from '@/shared/store/AppStateProvider'
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
            onBack={() => router.push(exitHref)}
            onNext={() => router.push(ROUTES.registerAnalyze)}
        />
    )
}

export default function RegisterUploadPage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-full items-center justify-center bg-cream-100">
                    <p className="text-sm text-brown-soft">불러오는 중…</p>
                </div>
            }
        >
            <RegisterUploadContent />
        </Suspense>
    )
}
