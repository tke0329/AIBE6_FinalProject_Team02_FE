'use client'

import { notFound, useParams, useRouter } from 'next/navigation'
import { RecordForm } from '@/features/made/RecordForm'
import { parseMadeDexId } from '@/features/made/types'
import { ROUTES } from '@/shared/lib/routes'

/** `/made/[dexId]/records/[recordId]/edit` 기록 수정 */
export default function EditRecordPage() {
    const router = useRouter()
    const params = useParams<{ dexId: string; recordId: string }>()

    const dexId = parseMadeDexId(params.dexId)
    const recordId = Number(params.recordId)
    if (!dexId || !Number.isSafeInteger(recordId) || recordId <= 0) notFound()

    // 날짜·끼니는 기록에서 읽어 채우므로 여기서 넘기지 않는다
    return (
        <RecordForm
            madeDexId={dexId}
            recordId={recordId}
            date=""
            onBack={() => router.back()}
            onDone={() => router.replace(ROUTES.madeDex(dexId))}
        />
    )
}
