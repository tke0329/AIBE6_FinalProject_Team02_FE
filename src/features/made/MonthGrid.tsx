import React, { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

interface Props {
    /** 지금 보고 있는 달 */
    month: Date
    /** 이 달보다 뒤로는 가지 않는다 */
    maxMonth: Date
    onPick: (month: Date) => void
}

const MONTHS = Array.from({ length: 12 }, (_, index) => index)

/** 달력과 같은 면에서 자리만 바꿔 뜬다. 시트를 겹쳐 쌓지 않는다 */
export function MonthGrid({ month, maxMonth, onPick }: Props) {
    const [year, setYear] = useState(month.getFullYear())

    const maxYear = maxMonth.getFullYear()

    return (
        <div>
            <div className="flex items-center justify-between pt-2">
                <button
                    type="button"
                    onClick={() => setYear(year - 1)}
                    aria-label="이전 해"
                    className="min-h-touch px-2 text-content-secondary"
                >
                    <ChevronLeftIcon size={20} aria-hidden />
                </button>
                <p aria-live="polite" className="font-display text-lg text-content-primary">
                    {year}년
                </p>
                <button
                    type="button"
                    onClick={() => setYear(year + 1)}
                    disabled={year >= maxYear}
                    aria-label="다음 해"
                    className="min-h-touch px-2 text-content-secondary disabled:text-action-disabled-text"
                >
                    <ChevronRightIcon size={20} aria-hidden />
                </button>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-2">
                {MONTHS.map((index) => {
                    // 아직 오지 않은 달은 기록도 없다
                    const future = year > maxYear || (year === maxYear && index > maxMonth.getMonth())
                    const selected = year === month.getFullYear() && index === month.getMonth()
                    return (
                        <button
                            key={index}
                            type="button"
                            onClick={() => onPick(new Date(year, index, 1))}
                            disabled={future}
                            aria-pressed={selected}
                            className={`min-h-touch rounded-2xl text-sm font-bold transition-colors ${
                                selected
                                    ? 'bg-action-primary text-content-on-action shadow-card'
                                    : 'bg-cream-100 text-content-primary disabled:bg-transparent disabled:text-action-disabled-text'
                            }`}
                        >
                            {index + 1}월
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
