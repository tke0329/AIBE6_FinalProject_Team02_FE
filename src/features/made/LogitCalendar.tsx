import React, { useEffect, useRef } from 'react'
import { XIcon } from 'lucide-react'
import { Calendar } from '@/shared/ui/molecules/Calendar'
import { formatDate, parseDate } from './logitTypes'

interface Props {
    date: string
    /** 서버가 준 기준일. 이 뒤로는 고르지 못한다 */
    today: string
    onSelect: (date: string) => void
    onClose: () => void
}

/** 거슬러 올라갈 개월 수. 개설일을 모르니 일단 1년치를 편다 */
const MONTHS = 12

export function LogitCalendar({ date, today, onSelect, onClose }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const todayDate = parseDate(today)
    const startMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() - (MONTHS - 1), 1)

    // 이번 달이 맨 아래에 있다. 열자마자 오늘이 보여야 한다
    useEffect(() => {
        const scroll = scrollRef.current
        if (scroll) scroll.scrollTop = scroll.scrollHeight
    }, [])

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [onClose])

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="날짜 선택"
            className="absolute inset-0 z-40 flex flex-col bg-surface-app"
        >
            <header className="flex shrink-0 items-center gap-2 px-4 pt-4">
                <h2 className="flex-1 font-display text-xl text-content-primary">날짜 선택</h2>
                <button type="button" onClick={onClose} aria-label="닫기" className="min-h-touch shrink-0 px-2">
                    <XIcon size={22} aria-hidden className="text-content-primary" />
                </button>
            </header>

            <div ref={scrollRef} className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
                <Calendar
                    mode="single"
                    selected={parseDate(date)}
                    month={startMonth}
                    numberOfMonths={MONTHS}
                    startMonth={startMonth}
                    endMonth={todayDate}
                    disabled={{ after: todayDate }}
                    hideNavigation
                    onSelect={(picked) => {
                        if (picked) onSelect(formatDate(picked))
                    }}
                />
            </div>
        </div>
    )
}
