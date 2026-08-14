'use client'

import { useCallback, useEffect, useState } from 'react'
import { notFound, useParams, useRouter } from 'next/navigation'
import { MadeDexInfo } from '@/features/made/MadeDexInfo'
import { fetchMadeDexDetail, leaveMadeDex } from '@/features/made/api'
import { madeErrorMessage } from '@/features/made/errors'
import { parseMadeDexId } from '@/features/made/types'
import type { MadeDexDetail } from '@/features/made/types'
import { goBackOr, pushInApp } from '@/shared/lib/backNav'
import { ROUTES } from '@/shared/lib/routes'

/** `/made/[dexId]/info` 도감 정보 + 도감 관리 */
export default function MadeDexInfoPage() {
    const router = useRouter()
    const params = useParams<{ dexId: string }>()

    const dexId = parseMadeDexId(params.dexId)

    const [detail, setDetail] = useState<MadeDexDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [leaving, setLeaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const load = useCallback(async (madeDexId: number) => {
        setLoading(true)
        try {
            setDetail(await fetchMadeDexDetail(madeDexId))
            setError(null)
        } catch (failure) {
            setError(madeErrorMessage(failure, '도감 정보를 불러오지 못했어요.'))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (dexId) void load(dexId)
    }, [dexId, load])

    if (!dexId) notFound()

    const leave = async () => {
        setLeaving(true)
        setError(null)
        try {
            await leaveMadeDex(dexId)
            router.replace(ROUTES.made)
        } catch (failure) {
            setError(madeErrorMessage(failure, '탈퇴하지 못했어요. 잠시 후 다시 시도해 주세요.'))
            setLeaving(false)
        }
    }

    if (loading || !detail) {
        return (
            <div className="flex h-full items-center justify-center bg-surface-app">
                <p className="text-sm text-content-secondary">{error ?? '도감 정보를 불러오는 중…'}</p>
            </div>
        )
    }

    return (
        <MadeDexInfo
            detail={detail}
            leaving={leaving}
            error={error}
            onBack={() => goBackOr(router, ROUTES.madeDex(dexId))}
            onLeave={() => void leave()}
            onEditInfo={() => pushInApp(router, ROUTES.madeEdit(dexId))}
            // 초대 코드와 참여자 관리는 원래 한 화면이다 — 메뉴만 둘로 갈라져 있었다
            onManageMembers={() => pushInApp(router, ROUTES.madeParticipants(dexId))}
        />
    )
}
