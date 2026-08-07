import React, { useState } from 'react'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { BottomSheet } from '@/shared/ui/molecules/BottomSheet'
import { Calendar } from '@/shared/ui/molecules/Calendar'
import { MonthGrid } from './MonthGrid'
import { formatDate, parseDate } from './logitTypes'

interface Props {
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
 * 한 달치만 보여 주고, 먼 날짜는 `연도. 월`을 눌러 옮긴다.
 * 월 선택은 시트를 새로 띄우지 않고 같은 자리에서 내용만 바뀐다.
 */
export function LogitCalendar({ date, today, onSelect, onClose }: Props) {
    const todayDate = parseDate(today)
    const maxMonth = firstOfMonth(todayDate)

    const [month, setMonth] = useState(firstOfMonth(parseDate(date)))
    const [pickingMonth, setPickingMonth] = useState(false)

    const atMaxMonth = month >= maxMonth

    return (
        <BottomSheet title="날짜 선택" showTitle={false} onClose={onClose} draggable>
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
                        <MonthGrid
                            month={month}
                            maxMonth={maxMonth}
                            onPick={(picked) => {
                                setMonth(picked)
                                setPickingMonth(false)
                            }}
                        />
                    ) : (
                        <Calendar
                            mode="single"
                            selected={parseDate(date)}
                            month={month}
                            onMonthChange={setMonth}
                            endMonth={todayDate}
                            disabled={{ after: todayDate }}
                            hideNavigation
                            // 연도와 달은 위쪽 버튼이 맡는다
                            classNames={{ month_caption: 'hidden' }}
                            className="pt-2"
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
