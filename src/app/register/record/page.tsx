'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RegisterRecord } from '@/features/register/RegisterRecord'
import { useRegisterFlow } from '@/features/register/RegisterFlowContext'
import { CardInput, LocationInput, confirmRegistration } from '@/features/register/confirmApi'
import { goBackOr } from '@/shared/lib/backNav'
import { ROUTES } from '@/shared/lib/routes'
import { useDexState } from '@/shared/store/AppStateProvider'

/** `/register/record` 등록 3단계 — 음식별 기록 후 도감 해금 */
export default function RegisterRecordPage() {
    const router = useRouter()
    const { registrationId, recordSlots, setUnlockResult } = useRegisterFlow()
    const { refreshEntries } = useDexState()

    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // 검증을 통과한 칸이 없으면 기록할 것도 없다
    const ready = registrationId !== null && recordSlots.length > 0

    useEffect(() => {
        if (!ready) router.replace(ROUTES.register)
    }, [ready, router])

    if (!ready) return null

    const submit = (cards: CardInput[], location: LocationInput | null) => {
        setSubmitting(true)
        setError(null)

        confirmRegistration(registrationId, cards, location)
            .then((result) => {
                setUnlockResult(result)
                // 홈으로 돌아갔을 때 새로고침 없이 바로 해금 결과가 보이도록 도감을 다시 불러온다.
                refreshEntries()
                // replace — 이미 보낸 기록 화면으로 뒤로 돌아가 다시 제출할 수 있으면 안 된다
                router.replace(ROUTES.registerUnlock)
            })
            .catch((cause: unknown) => {
                setError(cause instanceof Error ? cause.message : '등록에 실패했어요')
                setSubmitting(false)
            })
    }

    return (
        <RegisterRecord
            submitting={submitting}
            error={error}
            onBack={() => goBackOr(router, ROUTES.registerAnalyze)}
            onSubmit={submit}
        />
    )
}
