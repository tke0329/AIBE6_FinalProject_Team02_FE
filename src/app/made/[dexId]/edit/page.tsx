'use client'

import { useCallback, useEffect, useState } from 'react'
import { notFound, useParams, useRouter } from 'next/navigation'
import { MadeDexEditForm } from '@/features/made/MadeDexEditForm'
import type { CoverImage } from '@/features/made/MadeDexFormFields'
import { fetchMadeDexDetail, updateMadeDex } from '@/features/made/api'
import { madeErrorMessage } from '@/features/made/errors'
import { parseMadeDexId } from '@/features/made/types'
import type { MadeDexDetail, MadeDexVisibility } from '@/features/made/types'
import { ROUTES } from '@/shared/lib/routes'
import { uploadImageToS3 } from '@/shared/lib/upload'

/** 표지 상태를 서버가 받는 key로 바꾼다. 새 파일이면 올리고, 그대로면 기존 key, 지웠으면 null */
async function resolveImageKey(image: CoverImage): Promise<string | null> {
    if (!image) return null
    if (!(image instanceof File)) return image.key
    return (await uploadImageToS3(image, image.name || 'cover.jpg')).key
}

/** `/made/[dexId]/edit` 도감 정보 변경 */
export default function MadeDexEditPage() {
    const router = useRouter()
    const params = useParams<{ dexId: string }>()

    const dexId = parseMadeDexId(params.dexId)

    const [detail, setDetail] = useState<MadeDexDetail | null>(null)
    const [error, setError] = useState<string | null>(null)

    const load = useCallback(async (madeDexId: number) => {
        try {
            setDetail(await fetchMadeDexDetail(madeDexId))
            setError(null)
        } catch (failure) {
            setError(madeErrorMessage(failure, '도감 정보를 불러오지 못했어요.'))
        }
    }, [])

    useEffect(() => {
        if (dexId) void load(dexId)
    }, [dexId, load])

    // URL로 직접 들어온 멤버에게 저장 UI를 보여주면 표지가 먼저 업로드되고 PUT에서야 막힌다
    useEffect(() => {
        if (dexId && detail && detail.myRole !== 'OWNER') {
            router.replace(ROUTES.madeInfo(dexId))
        }
    }, [dexId, detail, router])

    if (!dexId) notFound()

    const save = async (name: string, description: string, visibility: MadeDexVisibility, image: CoverImage) => {
        await updateMadeDex(dexId, {
            name,
            description: description || null,
            visibility,
            imageKey: await resolveImageKey(image),
        })
        router.replace(ROUTES.madeInfo(dexId))
    }

    if (!detail || detail.myRole !== 'OWNER') {
        return (
            <div className="flex h-full items-center justify-center bg-surface-app">
                <p className="text-sm text-content-secondary">{error ?? '도감 정보를 불러오는 중…'}</p>
            </div>
        )
    }

    return <MadeDexEditForm detail={detail} onSave={save} onBack={() => router.push(ROUTES.madeManage(dexId))} />
}
