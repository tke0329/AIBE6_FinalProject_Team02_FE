import { useDeferredValue, useMemo, useState } from 'react';
import { CATEGORY_META, DexEntry, FoodCategory } from '@/shared/data/dex';
import type { TabItem } from '@/shared/ui/molecules/TabBar';

export type CategoryFilter = '전체' | FoodCategory;

/** 기본 도감은 운영진 지정 200칸 고정 (§6) */
export const DEX_TOTAL = 200;

/**
 * 기본 도감 그리드의 필터·정렬·집계 로직.
 * §3.1 로직은 훅으로, 컴포넌트는 props만 받아 렌더.
 */
export function useDexFilter(entries: DexEntry[], collectedIds: number[]) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('전체');
  const [query, setQuery] = useState('');

  const collected = useMemo(() => new Set(collectedIds), [collectedIds]);

  // 입력창은 즉시 반영하되, 무거운 filter+sort는 지연 처리해 타이핑마다의 재계산을 줄인다.
  const deferredQuery = useDeferredValue(query);

  // 해금된 카드를 앞으로, 같은 상태면 도감 번호 순
  const visibleEntries = useMemo(() => {
    const term = deferredQuery.trim().toLowerCase();
    return [...(activeCategory === '전체' ?
      entries :
      entries.filter((entry) => entry.category === activeCategory))].filter((entry) =>
      term ? entry.name.toLowerCase().includes(term) : true
    ).sort(
      (a, b) => Number(collected.has(b.id)) - Number(collected.has(a.id)) || a.id - b.id
    );
  }, [activeCategory, collected, entries, deferredQuery]);

  const categoryTabs = useMemo<Array<TabItem<CategoryFilter>>>(
    () => [
      { id: '전체', label: '전체' },
      ...CATEGORY_META.map((meta) => ({
        id: meta.category as CategoryFilter,
        label: meta.shortLabel,
        dotClass: meta.dotClass,
      })),
    ],
    []
  );

  const activeMeta = CATEGORY_META.find((meta) => meta.category === activeCategory);
  const visibleCollected = visibleEntries.filter((entry) => collected.has(entry.id)).length;
  const progress = collectedIds.length / DEX_TOTAL;

  return {
    activeCategory,
    setActiveCategory,
    query,
    setQuery,
    categoryTabs,
    collected,
    visibleEntries,
    activeMeta,
    visibleCollected,
    progress,
    percentage: (progress * 100).toFixed(1),
    sectionTotal: activeCategory === '전체' ? DEX_TOTAL : activeMeta?.total,
  };
}
