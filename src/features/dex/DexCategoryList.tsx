"use client";

import { CATEGORY_META, DexEntry } from "@/shared/data/dex";
import { ProgressBar } from "@/shared/ui/atoms/ProgressBar";
import { BottomNav, NavTab } from "@/shared/ui/molecules/BottomNav";
import { DexHelpSheet } from "@/shared/ui/molecules/DexHelpSheet";
import { ChevronRightIcon, LayoutGridIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { CategoryFilter } from "./useDexFilter";

interface Props {
  entries: DexEntry[];
  collectedIds: number[];
  onOpenCategory: (category: CategoryFilter) => void;
  onRegister: () => void;
  onTab: (tab: NavTab) => void;
}

export function DexCategoryList({
  entries,
  collectedIds,
  onOpenCategory,
  onRegister,
  onTab,
}: Props) {
  const [helpOpen, setHelpOpen] = useState(false);
  const collected = useMemo(() => new Set(collectedIds), [collectedIds]);
  const totalCount = entries.length;
  const progress = totalCount > 0 ? collectedIds.length / totalCount : 0;
  const rows = useMemo(
    () =>
      CATEGORY_META.map((meta) => ({
        ...meta,
        total: entries.filter((entry) => entry.category === meta.category)
          .length,
        mine: entries.filter(
          (entry) =>
            entry.category === meta.category && collected.has(entry.id),
        ).length,
      })),
    [collected, entries],
  );

  return (
    <div className="relative flex h-full flex-col bg-cream-100">
      <header className="px-5 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5">
            <h1 className="truncate font-display text-2xl text-brown">
              기본 도감
            </h1>
            <button
              onClick={() => setHelpOpen(true)}
              aria-label="기본 도감 도움말"
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cream-200 text-[12px] font-bold text-brown-muted"
            >
              ?
            </button>
          </div>
          <button
            onClick={onRegister}
            className="flex shrink-0 items-center gap-1 rounded-full bg-orange-500 px-3 py-2 text-sm font-bold text-white shadow-soft"
          >
            <PlusIcon size={16} strokeWidth={2.75} /> 등록하기
          </button>
        </div>
        <div className="mt-3 rounded-2xl bg-white p-4 shadow-soft">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-brown-soft">수집률</span>
            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-600">
              {collectedIds.length} / {totalCount} · {(progress * 100).toFixed(1)}%
            </span>
          </div>
            <ProgressBar value={progress} />
          <p className="mt-2 text-xs text-brown-muted">
            카테고리를 선택하면 해당 음식만 모아서 보여드려요
          </p>
        </div>
      </header>
      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6 pt-4">
        <button
          onClick={() => onOpenCategory("전체")}
          className="flex w-full items-center gap-3 rounded-2xl bg-orange-500 p-4 text-left text-white shadow-card active:scale-[0.99]"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
            <LayoutGridIcon size={21} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-lg">전체 음식 보기</span>
            <span className="mt-0.5 block text-xs text-orange-100">
              {collectedIds.length} / {totalCount} 수집
            </span>
          </span>
          <ChevronRightIcon size={19} className="text-orange-100" />
        </button>
        <h2 className="mb-2 mt-5 text-sm font-bold text-brown">카테고리</h2>
        <div className="space-y-2.5">
          {rows.map((row) => (
            <button
              key={row.category}
              onClick={() => onOpenCategory(row.category)}
              className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-soft active:scale-[0.99]"
            >
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${row.dotClass}`}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-base text-brown">
                  {row.category}
                </span>
                <div className="mt-2">
                  <ProgressBar
                    value={row.total > 0 ? row.mine / row.total : 0}
                    animate={false}
                  />
                </div>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-sm font-bold text-orange-600">
                  {row.mine}/{row.total}
                </span>
                <span className="text-[10px] text-brown-muted">수집</span>
              </span>
              <ChevronRightIcon
                size={18}
                className="shrink-0 text-brown-muted"
              />
            </button>
          ))}
        </div>
      </main>
      <BottomNav active="기본" onTab={onTab} />
      {helpOpen && (
        <DexHelpSheet kind="basic" onClose={() => setHelpOpen(false)} />
      )}
    </div>
  );
}
