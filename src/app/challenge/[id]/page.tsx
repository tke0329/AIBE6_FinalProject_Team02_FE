'use client'

import { ChallengeDetail } from '@/features/challenge/ChallengeDetail'
import { RewardModal } from '@/features/challenge/RewardModal'
import {
    ChallengeDetailData,
    fetchChallengeDetail,
    fetchRewardBadge,
    joinChallenge,
    leaveChallenge,
    RewardBadgeInfo,
    unlockSlot,
} from '@/features/challenge/api'
import { ChallengeData } from '@/features/challenge/types'
import { resolveBadgeImage } from '@/shared/data/badgeAssets'
import { ROUTES } from '@/shared/lib/routes'
import { uploadImageToS3 } from '@/shared/lib/upload'
import { useAppState } from '@/shared/store/AppStateProvider'
import { notFound, useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertModal } from '@/shared/ui/molecules/AlertModal'

function ddayLabel(endsAt: string) {
    const days = Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86_400_000)
    return days >= 0 ? `D-${days}` : '종료'
}

/** 위치 인증용 현재 좌표 취득 (권한 필요) */
/** BE 상세 → 화면용 ChallengeData */
function toChallengeData(d: ChallengeDetailData): ChallengeData {
    const total = d.slots.length
    const unlocked = d.slots.filter((s) => s.unlocked).length
    return {
        id: String(d.id),
        title: d.name,
        emoji: '🏆',
        tag: d.challengeType === 'FIRST_COME' ? '선착순' : '수집형',
        dday: d.periodType === 'PERMANENT' ? '상시' : d.endsAt ? ddayLabel(d.endsAt) : '기간한정',
        participants: d.participantCount,
        owner: '',
        joined: d.joined,
        completed: d.completed,
        verifyType: d.verifyType,
        ended: d.periodType === 'LIMITED' && !!d.endsAt && new Date(d.endsAt).getTime() <= Date.now(),
        mine: `나 ${unlocked}/${total}`,
        progress: total ? unlocked / total : 0, // ProgressBar는 0~1 비율
        target: total,
        targetRestaurants: d.slots.map((s) => ({
            id: String(s.id),
            name: s.foodName,
            emoji: '🍽️',
            imageUrl: s.imageUrl ?? undefined,
            placeName: s.placeName,
            myImageUrl: s.myImageUrl,
            unlockedAt: s.unlockedAt,
        })),
        completedTargetIds: d.slots.filter((s) => s.unlocked).map((s) => String(s.id)),
    }
}

/** `/challenge/[id]` 챌린지 상세 */
export default function ChallengeDetailPage() {
    const router = useRouter()
    const { id } = useParams<{ id: string }>()
    const { startRegistration } = useAppState()

    const [challenge, setChallenge] = useState<ChallengeData | null>(null)
    const [missing, setMissing] = useState(false)
    const [rewardBadge, setRewardBadge] = useState<RewardBadgeInfo | null>(null)
    const [showReward, setShowReward] = useState(false)
    const [alertMessage, setAlertMessage] = useState<string | null>(null)
    const reqRef = useRef(0) // 최신 요청만 반영 — 다른 챌린지 응답이 늦게 도착해 덮는 것 방지

    const load = useCallback(() => {
        const token = ++reqRef.current
        fetchChallengeDetail(id)
            .then((d) => {
                if (token !== reqRef.current) return // 더 최신 요청이 있으면 무시
                setChallenge(toChallengeData(d))
                // 완료 팝업/미리보기용 보상 뱃지 정보
                if (d.rewardBadgeId) {
                    fetchRewardBadge(d.rewardBadgeId)
                        .then((rb) => {
                            if (token === reqRef.current) setRewardBadge(rb)
                        })
                        .catch(() => {})
                } else {
                    setRewardBadge(null)
                }
            })
            .catch(() => {
                if (token === reqRef.current) setMissing(true)
            })
    }, [id])

    useEffect(() => {
        load()
    }, [load])

    if (missing) notFound()
    if (!challenge) {
        return (
            <div className="flex h-full items-center justify-center bg-cream-100">
                <p className="text-sm text-brown-soft">불러오는 중…</p>
            </div>
        )
    }

    // 상세의 "완주 보상 뱃지" 섹션용 — 받아둔 보상 뱃지를 rewardBadge로 흘려보냄
    const challengeWithReward: ChallengeData = rewardBadge
        ? {
              ...challenge,
              rewardBadge: {
                  emoji: '🏆',
                  name: rewardBadge.name,
                  tone: 'bg-orange-100 text-orange-700',
                  code: rewardBadge.code ?? undefined,
                  customImage: resolveBadgeImage(rewardBadge.code, rewardBadge.imageUrl) ?? undefined,
              },
          }
        : challenge

    return (
        <>
            <ChallengeDetail
                challenge={challengeWithReward}
                onBack={() => {
                    // 목록에서 들어온 경우만 뒤로가기(그 자리로). 공유·딥링크 진입은 앱 목록으로
                    if (typeof window !== 'undefined' && sessionStorage.getItem('challenge:fromList') === '1') {
                        sessionStorage.removeItem('challenge:fromList')
                        router.back()
                    } else {
                        router.push(ROUTES.challenge)
                    }
                }}
                onJoin={async () => {
                    try {
                        await joinChallenge(id)
                        load() // 참여 후 상태 갱신
                    } catch (e) {
                        setAlertMessage(e instanceof Error ? e.message : '참여에 실패했어요')
                    }
                }}
                onLeave={async () => {
                    if (!confirm('이 챌린지를 포기할까요? 내 인증 기록도 사라져요.')) return
                    try {
                        await leaveChallenge(id)
                        router.push(ROUTES.challenge) // 나가면 목록으로
                    } catch (e) {
                        setAlertMessage(e instanceof Error ? e.message : '나가기에 실패했어요')
                    }
                }}
                onUnlock={async (slotId, file, coords) => {
                    // 위치·에러 처리는 인증 모달이 담당. 여기선 업로드 → 해금만 (실패는 throw)
                    const { key } = await uploadImageToS3(file, file.name)
                    const res = await unlockSlot(id, slotId, key, coords?.lat ?? null, coords?.lng ?? null)
                    // 이번 해금으로 막 완주했으면 축하 팝업
                    if (res.completed && !challenge?.completed) setShowReward(true)
                    load() // 진행도 갱신
                }}
                onRegister={() => {
                    startRegistration('challenge', challenge.id)
                    router.push(ROUTES.register)
                }}
            />
            {showReward && rewardBadge && (
                <RewardModal
                    badge={rewardBadge}
                    onClose={() => setShowReward(false)}
                    onGoToBadges={() => router.push(ROUTES.myBadges)}
                />
            )}
            {alertMessage && <AlertModal title="오류" message={alertMessage} onClose={() => setAlertMessage(null)} />}
        </>
    )
}
