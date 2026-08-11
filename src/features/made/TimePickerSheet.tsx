import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import { BottomSheet } from '@/shared/ui/molecules/BottomSheet'

interface Props {
    /** `HH:mm` (24시간). 비어 있으면 아직 안 적은 것 */
    value: string
    onDone: (value: string) => void
    onClose: () => void
}

type Meridiem = '오전' | '오후'

function split(value: string): { meridiem: Meridiem; hour: number; minute: number } {
    if (!value) return { meridiem: '오전', hour: 12, minute: 0 }
    const [rawHour, rawMinute] = value.split(':')
    const hour24 = Number(rawHour)
    const meridiem: Meridiem = hour24 >= 12 ? '오후' : '오전'
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
    return { meridiem, hour: hour12, minute: Number(rawMinute) }
}

function toValue(meridiem: Meridiem, hour: number, minute: number): string {
    const base = hour % 12
    const hour24 = meridiem === '오후' ? base + 12 : base
    return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)

export function TimePickerSheet({ value, onDone, onClose }: Props) {
    const initial = split(value)
    const [meridiem, setMeridiem] = useState<Meridiem>(initial.meridiem)
    const [hour, setHour] = useState(initial.hour)
    const [minute, setMinute] = useState(initial.minute)

    return (
        <BottomSheet title="언제 먹었나요?" onClose={onClose}>
            <div className="px-5 pb-8 pt-4">
                {/* 오전/오후 + 휠 피커를 한 줄로 */}
                <div className="relative mx-auto flex items-center justify-center gap-2">
                    {/* 오전/오후 세로 토글 */}
                    <div className="flex flex-col gap-1">
                        {(['오전', '오후'] as const).map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => setMeridiem(option)}
                                aria-pressed={meridiem === option}
                                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                                    meridiem === option
                                        ? 'bg-action-primary text-content-on-action'
                                        : 'bg-neutral-100/70 text-content-muted'
                                }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>

                    {/* 선택 영역 하이라이트 — 두 휠에 걸쳐 가로로 깔림 */}
                    <div className="relative flex items-center">
                        <div
                            className="pointer-events-none absolute inset-x-0 z-10 rounded-2xl bg-neutral-100/60"
                            style={{ top: '50%', height: ITEM_HEIGHT, transform: 'translateY(-50%)' }}
                        />

                        <WheelPicker
                            items={HOURS}
                            value={hour}
                            onChange={setHour}
                            format={(v) => String(v)}
                            label="시"
                        />

                        <span className="relative z-20 shrink-0 font-display text-2xl text-content-primary">:</span>

                        <WheelPicker
                            items={MINUTES}
                            value={minute}
                            onChange={setMinute}
                            format={(v) => String(v).padStart(2, '0')}
                            label="분"
                        />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => onDone(toValue(meridiem, hour, minute))}
                    className="mt-8 h-cta w-full rounded-full bg-action-primary text-sm font-bold text-content-on-action"
                >
                    완료
                </button>
            </div>
        </BottomSheet>
    )
}

// ---------------------------------------------------------------------------
// 휠 피커
// ---------------------------------------------------------------------------

const ITEM_HEIGHT = 48
const VISIBLE_COUNT = 5
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT
/** 손을 뗀 뒤 이만큼 조용하면 고른 것으로 본다 */
const SETTLE_MS = 80
/** smooth 스크롤이 목표에 닿기까지 기다려 주는 최대 시간. 안 닿아도 휠이 굳지 않게 푼다 */
const PROGRAMMATIC_MAX_MS = 600

interface WheelPickerProps<T extends number> {
    items: T[]
    value: T
    onChange: (value: T) => void
    format: (value: T) => string
    label: string
}

function WheelPicker<T extends number>({ items, value, onChange, format, label }: WheelPickerProps<T>) {
    const listRef = useRef<HTMLDivElement>(null)
    const settling = useRef<ReturnType<typeof setTimeout> | null>(null)

    /**
     * 우리가 만든 스크롤의 목표 위치. 여기 닿기 전까지의 스크롤 이벤트는 사용자 입력이 아니다.
     * 시간으로 억제하면(rAF 한 프레임) smooth 애니메이션이 여러 프레임에 걸쳐 진행되는 동안
     * 이벤트가 새어 들어와 정착이 다시 시작된다.
     */
    const target = useRef<number | null>(null)
    const targetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    /** 방금 내가 올린 값. 부모가 그대로 돌려줄 때 스크롤을 다시 건드리지 않으려고 들고 있다 */
    const emitted = useRef<T | null>(null)

    const padding = Math.floor(VISIBLE_COUNT / 2)

    // 휠 두 개(시·분)가 같은 화면에 있어 id가 겹치면 안 된다
    const listId = useId()
    const optionId = (item: T) => `${listId}-${item}`

    const releaseTarget = () => {
        target.current = null
        if (targetTimer.current) {
            clearTimeout(targetTimer.current)
            targetTimer.current = null
        }
    }

    const scrollToIndex = useCallback((index: number, smooth: boolean) => {
        const list = listRef.current
        if (!list) return

        const top = index * ITEM_HEIGHT
        // 이미 그 자리면 스크롤 이벤트가 나지 않는다. 억제를 걸어 두면 풀어 줄 계기가 없어
        // 사용자가 그다음에 굴리는 것까지 삼킨다
        if (Math.abs(list.scrollTop - top) <= 1) {
            releaseTarget()
            return
        }

        target.current = top
        if (targetTimer.current) clearTimeout(targetTimer.current)
        // 서브픽셀 때문에 목표에 정확히 닿지 않을 수 있다. 그때도 휠이 굳지 않게 풀어 준다
        targetTimer.current = setTimeout(() => {
            target.current = null
            targetTimer.current = null
        }, PROGRAMMATIC_MAX_MS)

        list.scrollTo({ top, behavior: smooth ? 'smooth' : 'instant' })
    }, [])

    useEffect(() => {
        // 내가 올린 값이 되돌아온 것이면 건드리지 않는다.
        // 정착 애니메이션 도중에 instant로 덮으면 화면이 튄다
        const mine = emitted.current !== null && emitted.current === value
        emitted.current = null
        if (mine) return

        const index = items.indexOf(value)
        if (index >= 0) scrollToIndex(index, false)
    }, [items, value, scrollToIndex])

    // 시트를 닫는 순간 타이머가 남아 있으면 사라진 휠에 대고 스크롤을 시킨다
    useEffect(() => {
        return () => {
            if (settling.current) clearTimeout(settling.current)
            if (targetTimer.current) clearTimeout(targetTimer.current)
        }
    }, [])

    /**
     * 키보드로 값을 옮긴다. 정착 경로와 같이 emitted를 세워 두므로
     * 부모가 값을 돌려줘도 effect가 스크롤을 다시 건드리지 않는다.
     */
    const move = (delta: number) => {
        const current = items.indexOf(value)
        if (current < 0) return

        const nextIndex = Math.max(0, Math.min(current + delta, items.length - 1))
        if (nextIndex === current) return

        const picked = items[nextIndex]
        emitted.current = picked
        onChange(picked)
        scrollToIndex(nextIndex, true)
    }

    /** 휠은 스크롤로만 고를 수 있어서 키보드 사용자는 시간을 못 정한다. 방향키로 같은 일을 하게 한다 */
    const handleKeyDown = (event: React.KeyboardEvent) => {
        const step: Record<string, number> = {
            ArrowUp: -1,
            ArrowDown: 1,
            PageUp: -VISIBLE_COUNT,
            PageDown: VISIBLE_COUNT,
            Home: -items.length,
            End: items.length,
        }
        const delta = step[event.key]
        if (delta === undefined) return

        // 방향키가 시트 뒤 페이지를 굴리지 않게 막는다
        event.preventDefault()
        move(delta)
    }

    const handleScroll = useCallback(() => {
        const list = listRef.current
        if (!list) return

        if (target.current !== null) {
            // 목표에 닿았으면 이제부터는 사용자 스크롤이다
            if (Math.abs(list.scrollTop - target.current) <= 1) releaseTarget()
            return
        }

        if (settling.current) clearTimeout(settling.current)
        settling.current = setTimeout(() => {
            const settled = listRef.current
            if (!settled) return
            const rawIndex = Math.round(settled.scrollTop / ITEM_HEIGHT)
            const index = Math.max(0, Math.min(rawIndex, items.length - 1))
            const picked = items[index]
            if (picked !== value) {
                emitted.current = picked
                onChange(picked)
            } else {
                emitted.current = null
            }
            scrollToIndex(index, true)
        }, SETTLE_MS)
    }, [items, value, onChange, scrollToIndex])

    return (
        <div className="relative" style={{ width: 72 }}>
            <div className="relative overflow-hidden" style={{ height: WHEEL_HEIGHT }}>
                {/* 위아래 페이드 */}
                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-surface-app to-transparent" style={{ height: ITEM_HEIGHT * 1.5 }} />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-surface-app to-transparent" style={{ height: ITEM_HEIGHT * 1.5 }} />

                <div
                    ref={listRef}
                    onScroll={handleScroll}
                    // 사용자가 손을 대면 우리가 만들던 스크롤은 포기한다. 그래야 억제가 입력을 삼키지 않는다
                    onPointerDown={releaseTarget}
                    onWheel={releaseTarget}
                    onTouchStart={releaseTarget}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                    className="no-scrollbar h-full snap-y snap-mandatory overflow-y-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action-primary"
                    role="listbox"
                    aria-label={label}
                    aria-activedescendant={optionId(value)}
                >
                    {Array.from({ length: padding }).map((_, i) => (
                        <div key={`top-${i}`} style={{ height: ITEM_HEIGHT }} aria-hidden />
                    ))}

                    {items.map((item) => {
                        const selected = item === value
                        return (
                            <div
                                key={item}
                                id={optionId(item)}
                                role="option"
                                aria-selected={selected}
                                className={`flex snap-center items-center justify-center font-display transition-all duration-150 ${
                                    selected
                                        ? 'scale-100 text-[28px] font-bold text-content-primary'
                                        : 'scale-90 text-xl text-content-muted/40'
                                }`}
                                style={{ height: ITEM_HEIGHT }}
                            >
                                {format(item)}
                            </div>
                        )
                    })}

                    {Array.from({ length: padding }).map((_, i) => (
                        <div key={`bottom-${i}`} style={{ height: ITEM_HEIGHT }} aria-hidden />
                    ))}
                </div>
            </div>
        </div>
    )
}
