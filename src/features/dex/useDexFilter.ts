import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { CATEGORY_META, DexEntry, FoodCategory } from '@/shared/data/dex'
import type { TabItem } from '@/shared/ui'

export type CategoryFilter = '전체' | FoodCategory
export type UnlockFilter = '전체' | '해금' | '미해금'

const UNLOCK_TABS: Array<TabItem<UnlockFilter>> = [
    { id: '전체', label: '전체' },
    { id: '해금', label: '해금' },
    { id: '미해금', label: '미해금' },
]

/**
 * 기본 도감 그리드의 필터·정렬·집계 로직.
 * §3.1 로직은 훅으로, 컴포넌트는 props만 받아 렌더.
 */
export function useDexFilter(entries: DexEntry[], collectedIds: number[], initialCategory: CategoryFilter = '전체') {
    const [activeCategory, setActiveCategory] = useState<CategoryFilter>(initialCategory)
    const [unlockFilter, setUnlockFilter] = useState<UnlockFilter>('전체')
    const [query, setQuery] = useState('')

    useEffect(() => {
        setActiveCategory(initialCategory)
    }, [initialCategory])

    const collected = useMemo(() => new Set(collectedIds), [collectedIds])

    // 입력창은 즉시 반영하되, 무거운 filter+sort는 지연 처리해 타이핑마다의 재계산을 줄인다.
    const deferredQuery = useDeferredValue(query)
    const sectionEntries = useMemo(
        () => (activeCategory === '전체' ? entries : entries.filter((entry) => entry.category === activeCategory)),
        [activeCategory, entries],
    )

    // 해금된 카드를 앞으로, 같은 상태면 도감 번호 순
    const visibleEntries = useMemo(() => {
        const term = deferredQuery.trim().toLowerCase()
        return [...sectionEntries]
            .filter((entry) => {
                if (unlockFilter === '해금' && !collected.has(entry.id)) return false
                if (unlockFilter === '미해금' && collected.has(entry.id)) return false
                return term ? entry.name.toLowerCase().includes(term) : true
            })
            .sort((a, b) => Number(collected.has(b.id)) - Number(collected.has(a.id)) || a.id - b.id)
    }, [collected, deferredQuery, sectionEntries, unlockFilter])

    const categoryTabs = useMemo<Array<TabItem<CategoryFilter>>>(
        () => [
            { id: '전체', label: '전체' },
            ...CATEGORY_META.map((meta) => ({
                id: meta.category as CategoryFilter,
                label: meta.shortLabel,
            })),
        ],
        [],
    )

    // activeMeta는 색 점을 그리려고만 있었다. 점을 걷어내면서 함께 지웠다
    const visibleCollected = visibleEntries.filter((entry) => collected.has(entry.id)).length
    const sectionCollected = sectionEntries.filter((entry) => collected.has(entry.id)).length
    const sectionTotal = sectionEntries.length
    const progress = entries.length > 0 ? collectedIds.length / entries.length : 0
    const sectionProgress = sectionTotal > 0 ? sectionCollected / sectionTotal : 0

    return {
        activeCategory,
        setActiveCategory,
        unlockFilter,
        setUnlockFilter,
        query,
        setQuery,
        categoryTabs,
        unlockTabs: UNLOCK_TABS,
        collected,
        visibleEntries,
        visibleCollected,
        sectionCollected,
        progress,
        percentage: (progress * 100).toFixed(1),
        sectionProgress,
        sectionPercentage: (sectionProgress * 100).toFixed(1),
        sectionTotal,
    }
}
