'use client';

import React, { useMemo, useState } from 'react';
import { PlusIcon, SearchXIcon, XIcon } from 'lucide-react';
import { CATEGORY_META, DexEntry, FoodCategory } from '@/shared/data/dex';
import { buildDexSearchIndex, searchDex } from '@/shared/lib/dexSearch';
import { SearchBar } from '@/shared/ui/atoms/SearchBar';
import { MAX_FOOD_NAMES, useRegisterFlow } from './RegisterFlowContext';

interface Props {
  /** 도감 200칸. AppStateProvider가 이미 받아 둔 것을 그대로 쓴다 */
  entries: DexEntry[];
}

/**
 * 등록할 음식 이름 고르기.
 *
 * 자유 타이핑을 받지 않는다 — 오타·표기 흔들림이 AI 검증과 도감 칸 매핑을 동시에 깨뜨려서
 * 도감 200칸 검색·선택으로만 입력받는 것이 확정 사항이다 (AGENTS.md §5.2).
 * 대신 타이핑 부담을 줄이려고 초성(ㄱㅊㅉㄱ)·별칭(돼지김치찌개)을 지원한다.
 *
 * 검색창만으로는 "도감에 뭐가 있었더라"를 못 푼다 — 칠 말이 떠오르지 않으면 검색도 못 하기 때문에,
 * 검색어가 비어 있을 때는 카테고리별 둘러보기를 대신 보여준다.
 */
export function FoodNamePicker({ entries }: Props) {
  const { selectedSlots, addSlot, removeSlot, canAddMore, aliases } = useRegisterFlow();
  const [query, setQuery] = useState('');
  const [browseCategory, setBrowseCategory] = useState<FoodCategory | null>(null);

  const index = useMemo(() => buildDexSearchIndex(entries, aliases), [entries, aliases]);
  const results = useMemo(() => searchDex(index, query), [index, query]);

  const browseResults = useMemo(
    () => (browseCategory ? entries.filter((entry) => entry.category === browseCategory) : []),
    [entries, browseCategory],
  );

  const selectedIds = useMemo(
    () => new Set(selectedSlots.map((slot) => slot.id)),
    [selectedSlots],
  );

  const searching = query.trim().length > 0;

  const renderSlotButton = (slot: DexEntry) => {
    const alreadyPicked = selectedIds.has(slot.id);
    const disabled = alreadyPicked || !canAddMore;

    return (
      <button
        key={slot.id}
        type="button"
        disabled={disabled}
        onClick={() => {
          addSlot(slot);
          setQuery('');
          setBrowseCategory(null);
        }}
        aria-label={alreadyPicked ? `${slot.name}, 이미 고름` : `${slot.name} 고르기`}
        className="flex min-h-touch w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-accent disabled:opacity-40">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-accent text-xl">
          {slot.emoji}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-content-primary">{slot.name}</span>
        <span className="shrink-0 text-xs text-content-secondary">
          {alreadyPicked ? '고름' : slot.category}
        </span>
      </button>
    );
  };

  return (
    <section className="mt-6" aria-label="음식 이름 고르기">
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium text-content-secondary" htmlFor="dex-search">
          어떤 음식인가요? <span className="text-content-link">(필수)</span>
        </label>
        <span className="text-xs text-content-secondary">
          {selectedSlots.length} / {MAX_FOOD_NAMES}
        </span>
      </div>

      {selectedSlots.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2" aria-label="고른 음식">
          {selectedSlots.map((slot) => (
            <li key={slot.id}>
              <button
                type="button"
                onClick={() => removeSlot(slot.id)}
                aria-label={`${slot.name} 빼기`}
                className="flex min-h-touch items-center gap-1.5 rounded-full bg-action-primary px-3 text-sm font-bold text-content-on-action">
                {slot.name}
                <XIcon size={14} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {canAddMore ? (
        <SearchBar
          label="도감에서 음식 검색"
          placeholder="초성·별칭도 돼요 (예: ㄱㅊㅉㄱ)"
          value={query}
          onChange={setQuery} />
      ) : (
        <p className="rounded-2xl bg-surface-accent p-3 text-center text-xs text-content-secondary">
          한 번에 최대 {MAX_FOOD_NAMES}개까지 고를 수 있어요
        </p>
      )}

      {canAddMore && searching && (
        <div className="mt-2 overflow-hidden rounded-2xl border border-edge-default bg-surface-card">
          {results.length > 0 ? (
            <>
              <p className="px-3 pt-2 text-xs font-medium text-content-secondary">도감 검색 결과</p>
              {results.map(renderSlotButton)}
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 px-3 py-6 text-center">
              <SearchXIcon size={20} aria-hidden className="text-content-muted" />
              <p className="text-sm font-medium text-content-primary">아직 도감에 없어요</p>
              <p className="text-xs text-content-secondary">다른 이름으로 찾아보거나 둘러보세요</p>
            </div>
          )}
        </div>
      )}

      {canAddMore && !searching && (
        <div className="mt-3">
          <div className="mb-2 flex items-center gap-1.5">
            <PlusIcon size={14} aria-hidden className="text-content-link" />
            <h3 className="text-xs font-bold text-content-primary">뭐가 있는지 둘러보기</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORY_META.map((meta) => {
              const active = browseCategory === meta.category;
              return (
                <button
                  key={meta.category}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setBrowseCategory(active ? null : meta.category)}
                  className={`flex min-h-touch items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
                    active
                      ? 'border-edge-active bg-action-primary text-content-on-action'
                      : 'border-edge-default bg-surface-card text-content-secondary'
                  }`}>
                  <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
                  {meta.shortLabel}
                </button>
              );
            })}
          </div>

          {browseCategory && (
            <div className="mt-2 max-h-64 overflow-y-auto overscroll-contain rounded-2xl border border-edge-default bg-surface-card">
              {browseResults.map(renderSlotButton)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
