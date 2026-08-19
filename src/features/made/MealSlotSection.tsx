import React, { useRef, useState } from 'react'
import { MealRecordCard } from './MealRecordCard'
import type { LogitFeedCard, LogitFeedSlot } from './logitTypes'

interface Props {
    slot: LogitFeedSlot
    /** 오늘이 아니면 기록을 받지 않는다. 지난 날은 열람만 */
    canRecord: boolean
    /** 빈 칸에 띄울 글. 하루 단위로 정한다 */
    emptyCaption: string
    onOpen: (card: LogitFeedCard) => void
    onRecord: (slot: LogitFeedSlot) => void
    onOpenProfile: (card: LogitFeedCard) => void
    /** 온보딩 투어가 짚을 앵커. 첫 끼니에만 붙는다 */
    dataTour?: string
}

/** 점이 이보다 많아지면 세지 못한다 — 숫자로 바꾼다 */
const DOT_LIMIT = 6

/** §2.1 세로축은 슬롯, 가로축은 사람. 이 축을 뒤집지 않는다 */
export function MealSlotSection({ slot, canRecord, emptyCaption, onOpen, onRecord, onOpenProfile, dataTour }: Props) {
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
        <section aria-label={slot.name} data-tour={dataTour} className="pt-5">
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
                                        position === index ? 'bg-action-primary' : 'bg-neutral-200'
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

            {/*
                참여자가 **한 명이면 가운데**, 둘부터는 지금처럼 왼쪽에서 시작한다.

                가로 캐러셀은 "옆으로 더 있다"를 말하려고 카드를 왼쪽에 붙이고 폭을 좁혀
                다음 카드를 엿보이게 한다(§2.1). 혼자일 때는 엿보일 것이 없어서 그 규칙이
                **오른쪽만 텅 빈 화면**으로 남았다. 넘길 것이 없으면 스냅도 끈다
            */}
            <div
                ref={trackRef}
                onScroll={trackScrolled}
                // scroll-px가 없으면 스냅이 걸릴 때 카드가 화면 왼쪽 끝에 붙어 버린다
                className={`no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 ${
                    count > 1 ? 'snap-x snap-mandatory scroll-px-5' : 'justify-center'
                }`}
            >
                {slot.cards.map((card) => (
                    <MealRecordCard
                        key={card.userId}
                        card={card}
                        readOnly={slot.hidden || !canRecord}
                        emptyCaption={emptyCaption}
                        solo={count === 1}
                        onOpen={() => onOpen(card)}
                        onRecord={() => onRecord(slot)}
                        onOpenProfile={() => onOpenProfile(card)}
                    />
                ))}
            </div>
        </section>
    )
}
