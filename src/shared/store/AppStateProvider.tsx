'use client'

import { useAuth } from '@/features/auth/AuthContext'
import { INITIAL_CHALLENGES } from '@/features/challenge/data'
import { ChallengeData, ChallengeTarget, RewardBadge } from '@/features/challenge/types'
import { fetchBasicDexEntries, fetchMyBasicDexEntries, markNewBadgeSeen as postNewBadgeSeen } from '@/features/dex/api'
import { MadeDexId, parseMadeDexId } from '@/features/made/types'
import { AI_CANDIDATES, DEX_ENTRIES, DexEntry } from '@/shared/data/dex'
import type { BadgeId } from '@/shared/ui'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type RegistrationSource = 'basic' | 'made' | 'challenge'

/**
 * 라우트를 건너 공유되는 앱 상태.
 * 페이지(컨테이너)는 이 훅에서 값과 액션을 받아 프레젠테이셔널 컴포넌트에 props로 내려준다 (§3.1).
 *
 * 목업 단계라 메모리에만 두며, 새로고침하면 초기화된다.
 * 실제 API 연동 시 이 파일의 액션 본문만 교체하면 화면 코드는 손댈 필요 없다.
 */
/**
 * 도감 슬라이스만 담은 좁은 컨텍스트.
 * 챌린지/제작 도감/등록 플로우 등 무관한 상태가 바뀔 때 도감 화면이 함께
 * 리렌더되지 않도록 `AppStore`와 분리해서 제공한다 (useDexState 참고).
 */
export interface DexStore {
    entries: DexEntry[]
    entriesLoading: boolean
    refreshEntries: () => Promise<void>
    collectedIds: number[]
    collectedEntries: DexEntry[]
    findEntry: (id: number) => DexEntry | undefined
    /** New 스티커 확인 — 화면에서 즉시 떼고 서버에도 알린다 */
    markNewBadgeSeen: (id: number) => void
}

interface AppStore {
    // 프로필
    equippedBadge: BadgeId
    setEquippedBadge: (badge: BadgeId) => void
    profilePhoto: string
    setProfilePhoto: (photo: string) => void

    // 챌린지
    challenges: ChallengeData[]
    createdThisMonth: number
    findChallenge: (id: string) => ChallengeData | undefined
    createChallenge: (challenge: ChallengeData) => void
    customBadge: RewardBadge | null
    setCustomBadge: (badge: RewardBadge | null) => void
    challengeDraft: {
        title: string
        description: string
        targets: ChallengeTarget[]
        periodType: 'PERMANENT' | 'LIMITED'
        endsAt: string
        /**
         * 개설 마법사가 머물던 단계. 뱃지 커스텀 화면(/challenge/new/badge)에 갔다가
         * **저장하지 않고 뒤로 와도** 보상 단계로 돌아오게 하려고 둔다.
         * 예전에는 customBadge가 있는지로 추측해서, 취소하면 1단계로 튕겼다
         */
        step: number
    }
    setChallengeDraft: (draft: {
        title: string
        description: string
        targets: ChallengeTarget[]
        periodType: 'PERMANENT' | 'LIMITED'
        endsAt: string
        /**
         * 개설 마법사가 머물던 단계. 뱃지 커스텀 화면(/challenge/new/badge)에 갔다가
         * **저장하지 않고 뒤로 와도** 보상 단계로 돌아오게 하려고 둔다.
         * 예전에는 customBadge가 있는지로 추측해서, 취소하면 1단계로 튕겼다
         */
        step: number
    }) => void
    resetChallengeDraft: () => void

    // 등록 플로우
    registrationSource: RegistrationSource
    registrationChallengeId: string | null
    registrationMadeDexId: MadeDexId | null
    startRegistration: (source: RegistrationSource, contextId?: string) => void
    hasUpload: boolean
    setHasUpload: (value: boolean) => void
    selectedFood: DexEntry
    setSelectedFoodId: (id: number) => void
    recordDraft: { memo: string; location: string }
    setRecordDraft: (draft: { memo: string; location: string }) => void
    selectedTags: string[]
    setSelectedTags: (tags: string[]) => void
    finishRegistration: (tags?: string[], draft?: { memo: string; location: string }) => void
}

const AppStateContext = createContext<AppStore | null>(null)
const DexContext = createContext<DexStore | null>(null)

export function AppStateProvider({ children }: { children: React.ReactNode }) {
    const [entries, setEntries] = useState<DexEntry[]>(DEX_ENTRIES)
    // 실제 도감 데이터가 도착하기 전까지는 목업이 화면에 잠깐 노출되지 않도록 로딩 상태로 가린다.
    const [entriesLoading, setEntriesLoading] = useState(true)
    const [equippedBadge, setEquippedBadge] = useState<BadgeId>('silver-spoon')
    const [profilePhoto, setProfilePhoto] = useState('신')

    const { me, loading: authLoading } = useAuth()
    const userId = me?.id

    // 비로그인 → 전체 목록(/basic), 로그인 → 내가 실제로 등록(해금)한 항목만
    // collected=true인 목록(/me/basic). 등록 직후처럼 서버 상태가 바뀐 뒤에도
    // 다시 불러 최신화할 수 있도록 콜백으로 분리해 둔다.
    const refreshEntries = useCallback(async () => {
        const fetchEntries = userId ? fetchMyBasicDexEntries : fetchBasicDexEntries
        try {
            const basicEntries = await fetchEntries()
            if (basicEntries.length > 0) setEntries(basicEntries)
        } catch {
            // 실패하면 이전 목록(초기 진입 시엔 로컬 목업)을 그대로 유지한다.
        }
    }, [userId])

    // 로그인 여부가 확정된 뒤에만 최초 요청한다: 확정 전에 먼저 쐈다가 로그인
    // 상태가 뒤늦게 밝혀져 다시 쏘면 화면이 한 번 더 바뀌므로 그냥 기다린다.
    useEffect(() => {
        if (authLoading) return
        setEntriesLoading(true)
        refreshEntries().finally(() => setEntriesLoading(false))
    }, [authLoading, refreshEntries])

    const [challenges, setChallenges] = useState<ChallengeData[]>(INITIAL_CHALLENGES)
    const [customBadge, setCustomBadge] = useState<RewardBadge | null>(null)
    const [challengeDraft, setChallengeDraft] = useState<{
        title: string
        description: string
        targets: ChallengeTarget[]
        periodType: 'PERMANENT' | 'LIMITED'
        endsAt: string
        /**
         * 개설 마법사가 머물던 단계. 뱃지 커스텀 화면(/challenge/new/badge)에 갔다가
         * **저장하지 않고 뒤로 와도** 보상 단계로 돌아오게 하려고 둔다.
         * 예전에는 customBadge가 있는지로 추측해서, 취소하면 1단계로 튕겼다
         */
        step: number
    }>({ title: '', description: '', targets: [], periodType: 'PERMANENT', endsAt: '', step: 0 })
    const resetChallengeDraft = useCallback(
        () =>
            setChallengeDraft({
                title: '',
                description: '',
                targets: [],
                periodType: 'PERMANENT',
                endsAt: '',
                step: 0,
            }),
        [],
    )

    const [registrationSource, setRegistrationSource] = useState<RegistrationSource>('basic')
    const [registrationChallengeId, setRegistrationChallengeId] = useState<string | null>(null)
    const [registrationMadeDexId, setRegistrationMadeDexId] = useState<MadeDexId | null>(null)
    const [hasUpload, setHasUpload] = useState(false)
    const [selectedFoodId, setSelectedFoodId] = useState(16)
    const [recordDraft, setRecordDraft] = useState({ memo: '', location: '' })
    const [selectedTags, setSelectedTags] = useState<string[]>([])

    const collectedEntries = useMemo(() => entries.filter((entry) => entry.collected), [entries])
    const collectedIds = useMemo(() => collectedEntries.map((entry) => entry.id), [collectedEntries])

    // AI 후보로만 존재하고 아직 도감에 없는 음식도 등록 대상이 될 수 있음
    const selectedFood = useMemo<DexEntry>(() => {
        const known = entries.find((entry) => entry.id === selectedFoodId)
        if (known) return known
        const candidate = AI_CANDIDATES.find((item) => item.id === selectedFoodId)
        return {
            id: selectedFoodId,
            name: candidate?.name ?? '칼국수',
            emoji: candidate?.emoji ?? '🍜',
            category: '면' as const,
            collected: false,
        }
    }, [entries, selectedFoodId])

    const createdThisMonth = challenges.filter((challenge) => challenge.isCreator).length

    const findEntry = useCallback((id: number) => entries.find((entry) => entry.id === id), [entries])

    // 서버 응답을 기다리지 않고 먼저 떼어 낸다 — 상세를 보고 돌아왔을 때 스티커가 남아 있으면
    // "봤는데 왜 아직 New인가"로 읽힌다. 실패해도 되돌리지 않는다: 24시간이 지나면 어차피 사라지고,
    // 다시 붙여 놓으면 사용자가 두 번 헷갈린다.
    const markNewBadgeSeen = useCallback((id: number) => {
        setEntries((current) =>
            current.map((entry) => (entry.id === id ? { ...entry, recentlyUnlocked: false } : entry)),
        )
        postNewBadgeSeen(id).catch(() => {
            // 다음 기회에 다시 표시되는 것으로 족하다
        })
    }, [])
    const findChallenge = useCallback((id: string) => challenges.find((challenge) => challenge.id === id), [challenges])

    const startRegistration = useCallback((source: RegistrationSource, contextId?: string) => {
        setRegistrationSource(source)
        setRegistrationChallengeId(source === 'challenge' ? (contextId ?? null) : null)
        setRegistrationMadeDexId(source === 'made' ? parseMadeDexId(contextId) : null)
        setSelectedTags([])
        setRecordDraft({ memo: '', location: '' })
        setHasUpload(false)
    }, [])

    const createChallenge = useCallback((challenge: ChallengeData) => {
        setChallenges((current) => [challenge, ...current])
        setCustomBadge(null)
    }, [])

    const finishRegistration = useCallback(
        (tags: string[] = selectedTags, draft = recordDraft) => {
            const location = draft.location || '현재 위치 근처'
            const memo = draft.memo || 'AI로 찾은 오늘의 음식'

            // 챌린지 등록이면 지정 식당과 대조해 목표 하나를 해금
            if (registrationSource === 'challenge' && registrationChallengeId) {
                setChallenges((current) =>
                    current.map((challenge) => {
                        if (challenge.id !== registrationChallengeId) return challenge
                        const matched = challenge.targetRestaurants?.find(
                            (target) =>
                                (location.includes(target.name) || target.name.includes(location)) &&
                                !challenge.completedTargetIds?.includes(target.id),
                        )
                        if (!matched) return challenge
                        const nextIds = [...(challenge.completedTargetIds ?? []), matched.id]
                        const total = challenge.targetRestaurants?.length ?? 1
                        return {
                            ...challenge,
                            completedTargetIds: nextIds,
                            mine: `나 ${nextIds.length}/${total}`,
                            progress: nextIds.length / total,
                        }
                    }),
                )
            }

            const savedEntry: DexEntry = {
                ...selectedFood,
                collected: true,
                stars: 1,
                firstDate: '2026.07.22',
                recentlyUnlocked: true,
                cards: [
                    {
                        photos: [selectedFood.illustrationUrl ?? selectedFood.emoji],
                        memo,
                        location,
                        date: '2026.07.22',
                        tags,
                    },
                ],
            }

            setEntries((current) =>
                current.some((entry) => entry.id === savedEntry.id)
                    ? current.map((entry) => (entry.id === savedEntry.id ? savedEntry : entry))
                    : [...current, savedEntry],
            )
        },
        [recordDraft, registrationChallengeId, registrationSource, selectedFood, selectedTags],
    )

    const dexValue = useMemo<DexStore>(
        () => ({
            entries,
            entriesLoading,
            refreshEntries,
            collectedIds,
            collectedEntries,
            findEntry,
            markNewBadgeSeen,
        }),
        [entries, entriesLoading, refreshEntries, collectedIds, collectedEntries, findEntry, markNewBadgeSeen],
    )

    const value = useMemo<AppStore>(
        () => ({
            equippedBadge,
            setEquippedBadge,
            profilePhoto,
            setProfilePhoto,
            challenges,
            createdThisMonth,
            findChallenge,
            createChallenge,
            customBadge,
            setCustomBadge,
            challengeDraft,
            setChallengeDraft,
            resetChallengeDraft,
            registrationSource,
            registrationChallengeId,
            registrationMadeDexId,
            startRegistration,
            hasUpload,
            setHasUpload,
            selectedFood,
            setSelectedFoodId,
            recordDraft,
            setRecordDraft,
            selectedTags,
            setSelectedTags,
            finishRegistration,
        }),
        [
            equippedBadge,
            profilePhoto,
            challenges,
            createdThisMonth,
            findChallenge,
            createChallenge,
            customBadge,
            challengeDraft,
            registrationSource,
            registrationChallengeId,
            registrationMadeDexId,
            startRegistration,
            hasUpload,
            selectedFood,
            recordDraft,
            selectedTags,
            finishRegistration,
        ],
    )

    return (
        <DexContext.Provider value={dexValue}>
            <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
        </DexContext.Provider>
    )
}

export function useAppState() {
    const store = useContext(AppStateContext)
    if (!store) throw new Error('useAppState는 AppStateProvider 안에서만 쓸 수 있어요.')
    return store
}

/**
 * 도감 슬라이스 전용 훅. 챌린지/제작 도감/등록 플로우 등 다른 상태 변경으로는
 * 리렌더되지 않아 도감 화면(그리드/상세)에서 사용하기 적합하다.
 */
export function useDexState() {
    const store = useContext(DexContext)
    if (!store) throw new Error('useDexState는 AppStateProvider 안에서만 쓸 수 있어요.')
    return store
}
