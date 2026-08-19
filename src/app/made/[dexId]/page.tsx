'use client'

import { useEffect, useState } from 'react'
import { notFound, useParams, useRouter } from 'next/navigation'
import { LogitHome } from '@/features/made/LogitHome'
import { fetchMadeDexDetail } from '@/features/made/api'
import { parseMadeDexId } from '@/features/made/types'
import { goBackOr, pushInApp } from '@/shared/lib/backNav'
import { getTabHref, ROUTES } from '@/shared/lib/routes'

/** `/made/[dexId]` 로그잇 홈 — 오늘의 식탁 */
export default function LogitHomePage() {
    const router = useRouter()
    const params = useParams<{ dexId: string }>()
    const [title, setTitle] = useState('로그잇')

    const dexId = parseMadeDexId(params.dexId)

    // 이름을 못 읽어도 식탁은 열려야 한다. 실패는 기본 제목으로 둔다
    useEffect(() => {
        if (!dexId) return
        fetchMadeDexDetail(dexId)
            .then((detail) => setTitle(detail.name))
            .catch(() => undefined)
    }, [dexId])

    if (!dexId) notFound()

    return (
        <LogitHome
            dexId={dexId}
            title={title}
            onBack={() => goBackOr(router, ROUTES.made)}
            onOpenInfo={() => pushInApp(router, ROUTES.madeInfo(dexId))}
            onRecord={(date, slotId) => router.push(ROUTES.madeRecordNew(dexId, date, slotId))}
            onEditRecord={(recordId) => router.push(ROUTES.madeRecordEdit(dexId, recordId))}
            // 내 아바타는 마이페이지로 — 남의 프로필 화면에서 내 것만 볼 수 있는 게 없다
            onOpenProfile={(userId, me) => router.push(me ? ROUTES.my : ROUTES.userProfile(userId))}
            onTab={(tab) => router.push(getTabHref(tab))}
        />
    )
}
