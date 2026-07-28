"use client";

import type { MyBadge } from "@/features/my/api";
import { ServerBadge } from "@/shared/ui/atoms/ServerBadge";
import { ArrowLeftIcon, CheckIcon } from "lucide-react";
import { useState } from "react";

interface Props {
  badges: MyBadge[];
  pending?: boolean;
  /** badgeId=null이면 장착 해제 */
  onEquip: (badgeId: number | null) => void;
  onBack: () => void;
}

/** 뱃지 보관함 — 획득한 뱃지만 표시, 탭해서 대표 뱃지로 장착/해제. */
export function BadgeCollection({ badges, pending, onEquip, onBack }: Props) {
  const equippedId = badges.find((b) => b.equipped)?.id ?? null;
  const [selected, setSelected] = useState<number | null>(equippedId);

  const isEmpty = badges.length === 0;
  const changed = selected !== equippedId;

  return (
    <div className="flex h-full flex-col bg-cream-100">
      <header className="flex items-center gap-3 px-5 py-4">
        <button onClick={onBack} aria-label="뒤로가기">
          <ArrowLeftIcon size={22} className="text-brown" />
        </button>
        <span className="font-display text-xl text-brown">나의 뱃지</span>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-brown-soft">
              아직 획득한 뱃지가 없어요.
            </p>
            <p className="mt-1 text-xs text-brown-muted">
              미션과 챌린지를 완료하면 뱃지를 모을 수 있어요.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-brown-muted">
              획득한 뱃지를 탭해 대표 뱃지로 설정하세요.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {badges.map((badge) => {
                const active = selected === badge.id;
                return (
                  <button
                    key={badge.id}
                    onClick={() => setSelected(active ? null : badge.id)}
                    className={`relative overflow-hidden rounded-2xl border-2 p-3 text-left ${
                      active
                        ? "border-orange-500 bg-orange-50"
                        : "border-transparent bg-white shadow-soft"
                    }`}
                  >
                    <div className="flex h-20 items-center justify-center rounded-xl bg-cream-50">
                      <ServerBadge
                        imageUrl={badge.imageUrl}
                        name={badge.name}
                        size={48}
                      />
                    </div>
                    <p className="mt-2 text-sm font-bold text-brown">
                      {badge.name}
                    </p>
                    {active && (
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white">
                        <CheckIcon size={13} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </main>

      {!isEmpty && (
        <div className="border-t border-cream-300 bg-cream-50 px-5 py-4">
          <button
            onClick={() => onEquip(selected)}
            disabled={pending || !changed}
            className="min-h-cta w-full rounded-full bg-orange-500 font-display text-lg text-white shadow-card transition active:scale-[0.98] disabled:bg-cream-300 disabled:text-brown-muted disabled:shadow-none"
          >
            {pending
              ? "저장 중…"
              : selected === null
                ? "대표 뱃지 해제"
                : "대표 뱃지로 설정"}
          </button>
        </div>
      )}
    </div>
  );
}
