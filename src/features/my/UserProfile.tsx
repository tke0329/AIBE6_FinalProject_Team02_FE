'use client'

import { useEffect, useState } from 'react'
import { ArrowLeftIcon, UserPlusIcon, UserCheckIcon, XIcon, CheckIcon } from 'lucide-react'
import { BottomNav, NavTab } from '@/shared/ui/molecules/BottomNav'
import { TabBar } from '@/shared/ui/molecules/TabBar'
import { ServerBadge } from '@/shared/ui/atoms/ServerBadge'
import { ProgressBar } from '@/shared/ui/atoms/ProgressBar'
import {
    PublicProfile,
    RelationStatus,
    UserBasicDexItem,
    fetchPublicProfile,
    fetchUserBasicDex,
    fetchUserChallenges,
    sendFriendRequest,
    removeFriend,
    fetchFriendRequests,
    acceptFriendRequest,
    deleteFriendRequest,
} from '@/features/friend/api'
import type { ChallengeSummary, MyChallengeRelation } from '@/features/challenge/api'

const TABS = ['기본도감', '챌린지도감'] as const
const SUBTABS = ['개설한', '참여 중', '완료한'] as const
const RELATION: Record<(typeof SUBTABS)[number], MyChallengeRelation> = {
    개설한: 'CREATED',
    '참여 중': 'JOINED',
    완료한: 'COMPLETED',
}

interface Props {
    userId: number | 'me'
    onBack: () => void
    onTab: (tab: NavTab) => void
    onOpenUser: (id: number) => void
}

export function UserProfile({ userId, onBack, onTab }: Props) {
    const [profile, setProfile] = useState<PublicProfile | null>(null)
    const [tab, setTab] = useState<(typeof TABS)[number]>('기본도감')
    const [subtab, setSubtab] = useState<(typeof SUBTABS)[number]>('참여 중')
    const [basicDex, setBasicDex] = useState<UserBasicDexItem[]>([])
    const [challenges, setChallenges] = useState<ChallengeSummary[]>([])

    const reload = () =>
        fetchPublicProfile(userId)
            .then(setProfile)
            .catch(() => {})

    useEffect(() => {
        reload()
    }, [userId])
    useEffect(() => {
        if (tab === '기본도감')
            fetchUserBasicDex(userId)
                .then(setBasicDex)
                .catch(() => setBasicDex([]))
    }, [tab, userId])
    useEffect(() => {
        if (tab === '챌린지도감')
            fetchUserChallenges(userId, RELATION[subtab])
                .then(setChallenges)
                .catch(() => setChallenges([]))
    }, [tab, subtab, userId])

    if (!profile) {
        return (
            <div className="flex h-full items-center justify-center bg-cream-100">
                <p className="text-sm text-brown-soft">불러오는 중…</p>
            </div>
        )
    }

    const { user, relationStatus } = profile
    return (
        <div className="flex h-full flex-col bg-cream-100">
            <main className="no-scrollbar flex-1 overflow-y-auto">
                <header className="flex items-center gap-3 px-5 pt-4">
                    <button onClick={onBack} aria-label="뒤로가기">
                        <ArrowLeftIcon size={21} />
                    </button>
                    <span className="font-display text-lg text-brown">프로필</span>
                </header>
                <div className="px-5 pt-3">
                    <div className="flex items-center gap-4">
                        <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-orange-200 font-display text-2xl text-orange-700">
                            {user.profileImageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={user.profileImageUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <span>{user.nickname.charAt(0) || '?'}</span>
                            )}
                        </span>
                        <div className="flex items-center gap-2">
                            {user.equippedBadge && (
                                <ServerBadge
                                    code={user.equippedBadge.code}
                                    imageUrl={user.equippedBadge.imageUrl}
                                    name={user.equippedBadge.name}
                                    size={40}
                                />
                            )}
                            <span className="font-display text-lg text-brown">{user.nickname}</span>
                        </div>
                    </div>
                    <RelationButton
                        status={relationStatus}
                        userId={typeof userId === 'number' ? userId : user.userId}
                        onChanged={reload}
                    />
                </div>
                <div className="mt-4 px-5">
                    <TabBar
                        label="프로필 도감 종류"
                        variant="segmented"
                        items={TABS.map((t) => ({ id: t, label: t }))}
                        value={tab}
                        onChange={(v) => setTab(v as (typeof TABS)[number])}
                    />
                </div>
                {tab === '기본도감' && (
                    <div className="grid grid-cols-3 gap-3 px-5 py-5 sm:grid-cols-4">
                        {basicDex
                            .filter((d) => d.unlocked)
                            .map((d) => (
                                <div
                                    key={d.id}
                                    className="flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl bg-white text-3xl shadow-soft"
                                >
                                    {d.illustrationUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={d.illustrationUrl}
                                            alt={d.name}
                                            className="h-2/3 w-2/3 object-contain"
                                        />
                                    ) : (
                                        <span>🍽️</span>
                                    )}
                                    <span className="px-1 text-center text-[11px] text-brown-soft">{d.name}</span>
                                </div>
                            ))}
                        {basicDex.filter((d) => d.unlocked).length === 0 && (
                            <p className="col-span-full py-10 text-center text-sm text-brown-soft">
                                수집한 도감이 없어요
                            </p>
                        )}
                    </div>
                )}
                {tab === '챌린지도감' && (
                    <>
                        <div className="mt-3 px-5">
                            <TabBar
                                label="챌린지 상태"
                                variant="pill"
                                items={SUBTABS.map((t) => ({ id: t, label: t }))}
                                value={subtab}
                                onChange={(v) => setSubtab(v as (typeof SUBTABS)[number])}
                            />
                        </div>
                        <div className="space-y-3 px-5 py-3">
                            {challenges.map((c) => (
                                <article key={c.id} className="rounded-2xl bg-white p-4 shadow-soft">
                                    <p className="font-display text-base text-brown">{c.name}</p>
                                    <p className="mt-1 text-xs text-brown-muted">{c.participantCount}명 참여</p>
                                    {c.totalSlots > 0 && (
                                        <div className="mt-2">
                                            <ProgressBar value={c.unlockedCount / c.totalSlots} animate={false} />
                                        </div>
                                    )}
                                </article>
                            ))}
                            {challenges.length === 0 && (
                                <p className="py-10 text-center text-sm text-brown-soft">해당 챌린지가 없어요</p>
                            )}
                        </div>
                    </>
                )}
            </main>
            <BottomNav active="마이" onTab={onTab} />
        </div>
    )
}

/** 관계 버튼 4상태 (SELF면 미표시) */
function RelationButton({
    status,
    userId,
    onChanged,
}: {
    status: RelationStatus
    userId: number
    onChanged: () => void
}) {
    if (status === 'SELF') return null

    const handleReceived = async () => {
        // 받은 요청 → requestId를 찾아 수락
        const reqs = await fetchFriendRequests('received')
        const mine = reqs.find((r) => r.user.userId === userId)
        if (mine) {
            await acceptFriendRequest(mine.requestId)
            onChanged()
        }
    }
    const handleCancel = async () => {
        const reqs = await fetchFriendRequests('sent')
        const mine = reqs.find((r) => r.user.userId === userId)
        if (mine) {
            await deleteFriendRequest(mine.requestId)
            onChanged()
        }
    }

    const base =
        'mt-3 flex w-full items-center justify-center gap-2 min-h-touch rounded-2xl border-2 text-sm font-medium'
    if (status === 'FRIEND')
        return (
            <button
                onClick={() => {
                    if (confirm('친구를 삭제할까요?')) removeFriend(userId).then(onChanged)
                }}
                className={`${base} border-cream-300 bg-white text-brown-soft`}
            >
                <UserCheckIcon size={16} /> 친구 삭제
            </button>
        )
    if (status === 'REQUEST_SENT')
        return (
            <button onClick={handleCancel} className={`${base} border-cream-300 bg-white text-brown-soft`}>
                <XIcon size={16} /> 요청 취소
            </button>
        )
    if (status === 'REQUEST_RECEIVED')
        return (
            <button onClick={handleReceived} className={`${base} border-orange-400 text-orange-600`}>
                <CheckIcon size={16} /> 수락하기
            </button>
        )
    return (
        <button
            onClick={() => sendFriendRequest(userId).then(onChanged)}
            className={`${base} border-orange-400 text-orange-600`}
        >
            <UserPlusIcon size={16} /> 친구 추가
        </button>
    )
}
