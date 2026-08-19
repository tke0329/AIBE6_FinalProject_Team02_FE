'use client'

import { ChallengeDetail } from '@/features/challenge/ChallengeDetail'
import { RewardModal } from '@/features/challenge/RewardModal'
import {
    ChallengeDetailData,
    closeChallenge,
    deleteChallenge,
    fetchChallengeDetail,
    fetchRewardBadge,
    joinChallenge,
    leaveChallenge,
    RewardBadgeInfo,
    unlockSlot,
} from '@/features/challenge/api'
import { ChallengeData } from '@/features/challenge/types'
import { resolveBadgeImage } from '@/shared/data/badgeAssets'
import { goBackOr, pushInApp } from '@/shared/lib/backNav'
import { ROUTES } from '@/shared/lib/routes'
import { uploadImageToS3 } from '@/shared/lib/upload'
import { useAppState } from '@/shared/store/AppStateProvider'
import { BottomSheet, Dialog, TextField } from '@/shared/ui'
import { notFound, useParams, useRouter } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'

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
        tag: '수집형',
        dday: d.periodType === 'PERMANENT' ? '상시' : d.endsAt ? ddayLabel(d.endsAt) : '기간한정',
        participants: d.participantCount,
        owner: '',
        isCreator: d.owner, // 개설자 여부(삭제/종료 버튼 노출)
        joined: d.joined,
        completed: d.completed,
        coverUrl: d.imageUrl ?? undefined,
        ended: d.periodType === 'LIMITED' && !!d.endsAt && new Date(d.endsAt).getTime() <= Date.now(),
        mine: `나 ${unlocked}/${total}`,
        progress: total ? unlocked / total : 0, // ProgressBar는 0~1 비율
        target: total,
        targetRestaurants: d.slots.map((s) => ({
            id: String(s.id),
            name: s.foodName,
            emoji: '🍽️',
            imageUrl: s.imageUrl ?? undefined,
            storeName: s.storeName ?? undefined,
            placeName: s.placeName,
            myImageUrl: s.myImageUrl,
            unlockedAt: s.unlockedAt,
        })),
        completedTargetIds: d.slots.filter((s) => s.unlocked).map((s) => String(s.id)),
    }
}

// 되돌릴 수 없는 동작(종료/삭제) 전 방어 — 경고 + 챌린짓 이름을 그대로 입력해야 실행
function ConfirmByNameSheet({
    title,
    warning,
    confirmLabel,
    danger,
    expectedName,
    onCancel,
    onConfirm,
}: {
    title: string
    warning: string
    confirmLabel: string
    danger?: boolean
    expectedName: string
    onCancel: () => void
    onConfirm: () => void
}) {
    const [value, setValue] = useState('')
    const ok = value.trim().length > 0 && value.trim() === expectedName.trim()
    return (
        <BottomSheet title={title} onClose={onCancel}>
            <div className="space-y-4 px-5 pb-8 pt-2">
                <p className="whitespace-pre-line rounded-xl bg-watermelon-50 p-3 text-sm text-watermelon-700">{warning}</p>
                <div>
                    <p className="mb-2 text-xs text-neutral-500">계속하려면 아래 챌린짓 이름을 그대로 입력하세요.</p>
                    <p className="mb-2 rounded-lg bg-neutral-100 px-3 py-2 text-center text-sm font-bold text-neutral-800">
                        {expectedName || '(이름 없음)'}
                    </p>
                    <TextField
                        autoFocus
                        label="챌린짓 이름 확인"
                        hideLabel
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="챌린짓 이름 입력"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="min-h-touch flex-1 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-700"
                    >
                        취소
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!ok}
                        className={`min-h-touch flex-1 rounded-xl text-sm font-bold text-white disabled:bg-action-disabled-bg disabled:text-action-disabled-text ${danger ? 'bg-watermelon-500' : 'bg-neutral-900'}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </BottomSheet>
    )
}

/** `/challenge/[id]` 챌린지 상세 */
function ChallengeDetailPageInner() {
    const router = useRouter()
    const { id } = useParams<{ id: string }>()
    const { startRegistration } = useAppState()

    const [challenge, setChallenge] = useState<ChallengeData | null>(null)
    const [missing, setMissing] = useState(false)
    const [rewardBadge, setRewardBadge] = useState<RewardBadgeInfo | null>(null)
    const [showReward, setShowReward] = useState(false)
    const [alertMessage, setAlertMessage] = useState<string | null>(null)
    const [confirmLeave, setConfirmLeave] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [confirmClose, setConfirmClose] = useState(false)
    const reqRef = useRef(0) // 최신 요청만 반영 — 다른 챌린짓 응답이 늦게 도착해 덮는 것 방지

    /** 상세 재조회. **프로미스를 돌려준다** — 해금 직후에는 이게 끝난 뒤라야 화면이 진실을 안다 */
    const load = useCallback(() => {
        const token = ++reqRef.current
        return fetchChallengeDetail(id)
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
            <div className="flex h-full items-center justify-center bg-surface-app">
                <p className="text-sm text-neutral-800">불러오는 중…</p>
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
                  tone: 'bg-watermelon-100 text-watermelon-700',
                  code: rewardBadge.code ?? undefined,
                  customImage: resolveBadgeImage(rewardBadge.code, rewardBadge.imageUrl) ?? undefined,
              },
          }
        : challenge

    return (
        <div className="relative h-full">
            <ChallengeDetail
                challenge={challengeWithReward}
                // 앞 항목이 있으면 그 자리로. 공유·딥링크로 첫 화면으로 열린 경우만 목록으로 밀어 넣는다
                onBack={() => goBackOr(router, ROUTES.challenge)}
                onJoin={async () => {
                    try {
                        await joinChallenge(id)
                        load() // 참여 후 상태 갱신
                    } catch (e) {
                        setAlertMessage(e instanceof Error ? e.message : '참여에 실패했어요')
                    }
                }}
                onLeave={() => setConfirmLeave(true)}
                onDelete={() => setConfirmDelete(true)}
                onCloseChallenge={() => setConfirmClose(true)}
                onUnlock={async (slotId, file, coords) => {
                    // 위치·에러 처리는 해금 위저드가 담당. 여기선 업로드 → 해금만 (실패는 throw)
                    const { key } = await uploadImageToS3(file, file.name)
                    const res = await unlockSlot(id, slotId, key, coords?.lat ?? null, coords?.lng ?? null)
                    /*
                     * 재조회를 **기다린 뒤에** 성공을 알린다.
                     *
                     * 안 기다리면 위저드가 먼저 끝나고 그 뒤에 목록이 갱신된다. 그 틈에
                     * 화면은 "아직 미해금"으로 보므로, 상세를 여는 쪽이 별도의 "방금 해금함"
                     * 상태를 들고 있어야 했다. 진실을 두 곳에 두지 않으려고 여기서 맞춘다
                     */
                    await load()
                    return { completed: res.completed }
                }}
                /*
                 * 위저드(리뷰 단계)까지 끝난 뒤 완주 보상 팝업
                 */
                onUnlockCompleted={() => setShowReward(true)}
                onRegister={() => {
                    startRegistration('challenge', challenge.id)
                    pushInApp(router, ROUTES.register)
                }}
            />
            {showReward && rewardBadge && (
                <RewardModal
                    badge={rewardBadge}
                    onClose={() => setShowReward(false)}
                    onGoToBadges={() => pushInApp(router, ROUTES.myBadges)}
                />
            )}
            {alertMessage && <Dialog title="오류" message={alertMessage} onClose={() => setAlertMessage(null)} />}
            {confirmLeave && (
                <Dialog
                    title="챌린짓 포기"
                    message="이 챌린짓을 포기할까요? 내 인증 기록도 사라져요."
                    cancelText="계속하기"
                    danger
                    onClose={() => setConfirmLeave(false)}
                    action={{
                        label: '포기하기',
                        onClick: async () => {
                            setConfirmLeave(false)
                            try {
                                await leaveChallenge(id)
                                // replace — 포기한 챌린짓 상세로 뒤로가기가 되돌아가면 안 된다
                                router.replace(ROUTES.challenge)
                            } catch (e) {
                                setAlertMessage(e instanceof Error ? e.message : '나가기에 실패했어요')
                            }
                        },
                    }}
                />
            )}
            {confirmClose && (
                <ConfirmByNameSheet
                    title="챌린짓 종료"
                    warning={'종료하면 새로운 참여를 받지 않고 되돌릴 수 없어요.\n그래도 종료하려면 아래에 챌린짓 이름을 입력하세요.'}
                    confirmLabel="종료하기"
                    expectedName={challenge.title}
                    onCancel={() => setConfirmClose(false)}
                    onConfirm={async () => {
                        setConfirmClose(false)
                        try {
                            await closeChallenge(id)
                            load()
                        } catch (e) {
                            setAlertMessage(e instanceof Error ? e.message : '종료에 실패했어요')
                        }
                    }}
                />
            )}
            {confirmDelete && (
                <ConfirmByNameSheet
                    title="챌린짓 삭제"
                    warning={'삭제하면 참여자 기록·리뷰·사진까지 모두 사라지고 되돌릴 수 없어요.\n그래도 삭제하려면 아래에 챌린짓 이름을 입력하세요.'}
                    confirmLabel="삭제하기"
                    danger
                    expectedName={challenge.title}
                    onCancel={() => setConfirmDelete(false)}
                    onConfirm={async () => {
                        setConfirmDelete(false)
                        try {
                            await deleteChallenge(id)
                            router.replace(ROUTES.challenge)
                        } catch (e) {
                            setAlertMessage(e instanceof Error ? e.message : '삭제에 실패했어요')
                        }
                    }}
                />
            )}
        </div>
    )
}

export default function ChallengeDetailPage() {
    return (
        <Suspense fallback={null}>
            <ChallengeDetailPageInner />
        </Suspense>
    )
}
