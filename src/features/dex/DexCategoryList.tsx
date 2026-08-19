'use client'

import { GuideTour } from '@/features/onboarding/GuideTour'
import { useGuide } from '@/features/onboarding/useGuide'
import { CATEGORY_META, DexEntry } from '@/shared/data/dex'
import { BottomNav, HelpIcon, NavTab, ProgressBar } from '@/shared/ui'
import { ChevronRightIcon, LayoutGridIcon, PlusIcon } from 'lucide-react'
import { useMemo } from 'react'
import type { CategoryFilter } from './useDexFilter'

/** 위쪽 수집률 바가 먼저 차오르고, 그다음 카테고리들이 따라 온다 */
const FILL_LEAD = 0.25
/** 카테고리 사이 간격(초). 아홉 줄이라 0.06을 넘기면 마지막 줄이 눈에 띄게 늦는다 */
const FILL_GAP = 0.06

interface Props {
    entries: DexEntry[]
    collectedIds: number[]
    onOpenCategory: (category: CategoryFilter) => void
    onRegister: () => void
    onTab: (tab: NavTab) => void
}

export function DexCategoryList({ entries, collectedIds, onOpenCategory, onRegister, onTab }: Props) {
    // 칸 데이터가 도착한 뒤에 켠다 — 비어 있으면 짚을 요소가 없어 투어가 헛돈다
    const guide = useGuide('basit-category', entries.length > 0)
    const collected = useMemo(() => new Set(collectedIds), [collectedIds])
    const totalCount = entries.length
    const progress = totalCount > 0 ? collectedIds.length / totalCount : 0
    const rows = useMemo(
        () =>
            CATEGORY_META.map((meta) => ({
                ...meta,
                total: entries.filter((entry) => entry.category === meta.category).length,
                mine: entries.filter((entry) => entry.category === meta.category && collected.has(entry.id)).length,
            })),
        [collected, entries],
    )

    return (
        <div className="relative flex h-full flex-col bg-surface-app">
            <header className="px-5 pt-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-1.5">
                        <h1 className="font-display text-2xl text-neutral-900">베이짓</h1>
                        {/* 직접 그린 20px 버튼이었다 — 44px 터치 타깃 위반이라 공용 아이콘으로 바꿈 */}
                        <HelpIcon label="베이짓" onClick={guide.replay} />
                    </div>
                    <button
                        data-tour="basit-register"
                        onClick={onRegister}
                        className="flex shrink-0 items-center gap-1 rounded-full bg-watermelon-500 px-3 py-2 text-sm font-bold text-white shadow-soft"
                    >
                        <PlusIcon size={16} strokeWidth={2.75} /> 등록하기
                    </button>
                </div>
                <div data-tour="basit-progress" className="mt-3 rounded-2xl bg-white p-4 shadow-soft">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-800">수집률</span>
                        <span className="rounded-full bg-watermelon-50 px-2.5 py-1 text-xs font-bold text-watermelon-600">
                            {collectedIds.length} / {totalCount} · {(progress * 100).toFixed(1)}%
                        </span>
                    </div>
                    <ProgressBar value={progress} />
                    <p className="mt-2 text-xs text-neutral-400">카테고리를 선택하면 해당 음식만 모아서 보여드려요</p>
                </div>
            </header>
            <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6 pt-4">
                <button
                    onClick={() => onOpenCategory('전체')}
                    className="flex w-full items-center gap-3 rounded-2xl bg-watermelon-500 p-4 text-left text-white shadow-card active:scale-[0.99]"
                >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                        <LayoutGridIcon size={21} />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block font-display text-lg">전체 음식 보기</span>
                        <span className="mt-0.5 block text-xs text-watermelon-100">
                            {collectedIds.length} / {totalCount} 수집
                        </span>
                    </span>
                    <ChevronRightIcon size={19} className="text-watermelon-100" />
                </button>
                <h2 className="mb-2 mt-5 text-sm font-bold text-neutral-900">카테고리</h2>
                <div className="space-y-2.5">
                    {rows.map((row, index) => (
                        <button
                            key={row.category}
                            // 첫 줄만 짚는다 — 아홉 줄이 다 같은 모양이라 하나면 충분
                            data-tour={index === 0 ? 'basit-category-row' : undefined}
                            onClick={() => onOpenCategory(row.category)}
                            className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-soft active:scale-[0.99]"
                        >
                            <span className="min-w-0 flex-1">
                                {/* 자르지 않는다 — '빵·버거·피자·브런치'처럼 긴 이름이 낱말 가운데서 사라진다 */}
                                <span className="block font-display text-base text-neutral-900">{row.category}</span>
                                <div className="mt-2">
                                    {/* 위에서부터 차례로 차오른다 — 목록이 한꺼번에 채워지면 움직임이 안 읽힌다 */}
                                    <ProgressBar
                                        value={row.total > 0 ? row.mine / row.total : 0}
                                        delay={FILL_LEAD + index * FILL_GAP}
                                    />
                                </div>
                            </span>
                            <span className="shrink-0 text-right">
                                <span className="block text-sm font-bold text-watermelon-600">
                                    {row.mine}/{row.total}
                                </span>
                                <span className="text-xs text-neutral-400">수집</span>
                            </span>
                            <ChevronRightIcon size={18} className="shrink-0 text-neutral-400" />
                        </button>
                    ))}
                </div>
            </main>
            <BottomNav active="기본" onTab={onTab} />
            <GuideTour guide={guide} />
        </div>
    )
}
