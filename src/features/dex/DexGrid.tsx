import { createReport } from '@/features/report/api'
import { DexEntry } from '@/shared/data/dex'
import { getLocalDexIllustrationUrl } from '@/shared/lib/dexIllustrations'
import { HelpIcon } from '@/shared/ui/atoms/HelpIcon'
import { ProgressBar } from '@/shared/ui/atoms/ProgressBar'
import { SearchBar } from '@/shared/ui/atoms/SearchBar'
import { StarRank } from '@/shared/ui/atoms/StarRank'
import { BottomNav, NavTab } from '@/shared/ui/molecules/BottomNav'
import { DexHelpSheet } from '@/shared/ui/molecules/DexHelpSheet'
import { FoodCard } from '@/shared/ui/molecules/FoodCard'
import { TabBar } from '@/shared/ui/molecules/TabBar'
import { ArrowLeftIcon, ChevronDownIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import type { CategoryFilter } from './useDexFilter'
import { useDexFilter } from './useDexFilter'
interface DexGridProps {
    entries: DexEntry[]
    collectedIds: number[]
    initialCategory?: CategoryFilter
    onBackToList: () => void
    onCategoryChange?: (category: CategoryFilter) => void
    onOpenEntry: (id: number, category: CategoryFilter) => void
    onRegister: () => void
    onTab: (tab: NavTab) => void
}

/**
 * 카드 우측 상단 스티커. New와 검토대기가 같은 자리를 쓰며 동시에 뜨지 않는다 —
 * 검토대기는 아직 안 열린 칸에만 붙기 때문이다.
 */
function CornerSticker({ label, tone }: { label: string; tone: 'new' | 'review' }) {
    return (
        <span
            className={`absolute -right-2 -top-2 rounded-full px-2 py-1 text-xs font-bold leading-none text-white ${
                tone === 'new' ? 'bg-blue-500' : 'bg-content-secondary'
            }`}
        >
            {label}
        </span>
    )
}

/**
 * 기본 도감 (§6) — 200칸 고정, 미해금은 `?` 실루엣, 진행률 바 사용.
 * 그리드는 모바일 3열 기준(§2)이며 넓은 뷰포트에서만 열을 늘림.
 */
export function DexGrid({
    entries,
    collectedIds,
    initialCategory,
    onBackToList,
    onCategoryChange,
    onOpenEntry,
    onRegister,
    onTab,
}: DexGridProps) {
    const [helpOpen, setHelpOpen] = useState(false)
    const [reporting, setReporting] = useState(false)
    const [reportedName, setReportedName] = useState<string | null>(null)
    const [unlockMenuOpen, setUnlockMenuOpen] = useState(false)

    // 검색어를 그대로 제보 이름으로 보낸다.
    async function handleReport() {
        const name = query.trim()
        if (!name || reporting) return
        setReporting(true)
        try {
            await createReport(name)
            setReportedName(name)
        } catch (e) {
            alert(e instanceof Error ? e.message : '제보에 실패했어요')
        } finally {
            setReporting(false)
        }
    }

    const {
        activeCategory,
        setActiveCategory,
        unlockFilter,
        setUnlockFilter,
        query,
        setQuery,
        categoryTabs,
        unlockTabs,
        collected,
        visibleEntries,
        activeMeta,
        visibleCollected,
        sectionCollected,
        progress,
        percentage,
        sectionProgress,
        sectionPercentage,
        sectionTotal,
    } = useDexFilter(entries, collectedIds, initialCategory)
    const displayProgress = activeCategory === '전체' ? progress : sectionProgress
    const displayPercentage = activeCategory === '전체' ? percentage : sectionPercentage
    const displayCollected = activeCategory === '전체' ? collectedIds.length : sectionCollected
    const displayTotal = activeCategory === '전체' ? entries.length : sectionTotal

    return (
        <div className="relative flex h-full flex-col bg-surface-app">
            <header className="shrink-0 px-4 pt-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={onBackToList}
                            aria-label="도감 목록으로 돌아가기"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-card text-content-primary shadow-card transition-colors hover:bg-white active:scale-[0.98]"
                        >
                            <ArrowLeftIcon size={19} aria-hidden />
                        </button>
                        <h1 className="truncate font-display text-xl text-content-primary">나의 음식 도감</h1>
                        <HelpIcon label="기본 도감" onClick={() => setHelpOpen(true)} />
                    </div>
                    <button
                        type="button"
                        onClick={onRegister}
                        className="flex min-h-touch shrink-0 items-center gap-1 rounded-full bg-action-primary px-4 text-sm font-bold text-content-on-action shadow-card transition-colors hover:bg-action-hover active:scale-[0.98]"
                    >
                        <PlusIcon size={16} strokeWidth={2.75} aria-hidden /> 등록하기
                    </button>
                </div>

                <div className="mt-3 rounded-2xl bg-surface-card p-4 shadow-card">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-content-secondary">수집률</span>
                        <span className="rounded-full bg-watermelon-50 px-3 py-1 text-xs font-bold text-content-link">
                            {displayCollected} / {displayTotal} · {displayPercentage}%
                        </span>
                    </div>
                    <ProgressBar value={displayProgress} label="기본 도감 수집률" />
                    <p className="mt-2 text-xs text-content-secondary">카테고리를 골라 원하는 음식만 찾아보세요</p>
                </div>

                <SearchBar
                    label="음식 이름 검색"
                    placeholder="음식 이름으로 검색해보세요"
                    value={query}
                    onChange={setQuery}
                    className="mt-3"
                />

                <TabBar
                    label="음식 카테고리"
                    variant="scroll"
                    items={categoryTabs}
                    value={activeCategory}
                    onChange={(category) => {
                        setActiveCategory(category)
                        onCategoryChange?.(category)
                    }}
                    className="mt-4"
                />

                <div className="relative mt-3 flex justify-end">
                    <button
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={unlockMenuOpen}
                        onClick={() => setUnlockMenuOpen((open) => !open)}
                        className="flex min-h-touch items-center gap-2 rounded-full border border-edge-default bg-surface-card px-4 text-sm font-bold text-content-primary shadow-card transition-colors hover:bg-white active:scale-[0.98]"
                    >
                        {unlockFilter}
                        <ChevronDownIcon
                            size={16}
                            aria-hidden
                            className={`transition-transform ${unlockMenuOpen ? 'rotate-180' : ''}`}
                        />
                    </button>
                    {unlockMenuOpen && (
                        <div
                            role="listbox"
                            aria-label="해금 상태"
                            className="absolute right-0 top-12 z-20 w-32 overflow-hidden rounded-2xl border border-edge-default bg-surface-card py-1 shadow-card"
                        >
                            {unlockTabs.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    role="option"
                                    aria-selected={unlockFilter === item.id}
                                    onClick={() => {
                                        setUnlockFilter(item.id)
                                        setUnlockMenuOpen(false)
                                    }}
                                    className={`min-h-touch w-full px-4 text-left text-sm ${
                                        unlockFilter === item.id
                                            ? 'bg-watermelon-50 font-bold text-content-link'
                                            : 'text-content-secondary hover:bg-white'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            <main className="no-scrollbar flex-1 overflow-y-auto px-4 pb-6 pt-4">
                <section>
                    <div className="mb-3 flex items-center gap-2">
                        <span
                            aria-hidden
                            className={`h-2 w-2 rounded-full ${activeMeta?.dotClass ?? 'bg-action-primary'}`}
                        />
                        <h2 className="text-base font-bold text-content-primary">
                            {activeCategory === '전체' ? '전체 음식' : activeCategory}
                        </h2>
                        <span className="text-xs text-content-secondary">
                            ·{' '}
                            {unlockFilter === '전체'
                                ? `${visibleCollected}/${sectionTotal}`
                                : `${visibleEntries.length}개`}
                        </span>
                    </div>

                    {visibleEntries.length === 0 ? (
                        <div className="rounded-2xl bg-surface-card p-6 text-center shadow-card">
                            <p className="text-sm text-content-secondary">
                                {query.trim()
                                    ? `'${query.trim()}' 검색 결과가 없어요`
                                    : unlockFilter === '해금'
                                      ? '아직 해금된 카드가 없어요'
                                      : unlockFilter === '미해금'
                                        ? '미해금 카드가 없어요'
                                        : '조건에 맞는 카드가 없어요'}
                            </p>
                            {query.trim() &&
                                (reportedName === query.trim() ? (
                                    <p className="mt-3 text-xs font-medium text-content-link">
                                        제보 접수됐어요 · 검토 후 도감에 추가돼요
                                    </p>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={reporting}
                                        onClick={handleReport}
                                        className="mt-3 min-h-touch rounded-full bg-action-primary px-4 text-xs font-bold text-content-on-action shadow-card disabled:opacity-60"
                                    >
                                        {reporting ? '제보 중…' : '이 음식 제보하기'}
                                    </button>
                                ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-3">
                            {visibleEntries.map((entry) => {
                                const unlocked = collected.has(entry.id)
                                const isNew = unlocked && entry.recentlyUnlocked === true
                                // 이미 열린 칸이면 검토대기를 알릴 이유가 없다 — 칸은 벌써 열려 있다
                                const isAwaitingReview = !unlocked && entry.awaitingReview === true
                                return (
                                    <FoodCard
                                        key={entry.id}
                                        name={entry.name}
                                        emoji={entry.emoji}
                                        illustrationUrl={entry.illustrationUrl ?? getLocalDexIllustrationUrl(entry)}
                                        state={!unlocked ? 'locked' : isNew ? 'recent' : 'unlocked'}
                                        accessibleName={
                                            unlocked
                                                ? `${entry.name}, 해금됨, 별 ${entry.stars ?? 1}개${
                                                      isNew ? ', 새로 해금' : ''
                                                  }`
                                                : isAwaitingReview
                                                  ? `${entry.name}, 미해금 카드, 운영진 검토 대기 중`
                                                  : `${entry.name}, 미해금 카드`
                                        }
                                        onClick={() => onOpenEntry(entry.id, activeCategory)}
                                        corner={
                                            isNew ? (
                                                <CornerSticker label="New" tone="new" />
                                            ) : isAwaitingReview ? (
                                                <CornerSticker label="검토대기" tone="review" />
                                            ) : undefined
                                        }
                                        footer={
                                            unlocked ? (
                                                <div className="flex justify-center">
                                                    <StarRank value={entry.stars ?? 1} size={10} />
                                                </div>
                                            ) : (
                                                <p className="text-center text-xs text-content-secondary">미해금</p>
                                            )
                                        }
                                    />
                                )
                            })}
                        </div>
                    )}
                </section>
            </main>

            <BottomNav active="기본" onTab={onTab} />
            {helpOpen && <DexHelpSheet kind="basic" onClose={() => setHelpOpen(false)} />}
        </div>
    )
}
