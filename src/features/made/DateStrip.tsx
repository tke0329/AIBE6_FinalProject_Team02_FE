import React from 'react'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { dateLabel, shiftDate } from './logitTypes'

interface Props {
    date: string
    /** 서버가 준 기준일. 이 뒤로는 이동하지 않는다 */
    today: string
    onChange: (date: string) => void
    onOpenCalendar: () => void
    className?: string
}

/** §2.1 로그잇 날짜 헤더. 홈·로그 탭이 공유하고, 탭을 바꿔도 날짜는 유지된다 */
export function DateStrip({ date, today, onChange, onOpenCalendar, className = '' }: Props) {
    const atToday = date >= today

    return (
        // 양쪽 1fr이 같아야 가운데 칸이 화면 정중앙에 온다. 달력은 오른쪽 칸 끝에 붙는다
        <div className={`grid grid-cols-[1fr_auto_1fr] items-center bg-surface-app ${className}`}>
            <span aria-hidden />

            <div className="flex items-center justify-center gap-2">
                <button
                    type="button"
                    onClick={() => onChange(shiftDate(date, -1))}
                    aria-label="하루 전"
                    className="min-h-touch px-2 text-content-secondary"
                >
                    <ChevronLeftIcon size={20} aria-hidden />
                </button>
                <p aria-live="polite" className="min-w-32 text-center font-display text-lg text-content-primary">
                    {dateLabel(date, today)}
                </p>
                <button
                    type="button"
                    onClick={() => onChange(shiftDate(date, 1))}
                    disabled={atToday}
                    aria-label="하루 뒤"
                    className="min-h-touch px-2 text-content-secondary disabled:text-action-disabled-text"
                >
                    <ChevronRightIcon size={20} aria-hidden />
                </button>
            </div>

            <button
                type="button"
                onClick={onOpenCalendar}
                aria-label="날짜 선택"
                className="flex min-h-touch min-w-touch items-center justify-self-end text-content-secondary"
            >
                <CalendarIcon size={20} aria-hidden />
            </button>
        </div>
    )
}
