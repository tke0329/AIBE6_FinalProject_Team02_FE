import React from 'react'
import { PlusIcon } from 'lucide-react'
import { LogitAvatar } from './LogitAvatar'
import { cardName, timeLabel } from './logitTypes'
import type { LogitFeedCard } from './logitTypes'

interface Props {
    card: LogitFeedCard
    /** 숨긴 슬롯. 빈 카드로 새 기록을 유도하지 않는다 */
    readOnly?: boolean
    onOpen: () => void
    onRecord: () => void
}

/** §3.2 로그잇 홈 기록 카드 — filled / empty-mine / empty-other */
export function MealRecordCard({ card, readOnly = false, onOpen, onRecord }: Props) {
    const name = cardName(card)
    const filled = card.recordCount > 0

    // 다음 카드가 살짝 보여야 가로로 더 있다는 게 드러난다 (§2.1)
    return (
        <article className="w-4/5 max-w-80 shrink-0 snap-start">
            <div className="flex items-center gap-2 pb-2">
                <LogitAvatar name={name} imageUrl={card.profileImageUrl} />
                <p className="min-w-0 flex-1 truncate text-sm font-bold text-content-primary">
                    {card.me ? '나' : name}
                </p>
                {filled && (
                    <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-1 text-xs font-bold text-content-secondary">
                        {card.recordCount}개
                    </span>
                )}
            </div>

            {filled ? (
                <button
                    type="button"
                    onClick={onOpen}
                    aria-label={`${card.me ? '내' : `${name}님의`} 기록 ${card.recordCount}개 보기`}
                    className="block w-full overflow-hidden rounded-2xl bg-neutral-100 shadow-card transition-transform active:scale-[0.98]"
                >
                    <span className="relative block aspect-square w-full bg-neutral-100">
                        {card.thumbnailUrl && (
                            // presigned URL이라 next/image의 도메인 설정 대상이 아니다
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={card.thumbnailUrl}
                                alt=""
                                className="h-full w-full object-cover"
                                style={{ objectPosition: `${card.thumbnailCropX}% ${card.thumbnailCropY}%` }}
                            />
                        )}
                        {/* 사진 밝기를 가리지 않으려고 그라데이션 대신 알약 하나만 얹는다 */}
                        {card.loggedAt && (
                            <span className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2.5 py-1 text-xs font-bold tabular-nums text-white backdrop-blur-sm">
                                {timeLabel(card.loggedAt)}
                            </span>
                        )}
                    </span>
                </button>
            ) : card.me && !readOnly ? (
                <button
                    type="button"
                    onClick={onRecord}
                    className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-edge-default bg-white transition-transform active:scale-[0.98]"
                >
                    <PlusIcon size={22} aria-hidden className="text-content-link" />
                    <span className="text-sm font-bold text-content-link">기록하기</span>
                </button>
            ) : (
                <div className="flex aspect-square w-full items-center justify-center rounded-2xl border-2 border-dashed border-edge-default bg-white px-4">
                    <span className="break-keep text-center text-sm font-medium text-content-muted">
                        친구가 아직 기록하지 않았어요!
                    </span>
                </div>
            )}
        </article>
    )
}
