import React, { useEffect, useState } from 'react'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { BottomSheet } from '@/shared/ui/molecules/BottomSheet'
import { Calendar } from '@/shared/ui/molecules/Calendar'
import { YearMonthWheel } from './YearMonthWheel'
import { formatDate, parseDate } from './logitTypes'
import { useLogitCalendar } from './useLogitCalendar'
import type { MadeDexId } from './types'

interface Props {
    madeDexId: MadeDexId
    date: string
    /** 서버가 준 기준일. 이 뒤로는 고르지 못한다 */
    today: string
    onSelect: (date: string) => void
    onClose: () => void
}

function firstOfMonth(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), 1)
}

function shiftMonth(value: Date, delta: number): Date {
    return new Date(value.getFullYear(), value.getMonth() + delta, 1)
}

/**
 * 한 달치만 보여 주고, 먼 날짜는 `연도. 월`을 눌러 옮긴다
 * 달력 자체는 제스처로 넘기지 않는다 — 년·월을 고르거나 좌우 버튼을 눌러야 옮겨진다
 * 기록이 있는 날에는 점을 찍는다
 */
export function LogitCalendar({ madeDexId, date, today, onSelect, onClose }: Props) {
    const todayDate = parseDate(today)
    const maxMonth = firstOfMonth(todayDate)

    const [month, setMonth] = useState(firstOfMonth(parseDate(date)))
    const [pickingMonth, setPickingMonth] = useState(false)

    const { daysOf, load } = useLogitCalendar(madeDexId)

    // 열릴 때와 달을 옮길 때 그 달 마커를 받는다. 이미 받은 달은 훅이 걸러 낸다
    useEffect(() => {
        load(month)
    }, [month, load])

    const atMaxMonth = month >= maxMonth

    // 선택된 날과 겹치면 점이 묻힌다. 겹치는 날만 따로 모아 색을 달리한다
    const selected = parseDate(date)
    const sameMonthAsSelected =
        selected.getFullYear() === month.getFullYear() && selected.getMonth() === month.getMonth()
    const marked = daysOf(month)
    const toDate = (day: number) => new Date(month.getFullYear(), month.getMonth(), day)
    const markedPlain = marked.filter((day) => !(sameMonthAsSelected && day === selected.getDate())).map(toDate)
    const markedOnSelected = marked.filter((day) => sameMonthAsSelected && day === selected.getDate()).map(toDate)

    // 점은 셀이 아니라 날짜 원 안에 들어와야 한다. 셀 패딩이 4px이라 그보다 위에서 시작한다
    const dot =
        'relative after:absolute after:bottom-1.5 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full'

    return (
        // 손잡이에서만 끌어 닫는다. 휠을 굴릴 때 시트가 함께 끌려 내려가지 않으면서 두 화면 모두 끌어 닫힌다
        <BottomSheet title="날짜 선택" showTitle={false} onClose={onClose} draggable dragHandleOnly>
            <div className="px-5 pb-8 pt-2">
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => setPickingMonth((open) => !open)}
                        aria-expanded={pickingMonth}
                        className="flex min-h-touch items-center gap-1 font-display text-xl text-content-primary"
                    >
                        {month.getFullYear()}. {String(month.getMonth() + 1).padStart(2, '0')}
                        <ChevronDownIcon
                            size={18}
                            aria-hidden
                            className={`text-content-muted transition-transform ${pickingMonth ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {/* 달을 고르는 중에는 날짜 이동 조작이 할 일이 없다 */}
                    {!pickingMonth && (
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => onSelect(today)}
                                className="min-h-touch rounded-full bg-cream-200 px-3 text-xs font-bold text-content-secondary"
                            >
                                오늘
                            </button>
                            <button
                                type="button"
                                onClick={() => setMonth(shiftMonth(month, -1))}
                                aria-label="이전 달"
                                className="min-h-touch px-1 text-content-secondary"
                            >
                                <ChevronLeftIcon size={20} aria-hidden />
                            </button>
                            <button
                                type="button"
                                onClick={() => setMonth(shiftMonth(month, 1))}
                                disabled={atMaxMonth}
                                aria-label="다음 달"
                                className="min-h-touch px-1 text-content-secondary disabled:text-action-disabled-text"
                            >
                                <ChevronRightIcon size={20} aria-hidden />
                            </button>
                        </div>
                    )}
                </div>

                {/* 두 화면의 높이가 달라 시트가 튀지 않도록 바닥 높이를 맞춘다 */}
                <div className="min-h-72">
                    {pickingMonth ? (
                        <YearMonthWheel
                            month={month}
                            maxMonth={maxMonth}
                            onDone={(picked) => {
                                setMonth(picked)
                                setPickingMonth(false)
                            }}
                        />
                    ) : (
                        <Calendar
                            mode="single"
                            selected={selected}
                            month={month}
                            onMonthChange={setMonth}
                            endMonth={todayDate}
                            disabled={{ after: todayDate }}
                            hideNavigation
                            // 연도와 달은 위쪽 버튼이 맡는다
                            classNames={{ month_caption: 'hidden' }}
                            className="pt-2"
                            modifiers={{ marked: markedPlain, markedOnSelected }}
                            modifiersClassNames={{
                                marked: `${dot} after:bg-action-primary`,
                                markedOnSelected: `${dot} after:bg-content-on-action`,
                            }}
                            onSelect={(picked) => {
                                if (picked) onSelect(formatDate(picked))
                            }}
                        />
                    )}
                </div>
            </div>
        </BottomSheet>
    )
}
