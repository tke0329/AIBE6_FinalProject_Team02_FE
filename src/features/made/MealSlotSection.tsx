import React, { useRef, useState } from 'react'
import { MealRecordCard } from './MealRecordCard'
import type { LogitFeedCard, LogitFeedSlot } from './logitTypes'

interface Props {
    slot: LogitFeedSlot
    onOpen: (card: LogitFeedCard) => void
    onRecord: (slot: LogitFeedSlot) => void
}

/** 점이 이보다 많아지면 세지 못한다 — 숫자로 바꾼다 */
const DOT_LIMIT = 6

/** §2.1 세로축은 슬롯, 가로축은 사람. 이 축을 뒤집지 않는다 */
export function MealSlotSection({ slot, onOpen, onRecord }: Props) {
    const trackRef = useRef<HTMLDivElement>(null)
    const [index, setIndex] = useState(0)

    const count = slot.cards.length

    const trackScrolled = () => {
        const track = trackRef.current
        if (!track || count === 0) return
        const step = track.scrollWidth / count
        setIndex(Math.min(Math.round(track.scrollLeft / step), count - 1))
    }

    return (
        <section aria-label={slot.name} className="pt-5">
            <header className="flex items-baseline gap-2 pb-2">
                <h2 className="font-display text-lg text-content-primary">{slot.name}</h2>
                {slot.hidden && <p className="text-sm text-content-muted">지금은 쓰지 않는 끼니</p>}
                <span className="flex-1" />
                {count > 1 &&
                    (count <= DOT_LIMIT ? (
                        <span aria-hidden className="flex items-center gap-1">
                            {slot.cards.map((card, position) => (
                                <span
                                    key={card.userId}
                                    className={`h-1.5 w-1.5 rounded-full ${
                                        position === index ? 'bg-action-primary' : 'bg-cream-300'
                                    }`}
                                />
                            ))}
                        </span>
                    ) : (
                        <span aria-hidden className="text-xs font-medium text-content-muted">
                            {index + 1} / {count}
                        </span>
                    ))}
            </header>

            <div
                ref={trackRef}
                onScroll={trackScrolled}
                // scroll-px가 없으면 스냅이 걸릴 때 카드가 화면 왼쪽 끝에 붙어 버린다
                className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 scroll-px-5"
            >
                {slot.cards.map((card) => (
                    <MealRecordCard
                        key={card.userId}
                        card={card}
                        readOnly={slot.hidden}
                        onOpen={() => onOpen(card)}
                        onRecord={() => onRecord(slot)}
                    />
                ))}
            </div>
        </section>
    )
}
