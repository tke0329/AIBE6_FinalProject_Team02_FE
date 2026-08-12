'use client'

import { ChallengeCreate } from '@/features/challenge/ChallengeCreate'
import { createChallenge, createRewardBadge, fetchCreationTickets } from '@/features/challenge/api'
import { ROUTES } from '@/shared/lib/routes'
import { uploadImageToS3 } from '@/shared/lib/upload'
import { useAppState } from '@/shared/store/AppStateProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Dialog } from '@/shared/ui'

const MONTHLY_LIMIT = 3

/** dataURL(캔버스/업로드 이미지) */
function dataUrlToBlob(dataUrl: string): Blob {
    const [meta, base64] = dataUrl.split(',')
    const mime = /:(.*?);/.exec(meta)?.[1] ?? 'image/png'
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    return new Blob([bytes], { type: mime })
}

/** `/challenge/new` 챌린지 개설 (월 3회 제한) */
export default function ChallengeCreatePage() {
    const router = useRouter()
    const { customBadge, setCustomBadge, resetChallengeDraft, challengeDraft } = useAppState()

    // 이번 달 개설 횟수 = 3 - 남은 개설권 (서버 기준)
    const [createdThisMonth, setCreatedThisMonth] = useState(0)
    const [alertMessage, setAlertMessage] = useState<string | null>(null)
    useEffect(() => {
        fetchCreationTickets()
            .then((t) => setCreatedThisMonth(MONTHLY_LIMIT - t.remaining))
            .catch(() => {})
    }, [])

    return (
        <>
            <ChallengeCreate
                createdThisMonth={createdThisMonth}
                customBadge={customBadge}
                onBack={() => {
                    setCustomBadge(null)
                    resetChallengeDraft()
                    router.push(ROUTES.challenge)
                }}
                onCreate={async (challenge) => {
                    try {
                        // 목표별 사진을 S3에 올려 key 확보하고 slots.imageKey로 전송
                        const slots = await Promise.all(
                            (challenge.targetRestaurants ?? []).map(async (t) => {
                                const imageKey = t.file ? (await uploadImageToS3(t.file, t.file.name)).key : null
                                return {
                                    foodName: t.name,
                                    imageKey,
                                    placeName: t.placeName ?? null,
                                    lat: t.lat ?? null,
                                    lng: t.lng ?? null,
                                    storeName: t.storeName ?? null,
                                    description: t.description ?? null,
                                }
                            }),
                        )

                        // 보상 뱃지는 개설 확정 시점에 생성 (중도 이탈 시 뱃지 row 안 생기게)
                        const badge = challenge.rewardBadge
                        let rewardBadgeId: number | null = null
                        if (badge?.code) {
                            // 프리셋 복제
                            rewardBadgeId = (
                                await createRewardBadge({
                                    name: badge.name,
                                    presetCode: badge.code,
                                })
                            ).badgeId
                        } else if (badge?.customImage) {
                            // 유저 제작(이미지 S3 업로드 후 key로 생성)
                            const blob = dataUrlToBlob(badge.customImage)
                            const { key } = await uploadImageToS3(blob, 'reward-badge.png')
                            rewardBadgeId = (await createRewardBadge({ name: badge.name, imageKey: key })).badgeId
                        }

                        // 대표 이미지 업로드(선택)
                        const imageKey = challenge.coverFile
                            ? (await uploadImageToS3(challenge.coverFile, 'challenge-cover.jpg')).key
                            : null

                        await createChallenge({
                            name: challenge.title,
                            imageKey,
                            description: challengeDraft.description.trim() || null, // 소개글(선택)
                            periodType: challengeDraft.periodType, // 상시 / 기간 한정
                            startsAt: null,
                            endsAt:
                                challengeDraft.periodType === 'LIMITED' && challengeDraft.endsAt
                                    ? new Date(challengeDraft.endsAt).toISOString()
                                    : null,
                            rewardBadgeId,
                            slots,
                        })
                        // 성공 → 위저드가 완료 화면을 보여주고, '확인'(onBack)에서 초기화·목록 이동
                    } catch (e) {
                        setAlertMessage(e instanceof Error ? e.message : '챌린지 개설에 실패했어요')
                    }
                }}
                onCustomBadge={() => router.push(ROUTES.challengeNewBadge)}
                onUsePreset={() => setCustomBadge(null)}
            />
            {alertMessage && <Dialog title="개설 실패" message={alertMessage} onClose={() => setAlertMessage(null)} />}
        </>
    )
}
