'use client'

import {
    ChallengeSort,
    ChallengeSummary,
    fetchChallenges,
    fetchCreationTickets,
    fetchMyChallenges,
    joinChallenge,
    searchChallenges,
} from '@/features/challenge/api'
import { ChallengeCountHome } from '@/features/challenge/ChallengeCountHome'
import { ChallengeData } from '@/features/challenge/types'
import { pushInApp } from '@/shared/lib/backNav'
import { getTabHref, ROUTES } from '@/shared/lib/routes'
import { Dialog } from '@/shared/ui'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'

const MONTHLY_LIMIT = 3
const PAGE_SIZE = 10
const SORTS: ChallengeSort[] = ['LATEST', 'VIEWS', 'PARTICIPANTS', 'UNLOCKS']

/** 서버 요약 → 화면 카드 형태로 변환 */
function toChallengeData(c: ChallengeSummary): ChallengeData {
    const total = c.totalSlots ?? 0
    const unlocked = c.unlockedCount ?? 0
    return {
        id: String(c.id),
        title: c.name,
        emoji: '🏆',
        tag: '수집형',
        dday: c.periodType === 'PERMANENT' ? '상시' : c.endsAt ? ddayLabel(c.endsAt) : '기간한정',
        participants: c.participantCount,
        score: c.rankScore,
        joined: c.joined,
        owner: '',
        coverUrl: c.imageUrl ?? undefined,
        rewardBadgeInfo: c.rewardBadge,
        target: total,
        mine: `나 ${unlocked}/${total}`,
        progress: total ? unlocked / total : 0, // ProgressBar는 0~1 비율
    }
}

function ddayLabel(endsAt: string): string {
    const days = Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86_400_000)
    return days >= 0 ? `D-${days}` : '종료'
}

/** \/challenge\ 챌린지 도감 홈 */
function ChallengeHome() {
    const router = useRouter()
    const params = useSearchParams()

    // 탐색 탭/정렬 초기값을 URL에서 복원 (상세에서 뒤로가기 시 그 자리)
    const sortParam = params.get('sort') as ChallengeSort | null
    const [mainTab, setMainTab] = useState<'mine' | 'explore'>(params.get('tab') === 'explore' ? 'explore' : 'mine')
    const [exploreSort, setExploreSort] = useState<ChallengeSort>(
        sortParam && SORTS.includes(sortParam) ? sortParam : 'LATEST',
    )
    const [exploreStatus, setExploreStatus] = useState<'ONGOING' | 'FINISHED'>(
        params.get('status') === 'finished' ? 'FINISHED' : 'ONGOING',
    )

    const [challenges, setChallenges] = useState<ChallengeData[]>([])
    const [myCreated, setMyCreated] = useState<ChallengeData[]>([])
    const [myJoined, setMyJoined] = useState<ChallengeData[]>([])
    const [myCompleted, setMyCompleted] = useState<ChallengeData[]>([])
    const [createdThisMonth, setCreatedThisMonth] = useState(0)
    const [exploreItems, setExploreItems] = useState<ChallengeData[]>([])
    const [explorePage, setExplorePage] = useState(0)
    const [exploreHasNext, setExploreHasNext] = useState(false)
    const [exploreLoading, setExploreLoading] = useState(false)
    const [exploreError, setExploreError] = useState(false)
    const [exploreQuery, setExploreQuery] = useState('') // 검색 입력값(원본)
    const [debouncedQuery, setDebouncedQuery] = useState('') // 디바운스된 검색어(실제 요청)
    const [alertMessage, setAlertMessage] = useState<string | null>(null)
    const reqRef = useRef(0) // 최신 탐색 요청만 반영(정렬/상태 빠른 전환 경합 방어)
    const joiningRef = useRef<Set<string>>(new Set()) // 참여 요청 중복 방지

    // 탐색 탭/정렬을 URL 쿼리에 반영 → 상세에서 router.back() 시 그대로 복원
    const syncUrl = useCallback(
        (tab: 'mine' | 'explore', sort: ChallengeSort, status: 'ONGOING' | 'FINISHED') => {
            const q = new URLSearchParams()
            if (tab === 'explore') q.set('tab', 'explore')
            if (sort !== 'LATEST') q.set('sort', sort)
            if (status === 'FINISHED') q.set('status', 'finished')
            const qs = q.toString()
            router.replace(qs ? `${ROUTES.challenge}?${qs}` : ROUTES.challenge, {
                scroll: false,
            })
        },
        [router],
    )

    const onMainTabChange = (tab: 'mine' | 'explore') => {
        setMainTab(tab)
        syncUrl(tab, exploreSort, exploreStatus)
    }

    const onExploreSortChange = (sort: ChallengeSort) => {
        setExploreSort(sort)
        syncUrl(mainTab, sort, exploreStatus)
    }

    const onExploreStatusChange = (status: 'ONGOING' | 'FINISHED') => {
        setExploreStatus(status)
        syncUrl(mainTab, exploreSort, status)
    }

    const loadExplore = useCallback(
        (status: 'ONGOING' | 'FINISHED', sort: ChallengeSort, page: number, append: boolean, query: string) => {
            const token = ++reqRef.current
            setExploreLoading(true)
            /**
             * 새로 부르는 목록이면 **먼저 비운다.**
             *
             * 안 비우면 정렬을 바꾼 직후 한동안 **이전 정렬의 목록이 그대로 남는다.**
             * 그 사이에 순위 등장 연출이 옛 데이터로 이미 재생돼 버리고, 진짜 순위가
             * 도착할 때는 같은 카드가 이미 붙어 있어 다시 튀어오르지 않는다 —
             * "순위 애니메이션이 없다"의 원인이 이것이었다.
             *
             * 비워 두면 실제 순위가 도착하는 순간이 곧 등장 시점이 된다
             */
            if (!append) setExploreItems([])
            const request = query.trim()
                ? searchChallenges(query.trim(), page, PAGE_SIZE) // 검색어 있으면 검색 API
                : fetchChallenges(status, sort, page, PAGE_SIZE) // 없으면 기존 탐색
            request
                .then((res) => {
                    if (token !== reqRef.current) return // 더 최신 요청이 있으면 무시
                    const mapped = res.content.map(toChallengeData)
                    setExploreItems((prev) => (append ? [...prev, ...mapped] : mapped))
                    setExplorePage(res.page)
                    setExploreHasNext(res.hasNext)
                    setExploreError(false)
                })
                .catch(() => {
                    if (token === reqRef.current) setExploreError(true)
                })
                .finally(() => {
                    if (token === reqRef.current) setExploreLoading(false)
                })
        },
        [],
    )

    // 개설권·내 챌린지 로딩을 한 곳으로 묶어 재사용(개설 후 최신값 반영)
    const loadMine = useCallback(() => {
        // 내 챌린지 베이스
        fetchChallenges('ONGOING')
            .then((res) => setChallenges(res.content.map(toChallengeData)))
            .catch(() => {})
        // 내 챌린지 탭 — relation별로 서버에서 받아 플래그를 붙인다
        fetchMyChallenges('CREATED')
            .then((list) => setMyCreated(list.map((c) => ({ ...toChallengeData(c), isCreator: true }))))
            .catch(() => {})
        fetchMyChallenges('JOINED')
            .then((list) => setMyJoined(list.map((c) => ({ ...toChallengeData(c), joined: true }))))
            .catch(() => {})
        fetchMyChallenges('COMPLETED')
            .then((list) => setMyCompleted(list.map((c) => ({ ...toChallengeData(c), joined: true, completed: true }))))
            .catch(() => {})
        fetchCreationTickets()
            .then((t) => setCreatedThisMonth(MONTHLY_LIMIT - t.remaining))
            .catch(() => {})
    }, [])

    // 최초 로드
    useEffect(() => {
        loadMine()
    }, [loadMine])

    // 개설 화면 등에서 돌아와 홈이 다시 보이면 개설권·내 챌린지를 재조회(개설 후 stale 방지)
    useEffect(() => {
        const onFocus = () => {
            if (document.visibilityState === 'visible') loadMine()
        }
        window.addEventListener('focus', onFocus)
        document.addEventListener('visibilitychange', onFocus)
        return () => {
            window.removeEventListener('focus', onFocus)
            document.removeEventListener('visibilitychange', onFocus)
        }
    }, [loadMine])

    // "내 챌린지" 탭을 열 때마다 최신 개설권/목록 반영
    useEffect(() => {
        if (mainTab === 'mine') loadMine()
    }, [mainTab, loadMine])

    // 검색어 디바운스: 입력이 멈추고 300ms 뒤에 실제 검색어로 확정
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(exploreQuery), 300)
        return () => clearTimeout(t)
    }, [exploreQuery])

    // 상태·정렬·검색어 바뀌면 첫 페이지부터 다시 로드
    useEffect(() => {
        loadExplore(exploreStatus, exploreSort, 0, false, debouncedQuery)
    }, [exploreStatus, exploreSort, debouncedQuery, loadExplore])

    const onExploreLoadMore = () => {
        if (!exploreLoading && exploreHasNext)
            loadExplore(exploreStatus, exploreSort, explorePage + 1, true, debouncedQuery)
    }

    const onExploreRetry = () => loadExplore(exploreStatus, exploreSort, 0, false, debouncedQuery)

    // 탐색 목록에서 바로 참여 → 낙관적으로 "참여 중"(중복 요청 방지 + 실패 시 롤백)
    const onJoinChallenge = async (c: ChallengeData) => {
        if (c.joined || joiningRef.current.has(c.id)) return // 중복 클릭/이미 참여 차단
        joiningRef.current.add(c.id)
        setExploreItems((prev) => prev.map((it) => (it.id === c.id ? { ...it, joined: true } : it)))
        try {
            await joinChallenge(c.id)
        } catch (e) {
            setExploreItems((prev) => prev.map((it) => (it.id === c.id ? { ...it, joined: false } : it)))
            setAlertMessage(e instanceof Error ? e.message : '참여에 실패했어요')
        } finally {
            joiningRef.current.delete(c.id)
        }
    }

    return (
        <>
            <ChallengeCountHome
                mainTab={mainTab}
                onMainTabChange={onMainTabChange}
                challenges={challenges}
                myCreated={myCreated}
                myJoined={myJoined}
                myCompleted={myCompleted}
                createdThisMonth={createdThisMonth}
                exploreItems={exploreItems}
                exploreQuery={exploreQuery}
                onExploreQueryChange={setExploreQuery}
                exploreSort={exploreSort}
                exploreStatus={exploreStatus}
                exploreHasNext={exploreHasNext}
                exploreLoading={exploreLoading}
                exploreError={exploreError}
                onExploreStatusChange={onExploreStatusChange}
                onExploreSortChange={onExploreSortChange}
                onExploreLoadMore={onExploreLoadMore}
                onExploreRetry={onExploreRetry}
                onJoinChallenge={onJoinChallenge}
                // pushInApp — 앱 안에서 push했음을 남긴다 → 도착 화면의 ←가 back()으로 이 자리에 복귀
                onOpenChallenge={(challenge) => pushInApp(router, ROUTES.challengeDetail(challenge.id))}
                onCreateChallenge={() => pushInApp(router, ROUTES.challengeNew)}
                onTab={(tab) => router.push(getTabHref(tab))}
            />
            {alertMessage && <Dialog title="오류" message={alertMessage} onClose={() => setAlertMessage(null)} />}
        </>
    )
}

export default function ChallengeHomePage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-full items-center justify-center bg-surface-app">
                    <p className="text-sm text-neutral-800">불러오는 중…</p>
                </div>
            }
        >
            <ChallengeHome />
        </Suspense>
    )
}
