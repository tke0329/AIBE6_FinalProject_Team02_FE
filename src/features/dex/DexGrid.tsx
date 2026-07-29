import { createReport } from '@/features/report/api';
import { DexEntry } from '@/shared/data/dex';
import { HelpIcon } from '@/shared/ui/atoms/HelpIcon';
import { ProgressBar } from '@/shared/ui/atoms/ProgressBar';
import { SearchBar } from '@/shared/ui/atoms/SearchBar';
import { StarRank } from '@/shared/ui/atoms/StarRank';
import { BottomNav, NavTab } from '@/shared/ui/molecules/BottomNav';
import { DexHelpSheet } from '@/shared/ui/molecules/DexHelpSheet';
import { FoodCard } from '@/shared/ui/molecules/FoodCard';
import { TabBar } from '@/shared/ui/molecules/TabBar';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { useDexFilter } from './useDexFilter';
interface DexGridProps {
  entries: DexEntry[];
  collectedIds: number[];
  newlyUnlockedId?: number | null;
  onOpenEntry: (id: number) => void;
  onRegister: () => void;
  onTab: (tab: NavTab) => void;
}

/**
 * 기본 도감 (§6) — 200칸 고정, 미해금은 `?` 실루엣, 진행률 바 사용.
 * 그리드는 모바일 3열 기준(§2)이며 넓은 뷰포트에서만 열을 늘림.
 */
export function DexGrid({
  entries,
  collectedIds,
  newlyUnlockedId,
  onOpenEntry,
  onRegister,
  onTab
}: DexGridProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [reporting, setReporting] = useState(false);             
  const [reportedName, setReportedName] = useState<string | null>(null); 
  
  
  // 검색어를 그대로 제보 이름으로 보낸다.
  async function handleReport() {
    const name = query.trim();
    if (!name || reporting) return;
    setReporting(true);
    try {
      await createReport(name);
      setReportedName(name);
    } catch (e) {
      alert(e instanceof Error ? e.message : '제보에 실패했어요');
    } finally {
      setReporting(false);
    }
  }
  
  const {
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
    percentage,
    sectionTotal
  } = useDexFilter(entries, collectedIds);

  return (
    <div className="relative flex h-full flex-col bg-cream-100">
      <header className="shrink-0 px-4 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1">
            <h1 className="truncate font-display text-xl text-content-primary">나의 음식 도감</h1>
            <HelpIcon label="기본 도감" onClick={() => setHelpOpen(true)} />
          </div>
          <button
            type="button"
            onClick={onRegister}
            className="flex min-h-touch shrink-0 items-center gap-1 rounded-full bg-action-primary px-4 text-sm font-bold text-content-on-action shadow-card transition-colors hover:bg-action-hover active:scale-[0.98]">
            <PlusIcon size={16} strokeWidth={2.75} aria-hidden /> 등록하기
          </button>
        </div>

        <div className="mt-3 rounded-2xl bg-surface-card p-4 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-content-secondary">수집률</span>
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-content-link">
              {collectedIds.length} / 200 · {percentage}%
            </span>
          </div>
          <ProgressBar value={progress} label="기본 도감 수집률" />
          <p className="mt-2 text-xs text-content-secondary">카테고리를 골라 원하는 음식만 찾아보세요</p>
        </div>

        <SearchBar
          label="음식 이름 검색"
          placeholder="음식 이름으로 검색해보세요"
          value={query}
          onChange={setQuery}
          className="mt-3" />

        <TabBar
          label="음식 카테고리"
          variant="scroll"
          items={categoryTabs}
          value={activeCategory}
          onChange={setActiveCategory}
          className="mt-4" />

      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto px-4 pb-6 pt-4">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span aria-hidden className={`h-2 w-2 rounded-full ${activeMeta?.dotClass ?? 'bg-action-primary'}`} />
            <h2 className="text-base font-bold text-content-primary">
              {activeCategory === '전체' ? '전체 음식' : activeCategory}
            </h2>
            <span className="text-xs text-content-secondary">· {visibleCollected}/{sectionTotal}</span>
          </div>

          {visibleEntries.length === 0 ?
            <div className="rounded-2xl bg-surface-card p-6 text-center shadow-card">
              <p className="text-sm text-content-secondary">
                {query.trim() ? `'${query.trim()}' 검색 결과가 없어요` : '조건에 맞는 카드가 없어요'}
              </p>
              {query.trim() && (
                reportedName === query.trim() ? (
                  <p className="mt-3 text-xs font-medium text-content-link">
                    제보 접수됐어요 · 검토 후 도감에 추가돼요
                  </p>
                ) : (
                  <button
                    type="button"
                    disabled={reporting}
                    onClick={handleReport}
                    className="mt-3 min-h-touch rounded-full bg-action-primary px-4 text-xs font-bold text-content-on-action shadow-card disabled:opacity-60">
                    {reporting ? '제보 중…' : '이 음식 제보하기'}
                  </button>
                )
              )}
            </div> :
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
              {visibleEntries.map((entry) => {
                const unlocked = collected.has(entry.id);
                const isNew = entry.id === newlyUnlockedId;
                return (
                  <FoodCard
                    key={entry.id}
                    name={entry.name}
                    emoji={entry.emoji}
                    illustrationUrl={entry.illustrationUrl}
                    state={!unlocked ? 'locked' : isNew ? 'recent' : 'unlocked'}
                    accessibleName={
                      unlocked ?
                        `${entry.name}, 해금됨, 별 ${entry.stars ?? 1}개` :
                        `${entry.name}, 미해금 카드`
                    }
                    onClick={() => onOpenEntry(entry.id)}
                    corner={
                      isNew ?
                        <span className="absolute -right-2 -top-2 rounded-full bg-blue-500 px-2 py-1 text-xs font-bold leading-none text-white">
                          New
                        </span> :
                        undefined
                    }
                    footer={
                      unlocked ?
                        <div className="flex justify-center"><StarRank value={entry.stars ?? 1} size={10} /></div> :
                        <p className="text-center text-xs text-content-secondary">미해금</p>
                    } />);


              })}
            </div>
          }
        </section>
      </main>

      <BottomNav active="기본" onTab={onTab} />
      {helpOpen && <DexHelpSheet kind="basic" onClose={() => setHelpOpen(false)} />}
    </div>);

}
