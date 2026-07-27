import React from 'react';
import { motion } from 'framer-motion';

/**
 * §3.2 도감 그리드 카드.
 * - `unlocked` 사진(이모지) + 이름 + 하단 슬롯(별점/태그)
 * - `locked`   일러스트를 흑백 처리 + "미해금" 라벨 (§5 색에만 의존하지 않기 위해 텍스트 병기)
 * - `recent`   최근 해금 강조 테두리
 */
export type FoodCardState = 'unlocked' | 'locked' | 'recent';

interface FoodCardProps {
  name: string;
  emoji: string;
  illustrationUrl?: string;
  state: FoodCardState;
  /** 스크린리더용 전체 설명. 예: "김치찌개, 해금됨, 별 1개" */
  accessibleName: string;
  onClick?: () => void;
  /** 이름 아래 영역 — 별점, #태그 등 */
  footer?: React.ReactNode;
  /** 우측 상단 코너 뱃지 — "New" 등 */
  corner?: React.ReactNode;
  /** 우측 하단 겹침 뱃지 — 등록자 이니셜 등 */
  overlay?: React.ReactNode;
  /** locked일 때 이름 대신 보여줄 문자열 */
  lockedName?: string;
}

export function FoodCard({
  name,
  emoji,
  illustrationUrl,
  state,
  accessibleName,
  onClick,
  footer,
  corner,
  overlay,
  lockedName = name
}: FoodCardProps) {
  const locked = state === 'locked';

  return (
    <motion.button
      type="button"
      whileTap={locked ? undefined : { scale: 0.95 }}
      onClick={locked ? undefined : onClick}
      disabled={locked}
      aria-label={accessibleName}
      className={`relative flex min-h-touch min-w-0 flex-col items-center rounded-2xl p-3 ${
        locked ? 'bg-surface-card-locked' : 'bg-surface-card shadow-card'
      } ${state === 'recent' ? 'ring-2 ring-edge-recent' : ''}`}>

      {corner}
      <div
        aria-hidden
        className="mb-2 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl text-3xl">
        {illustrationUrl ? (
          <img
            src={illustrationUrl}
            alt=""
            className={`h-14 w-14 object-cover ${locked ? 'grayscale' : ''}`}
          />
        ) : locked ? (
          <div className="h-14 w-14 rounded-xl bg-black" />
        ) : emoji}
      </div>
      <span
        aria-hidden
        className={`w-full truncate text-center text-xs font-medium ${
          locked ? 'text-content-secondary' : 'text-content-primary'
        }`}>
        {locked ? lockedName : name}
      </span>
      {footer ?
        <div aria-hidden className="mt-1 w-full">{footer}</div> :
        <span aria-hidden className="mt-1 text-xs text-content-secondary">{locked ? '미해금' : ''}</span>
      }
      {overlay}
    </motion.button>);

}
