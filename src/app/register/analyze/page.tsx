'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RegisterAnalyze } from '@/features/register/RegisterAnalyze'
import { useRegisterFlow } from '@/features/register/RegisterFlowContext'
import { goBackOr, pushInApp } from '@/shared/lib/backNav'
import { ROUTES } from '@/shared/lib/routes'

/** `/register/analyze` 등록 2단계 — 사진이 고른 음식과 맞는지 AI가 확인 */
export default function RegisterAnalyzePage() {
    const router = useRouter()
    const { uploadedPhotoKeys, selectedSlots } = useRegisterFlow()

    // 새로고침이나 직접 접근으로 상태가 비면 검증할 대상이 없다 — 1단계로 돌려보낸다
    const ready = uploadedPhotoKeys.length > 0 && selectedSlots.length > 0

    useEffect(() => {
        if (!ready) router.replace(ROUTES.register)
    }, [ready, router])

    if (!ready) return null

    return (
        <RegisterAnalyze
            // 단계 되돌리기는 `back` — 앞 단계를 다시 push하면 항목이 계속 늘어난다
            onBack={() => goBackOr(router, ROUTES.register)}
            onProceed={() => pushInApp(router, ROUTES.registerRecord)}
        />
    )
}
