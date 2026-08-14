'use client'

import { GuideTour } from '@/features/onboarding/GuideTour'
import { useGuide } from '@/features/onboarding/useGuide'
import { Badge, BottomNav, HelpIcon, LoadingView, NavTab, ProgressBar, SearchBar, Skeleton, TabBar } from '@/shared/ui'
import { motion, useReducedMotion } from 'framer-motion'
import { CrownIcon, MedalIcon, PlusIcon, TrophyIcon } from 'lucide-react'
import { useState } from 'react'
import { ChallengeSort } from './api'
import { ChallengeData } from './types'

type MyTab = '개설한' | '참여 중' | '완료한'
type ExploreStatus = 'ONGOING' | 'FINISHED'

const MAIN_TABS: Array<{ id: 'mine' | 'explore'; label: string }> = [
    { id: 'mine', label: '내 챌린짓' },
    { id: 'explore', label: '챌린짓 탐색' },
]

const MY_TABS: Array<{ id: MyTab; label: MyTab }> = [
    { id: '개설한', label: '개설한' },
    { id: '참여 중', label: '참여 중' },
    { id: '완료한', label: '완료한' },
]

// 탐색 진행 상태 토글
const STATUS_TABS: Array<{ id: ExploreStatus; label: string }> = [
    { id: 'ONGOING', label: '진행중' },
    { id: 'FINISHED', label: '종료' },
]

// 탐색 정렬 탭
// 최신순(기본) + 랭킹 3종(최근 7일)
const SORT_TABS: Array<{ id: ChallengeSort; label: string }> = [
    { id: 'LATEST', label: '최신순' },
    { id: 'VIEWS', label: '조회순' },
    { id: 'PARTICIPANTS', label: '참여자순' },
    { id: 'UNLOCKS', label: '진행도순' },
]

// 카드/포디움에 붙일 지표 텍스트
// 최신순은 누적 참가자수
function scoreText(sort: ChallengeSort, c: ChallengeData): string {
    const s = c.score ?? 0
    switch (sort) {
        case 'VIEWS':
            return `조회 ${s.toLocaleString()}`
        case 'PARTICIPANTS':
            return `참여 ${s}`
        case 'UNLOCKS':
            return `해금 ${s}`
        default:
            return `${c.participants}명 참가`
    }
}

interface Props {
    mainTab: 'mine' | 'explore'
    onMainTabChange: (tab: 'mine' | 'explore') => void
    challenges: ChallengeData[]
    myCreated: ChallengeData[]
    myJoined: ChallengeData[]
    myCompleted: ChallengeData[]
    createdThisMonth: number
    onTab: (tab: NavTab) => void
    onOpenChallenge: (challenge: ChallengeData) => void
    onCreateChallenge: () => void
    // 탐색(서버 정렬 + 페이지)
    exploreItems: ChallengeData[]
    exploreQuery: string
    onExploreQueryChange: (q: string) => void
    exploreSort: ChallengeSort
    exploreStatus: ExploreStatus
    exploreHasNext: boolean
    exploreLoading: boolean
    exploreError: boolean
    onExploreStatusChange: (status: ExploreStatus) => void
    onExploreSortChange: (sort: ChallengeSort) => void
    onExploreLoadMore: () => void
    onExploreRetry: () => void
    onJoinChallenge: (challenge: ChallengeData) => void
}

/** 챌린지 도감 (§6) — 개설자가 지정한 목표 리스트, 랭킹 탭, 월 3회 개설 제한 */
export function ChallengeCountHome({
    mainTab,
    onMainTabChange,
    challenges,
    myCreated,
    myJoined,
    myCompleted,
    createdThisMonth,
    onTab,
    onOpenChallenge,
    onCreateChallenge,
    exploreItems,
    exploreQuery,
    onExploreQueryChange,
    exploreSort,
    exploreStatus,
    exploreHasNext,
    exploreLoading,
    exploreError,
    onExploreStatusChange,
    onExploreSortChange,
    onExploreLoadMore,
    onExploreRetry,
    onJoinChallenge,
}: Props) {
    const [myTab, setMyTab] = useState<MyTab>('참여 중')
    // 탭·개설 버튼은 데이터와 무관하게 항상 있어서 지연시킬 이유가 없다
    const guide = useGuide('challengit')
    // 내 챌린지 탭은 서버에서 relation별로 받아온 목록을 그대로 사용
    const mine = myTab === '참여 중' ? myJoined : myTab === '개설한' ? myCreated : myCompleted
    // 종료 탭은 랭킹 미적용(최근 완료순). 랭킹은 진행중 + 최신순 외 정렬일 때만
    const ended = exploreStatus === 'FINISHED'
    const isRanking = !ended && exploreSort !== 'LATEST'
    const podium = isRanking ? exploreItems.slice(0, 3) : []
    const searching = exploreQuery.trim().length > 0 // 검색 모드 여부
    return (
        <div className="relative flex h-full flex-col bg-surface-app">
            <header className="px-5 pt-4">
                <div className="flex items-center gap-1">
                    <h1 className="font-display text-xl text-neutral-900">챌린짓 도감</h1>
                    <HelpIcon label="챌린짓 도감" onClick={guide.replay} />
                </div>
                <div data-tour="challengit-tabs">
                    <TabBar
                        label="챌린짓 보기 전환"
                        variant="segmented"
                        items={MAIN_TABS}
                        value={mainTab}
                        onChange={onMainTabChange}
                        className="mt-3"
                    />
                </div>
            </header>
            <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-5 pt-4">
                {mainTab === 'mine' ? (
                    <>
                        <div className="flex items-center gap-2">
                            <TabBar
                                label="내 챌린짓 상태"
                                variant="pill"
                                items={MY_TABS}
                                value={myTab}
                                onChange={setMyTab}
                            />
                            <button
                                data-tour="challengit-create"
                                onClick={onCreateChallenge}
                                className="ml-auto flex min-h-touch items-center gap-1 rounded-full bg-watermelon-500 px-4 text-xs font-bold text-content-on-action"
                            >
                                <PlusIcon size={14} />
                                개설 {createdThisMonth}/3
                            </button>
                        </div>
                        <div className="mt-4 space-y-3">
                            {mine.length ? (
                                mine.map((challenge) => (
                                    <MyChallengeCard
                                        key={challenge.id}
                                        challenge={challenge}
                                        onOpen={() => onOpenChallenge(challenge)}
                                    />
                                ))
                            ) : (
                                <div className="rounded-2xl bg-white p-6 text-center shadow-soft">
                                    <p className="text-sm font-bold text-neutral-900">아직 이 상태의 챌린짓이 없어요</p>
                                    <button
                                        onClick={onCreateChallenge}
                                        className="mt-3 min-h-touch rounded-full bg-watermelon-500 px-5 text-sm font-bold text-content-on-action"
                                    >
                                        챌린짓 개설하기
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* 공통 SearchBar를 쓴다 — 이 파일에 있던 SearchBox는 같은 것을 다시 그린 것이었다 */}
                        <div data-tour="challengit-search">
                            <SearchBar
                                label="챌린짓 이름 검색"
                                placeholder="챌린짓 이름으로 검색해보세요"
                                value={exploreQuery}
                                onChange={onExploreQueryChange}
                            />
                        </div>
                        {/* 검색 중에는 상태·정렬·순위를 감춘다 — 검색 결과에는 랭킹 개념이 없다 */}
                        {!searching && (
                            <>
                                <div className="mt-3 flex items-center justify-between">
                                    <p className="text-sm font-bold text-neutral-900">전체 챌린짓</p>
                                    <TabBar
                                        label="진행 상태"
                                        variant="pill"
                                        items={STATUS_TABS}
                                        value={exploreStatus}
                                        onChange={onExploreStatusChange}
                                    />
                                </div>
                                {ended ? (
                                    <p className="mt-3 text-xs text-neutral-400">최근 완료순</p>
                                ) : (
                                    <>
                                        <TabBar
                                            label="탐색 정렬"
                                            variant="pill"
                                            items={SORT_TABS}
                                            value={exploreSort}
                                            onChange={onExploreSortChange}
                                            className="mt-3"
                                        />
                                        {isRanking && (
                                            <p className="mt-2 text-xs text-neutral-400">최근 7일 기준 랭킹</p>
                                        )}
                                        {isRanking && podium.length > 0 && (
                                            <Podium sort={exploreSort} challenges={podium} onOpen={onOpenChallenge} />
                                        )}
                                    </>
                                )}
                            </>
                        )}
                        <div className="mt-4 space-y-3">
                            {exploreLoading && !exploreItems.length ? (
                                /* 정렬을 바꾸면 목록을 비우고 다시 받는다(순위 연출이 실제 데이터에서 시작하도록).
                                   그 사이를 안 채우면 "없어요"가 잠깐 스쳐 지나가 없는 줄 안다 */
                                <LoadingView label="순위를 불러오는 중" skeleton={<ExploreRowsSkeleton />} />
                            ) : exploreItems.length ? (
                                exploreItems.map((challenge, index) => (
                                    <ExploreCard
                                        key={challenge.id}
                                        rank={!searching && isRanking ? index + 1 : undefined}
                                        metric={
                                            searching || ended
                                                ? `${challenge.participants}명 참가`
                                                : scoreText(exploreSort, challenge)
                                        }
                                        ended={!searching && ended}
                                        challenge={challenge}
                                        onOpen={() => onOpenChallenge(challenge)}
                                        onJoin={() => onJoinChallenge(challenge)}
                                    />
                                ))
                            ) : exploreError ? (
                                <div className="rounded-2xl bg-white p-6 text-center shadow-soft">
                                    <p className="text-sm font-bold text-neutral-900">목록을 불러오지 못했어요</p>
                                    <button
                                        onClick={onExploreRetry}
                                        className="mt-3 min-h-touch rounded-full bg-watermelon-500 px-5 text-sm font-bold text-content-on-action"
                                    >
                                        다시 시도
                                    </button>
                                </div>
                            ) : (
                                <div className="rounded-2xl bg-white p-6 text-center shadow-soft">
                                    {/* 세 경우가 서로 다른 말을 한다 — 머지 때 두 줄이 겹쳐 둘 다 찍히고 있었다 */}
                                    <p className="text-sm font-bold text-neutral-900">
                                        {searching
                                            ? '검색 결과가 없어요'
                                            : ended
                                              ? '종료된 챌린짓이 없어요'
                                              : '아직 진행 중인 챌린짓이 없어요'}
                                    </p>
                                </div>
                            )}
                        </div>
                        {exploreHasNext && (
                            <button
                                onClick={onExploreLoadMore}
                                disabled={exploreLoading}
                                className="mt-4 min-h-touch w-full rounded-full border border-neutral-200 bg-white text-sm font-bold text-neutral-900 disabled:opacity-60"
                            >
                                {exploreLoading ? '불러오는 중…' : '더 보기'}
                            </button>
                        )}
                    </>
                )}
            </main>
            <BottomNav active="챌린짓" onTab={onTab} />
            <GuideTour guide={guide} />
        </div>
    )
}
/** 목록이 들어올 자리를 미리 잡아 둔다 — 글자 한 줄로 때우면 도착할 때 화면이 튄다 */
function ExploreRowsSkeleton() {
    return (
        <div className="space-y-3">
            {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft">
                    <Skeleton shape="circle" className="h-11 w-11 shrink-0" />
                    <Skeleton shape="text" className="flex-1" />
                </div>
            ))}
        </div>
    )
}

/** 챌린지 대표 사진 썸네일(없으면 트로피 아이콘) */
function CoverThumb({ url, size = 44 }: { url?: string | null; size?: number }) {
    if (url) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="shrink-0 rounded-xl object-cover" style={{ width: size, height: size }} />
        )
    }
    return (
        <span
            className="flex shrink-0 items-center justify-center rounded-xl bg-watermelon-50 text-watermelon-500"
            style={{ width: size, height: size }}
        >
            <TrophyIcon size={Math.round(size / 2)} strokeWidth={1.75} aria-hidden />
        </span>
    )
}
function MyChallengeCard({ challenge, onOpen }: { challenge: ChallengeData; onOpen: () => void }) {
    return (
        <button onClick={onOpen} className="w-full rounded-2xl bg-white p-4 text-left shadow-soft">
            <div className="flex items-center gap-2">
                <CoverThumb url={challenge.coverUrl} size={40} />
                <span className="flex-1 font-display text-base text-neutral-900">{challenge.title}</span>
                <Badge variant="dday">{challenge.dday}</Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-800">
                <Badge variant="type">{challenge.tag}</Badge>
                <span>목표 {challenge.target ?? 0}곳</span>
                <span>{challenge.participants}명 참가 중</span>
            </div>
            {challenge.completed ? (
                // 완료는 §1.1.1의 "된 것"이라 초록이다. 예전 amber-600은 토큰 밖의 색이었다
                <div className="mt-3 flex items-center gap-1 text-sm font-bold text-feedback-success">
                    <MedalIcon size={17} />
                    완료한 챌린짓
                </div>
            ) : (
                <>
                    <div className="mt-3 flex justify-between text-sm">
                        <span className="font-bold text-neutral-900">{challenge.mine}</span>
                        <span className="text-neutral-800">진행 중</span>
                    </div>
                    <div className="mt-2">
                        {/* animate를 끄지 않는다 — 차오르는 움직임이 "진행 중"을 말해 준다.
                            움직임을 싫어하는 사용자는 ProgressBar가 prefers-reduced-motion으로 알아서 끈다 */}
                        <ProgressBar value={challenge.progress ?? 0} label={`${challenge.title} 진행률`} />
                    </div>
                </>
            )}
        </button>
    )
}
/**
 * 순위 단상 — 금·은·동 (§1.7).
 *
 * **높이를 다르게 준다.** 예전에는 1위만 h-10이고 2·3위는 내용 높이라 단상이 아니라
 * 색 띠 세 개로 보였다. 그리고 3위가 핑크(watermelon-200)여서 순위 계조가 아예 없었다.
 *
 * 금과 은은 명도가 거의 같아(1.07) 색만으로는 구분이 약하다. 높이와 `N위` 글자가
 * 함께 말하도록 둔 이유다
 */
const MEDAL = {
    1: { bg: 'bg-medal-gold', ring: 'ring-medal-gold', height: 'h-14' },
    2: { bg: 'bg-medal-silver', ring: 'ring-medal-silver', height: 'h-10' },
    3: { bg: 'bg-medal-bronze', ring: 'ring-medal-bronze', height: 'h-7' },
} as const

/** 메달이 붙는 순위인지 (목록·단상이 같은 기준을 쓴다) */
function isMedalRank(rank?: number): rank is 1 | 2 | 3 {
    return rank === 1 || rank === 2 || rank === 3
}

/**
 * 단상이 아래에서 통통 튀어 올라온다. **1위부터** 차례로 — 순위 글자를 읽기 전에
 * 등장 순서가 먼저 말해 준다.
 *
 * `damping`을 낮게(11) 뒀다. 도착점을 살짝 넘겼다 되돌아오는 이 출렁임이 "통통"이다 —
 * 값을 올리면 스르륵 멈춰서 그냥 페이드인이 된다
 */
const POP = { type: 'spring', stiffness: 460, damping: 11, mass: 0.8 } as const
const POP_GAP = 0.14 // 1위 → 2위 → 3위 등장 간격(초)

/**
 * 목록 줄도 위에서부터 차례로 올라온다. 단상보다 **덜 출렁이게**(damping 16) 둔다 —
 * 열 줄이 단상처럼 통통거리면 산만하다. 순서만 눈에 남으면 된다
 */
const ROW_POP = { type: 'spring', stiffness: 420, damping: 16, mass: 0.7 } as const
const ROW_GAP = 0.05
/** 지연 상한. 20위까지 줄줄이 밀리면 아래쪽은 그냥 늦게 뜨는 것으로 보인다 */
const ROW_MAX_STEPS = 9

function Podium({
    sort,
    challenges,
    onOpen,
}: {
    sort: ChallengeSort
    challenges: ChallengeData[]
    onOpen: (challenge: ChallengeData) => void
}) {
    const reduceMotion = useReducedMotion()
    // 순위를 먼저 확정한 뒤 시각 배치만 2-1-3으로(가운데가 1위)
    const ranked = challenges.map((challenge, i) => ({ challenge, rank: i + 1 }))
    const ordered = [ranked[1], ranked[0], ranked[2]].filter(Boolean)
    return (
        // key에 정렬을 넣어 정렬 탭을 바꿀 때마다 등장 연출을 다시 보여준다
        <div key={sort} className="mt-5 flex items-end justify-center gap-2">
            {ordered.map(({ challenge, rank }) => {
                const medal = MEDAL[rank as 1 | 2 | 3] ?? MEDAL[3]
                return (
                    <motion.button
                        key={challenge.id}
                        onClick={() => onOpen(challenge)}
                        aria-label={`${rank}위 ${challenge.title}`}
                        // 지연은 시각 배치(2-1-3)가 아니라 순위를 따른다 — 가운데 1위가 먼저 올라온다
                        initial={reduceMotion ? false : { y: 28, scale: 0.82, opacity: 0 }}
                        animate={{ y: 0, scale: 1, opacity: 1 }}
                        transition={reduceMotion ? { duration: 0 } : { ...POP, delay: (rank - 1) * POP_GAP }}
                        className={`flex flex-col items-center ${rank === 1 ? 'w-28' : 'w-24'}`}
                    >
                        <span
                            className={`relative flex items-center justify-center rounded-2xl bg-white text-3xl shadow-soft ${rank === 1 ? `h-20 w-20 ring-2 ${medal.ring}` : 'h-16 w-16'}`}
                        >
                            {rank === 1 && (
                                <CrownIcon size={21} aria-hidden className="absolute -top-5 text-medal-gold" />
                            )}
                            {challenge.coverUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={challenge.coverUrl}
                                    alt=""
                                    className="h-full w-full rounded-2xl object-cover"
                                />
                            ) : (
                                <TrophyIcon size={30} strokeWidth={1.5} aria-hidden className="text-watermelon-500" />
                            )}
                        </span>
                        {/* 두 줄까지 편다 — 한 줄로 자르면 "부산 돼지국밥 정…"처럼 낱말 가운데가 사라진다 */}
                        <span className="mt-2 line-clamp-2 text-center text-xs font-bold text-neutral-900">
                            {challenge.title}
                        </span>
                        <span className="text-xs text-neutral-800">{scoreText(sort, challenge)}</span>
                        {/* 단상. 색만으로 순위를 말하지 않는다 — 높이와 `N위` 글자가 함께 말한다 */}
                        <span
                            className={`mt-1 flex w-full items-end justify-center rounded-t-lg pb-1 text-xs font-bold text-content-primary ${medal.height} ${medal.bg}`}
                        >
                            {rank}위
                        </span>
                    </motion.button>
                )
            })}
        </div>
    )
}
function ExploreCard({
    challenge,
    rank,
    metric,
    ended,
    onOpen,
    onJoin,
}: {
    challenge: ChallengeData
    rank?: number
    metric: string
    ended: boolean
    onOpen: () => void
    onJoin: () => void
}) {
    const reduceMotion = useReducedMotion()
    const medal = isMedalRank(rank) ? MEDAL[rank] : null
    return (
        // 카드 본문 탭 = 상세
        // 우측 버튼 = 실제 참여
        <motion.div
            // 순위 목록일 때만 등장 연출. 최신순에서 열 줄이 통통거리면 그냥 산만하다
            initial={rank && !reduceMotion ? { y: 14, scale: 0.98, opacity: 0 } : false}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={
                rank && !reduceMotion
                    ? { ...ROW_POP, delay: Math.min(rank - 1, ROW_MAX_STEPS) * ROW_GAP }
                    : { duration: 0 }
            }
            className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 shadow-soft"
        >
            <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left active:scale-[0.99]">
                {/* 색만으로 순위를 말하지 않는다 — 메달 테두리 옆에 `N위` 글자가 늘 함께 있다 */}
                {rank && (
                    <span
                        className={`w-7 shrink-0 text-center font-display text-sm ${
                            medal ? 'text-content-primary' : 'text-neutral-400'
                        }`}
                    >
                        {rank}위
                    </span>
                )}
                <span className="relative shrink-0">
                    {rank === 1 && (
                        <CrownIcon
                            size={16}
                            aria-hidden
                            className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 text-medal-gold"
                        />
                    )}
                    {/* 링은 감싸는 span에 준다 — CoverThumb은 사진일 수도 아이콘일 수도 있어서 안쪽에서 처리하면 갈린다 */}
                    <span className={`flex rounded-xl ${medal ? `ring-2 ring-offset-1 ${medal.ring}` : ''}`}>
                        <CoverThumb url={challenge.coverUrl} size={44} />
                    </span>
                </span>
                <span className="min-w-0 flex-1">
                    {/* 낱말 가운데가 잘리지 않게 두 줄까지 편다 */}
                    <span className="line-clamp-2 text-sm font-bold text-neutral-900">{challenge.title}</span>
                    <span className="mt-1 block text-xs text-neutral-800">{metric}</span>
                </span>
            </button>
            {ended ? (
                <span className="shrink-0 rounded-full bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-400">
                    종료
                </span>
            ) : challenge.joined ? (
                <span className="shrink-0 rounded-full bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-800">
                    참여 중
                </span>
            ) : (
                <button
                    onClick={onJoin}
                    className="min-h-touch shrink-0 rounded-full bg-watermelon-500 px-3 text-xs font-bold text-content-on-action active:scale-[0.98]"
                >
                    참여하기
                </button>
            )}
        </motion.div>
    )
}
