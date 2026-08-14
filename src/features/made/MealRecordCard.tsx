import React from 'react'
import { PlusIcon } from 'lucide-react'
import { LogitAvatar } from './LogitAvatar'
import { cardName, timeLabel } from './logitTypes'
import type { LogitFeedCard } from './logitTypes'

interface Props {
    card: LogitFeedCard
    /** 숨긴 슬롯. 빈 카드로 새 기록을 유도하지 않는다 */
    readOnly?: boolean
    /** 그 끼니에 아무도 안 적었을 때 빈 칸에 띄우는 글. 하루 단위로 바꿀 수 있다 */
    emptyCaption: string
    onOpen: () => void
    onRecord: () => void
    /** 아바타·이름을 누르면 그 사람 프로필로. 내 카드면 마이페이지로 */
    onOpenProfile: () => void
    /**
     * 이 끼니의 참여자가 나 하나뿐. **옆을 비워 둘 이유가 없다.**
     *
     * `w-4/5`는 "옆에 카드가 더 있다"를 보여 주려고 일부러 좁힌 폭인데,
     * 혼자면 엿보일 것이 없어서 그냥 오른쪽이 빈 채로 치우쳐 보였다
     */
    solo?: boolean
}

/** §3.2 로그잇 홈 기록 카드 — filled / empty-mine / empty-other */
export function MealRecordCard({
    card,
    readOnly = false,
    emptyCaption,
    onOpen,
    onRecord,
    onOpenProfile,
    solo = false,
}: Props) {
    const name = cardName(card)
    const filled = card.recordCount > 0

    // 다음 카드가 살짝 보여야 가로로 더 있다는 게 드러난다 (§2.1)
    return (
        <article className={`max-w-80 shrink-0 snap-start ${solo ? 'w-full' : 'w-4/5'}`}>
            {/* 아바타와 이름을 한 단추로 묶는다. 동그라미만 누르게 하면 표적이 너무 작다 */}
            <button
                type="button"
                onClick={onOpenProfile}
                aria-label={card.me ? '내 프로필 보기' : `${name}님의 프로필 보기`}
                className="no-touch-expand flex w-full items-center gap-2 pb-2 text-left"
            >
                <LogitAvatar name={name} imageUrl={card.profileImageUrl} userId={card.userId} />
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-content-primary">
                    {card.me ? '나' : name}
                </span>
                {/* 장수 배지를 두지 않는다 — 한 끼에 기록 하나라 항상 "1개"여서 알려 주는 게 없다 */}
            </button>

            {filled ? (
                <button
                    type="button"
                    onClick={onOpen}
                    aria-label={`${card.me ? '내' : `${name}님의`} 기록 보기`}
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
                    <span className="text-center text-sm font-medium text-content-muted">{emptyCaption}</span>
                </div>
            )}
        </article>
    )
}
