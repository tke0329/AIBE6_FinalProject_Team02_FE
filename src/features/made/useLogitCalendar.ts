import { useCallback, useRef, useState } from 'react'
import { fetchDayCardCalendar } from './logitApi'
import type { MadeDexId } from './types'

/**
 * 캐시 키에 로그잇을 함께 넣는다
 * 연·월만 쓰면 다른 로그잇으로 옮겼을 때 이전 로그잇의 마커가 그대로 보인다
 */
function monthKey(madeDexId: MadeDexId, year: number, month: number): string {
    return `${madeDexId}:${year}-${String(month).padStart(2, '0')}`
}

/**
 * 달력 마커. 월 단위로 받아 캐시
 */
export function useLogitCalendar(madeDexId: MadeDexId) {
    const [daysByMonth, setDaysByMonth] = useState<Record<string, number[]>>({})
    // 한 번 부른 달은 다시 부르지 않음
    // 실패한 달도 넣어 두어 재요청이 반복되지 않게 함
    const asked = useRef(new Set<string>())

    const load = useCallback(
        (month: Date) => {
            const year = month.getFullYear()
            const monthNumber = month.getMonth() + 1
            const key = monthKey(madeDexId, year, monthNumber)
            if (asked.current.has(key)) return
            asked.current.add(key)

            fetchDayCardCalendar(madeDexId, year, monthNumber)
                .then((calendar) => {
                    // 늦게 온 응답이 다른 달을 덮지 않도록 응답이 말하는 달에 넣음
                    setDaysByMonth((current) => ({
                        ...current,
                        [monthKey(madeDexId, calendar.year, calendar.month)]: calendar.daysWithRecords,
                    }))
                })
                .catch(() => {
                    // 마커는 부가 정보
                    return
                })
        },
        [madeDexId],
    )

    const daysOf = useCallback(
        (month: Date): number[] => daysByMonth[monthKey(madeDexId, month.getFullYear(), month.getMonth() + 1)] ?? [],
        [daysByMonth, madeDexId],
    )

    return { daysOf, load }
}
