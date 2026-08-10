'use client'

import { useEffect } from 'react'
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation'
import { RecordForm } from '@/features/made/RecordForm'
import { parseMadeDexId } from '@/features/made/types'
import { ROUTES } from '@/shared/lib/routes'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** `/made/[dexId]/records/new` 식사 기록 */
export default function NewRecordPage() {
    const router = useRouter()
    const params = useParams<{ dexId: string }>()
    const search = useSearchParams()

    const dexId = parseMadeDexId(params.dexId)
    const date = search.get('date') ?? ''
    // 폼에는 날짜를 고치는 자리가 없다. 어느 날인지 모른 채로는 기록을 만들 수 없다
    const dated = DATE_PATTERN.test(date)

    useEffect(() => {
        if (dexId && !dated) router.replace(ROUTES.madeDex(dexId))
    }, [dexId, dated, router])

    if (!dexId) notFound()
    if (!dated) return null

    // 슬롯 카드로 들어오면 끼니가 정해져 있고, 하단 CTA로 들어오면 화면에서 고른다
    const slotId = Number(search.get('slotId'))

    return (
        <RecordForm
            madeDexId={dexId}
            slotId={Number.isSafeInteger(slotId) && slotId > 0 ? slotId : undefined}
            date={date}
            onBack={() => router.back()}
            onDone={() => router.replace(ROUTES.madeDex(dexId))}
        />
    )
}
