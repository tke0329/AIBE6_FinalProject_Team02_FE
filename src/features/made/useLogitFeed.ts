import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchFeed } from './logitApi'
import { madeErrorMessage } from './errors'
import type { LogitFeed } from './logitTypes'
import type { MadeDexId } from './types'

/**
 * 하루치 식탁. 기준일("오늘")은 서버가 정한다 —
 * 브라우저 시간대가 Asia/Seoul이 아니면 클라이언트가 센 오늘은 하루씩 어긋난다.
 */
export function useLogitFeed(madeDexId: MadeDexId) {
    const [feed, setFeed] = useState<LogitFeed | null>(null)
    const [date, setDate] = useState('')
    const [today, setToday] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // 날짜를 빠르게 넘기면 먼저 쏜 응답이 늦게 도착해 화면을 되돌린다
    const seq = useRef(0)

    const load = useCallback(
        async (target: string) => {
            const mine = ++seq.current
            setLoading(true)
            setError(null)
            try {
                const next = await fetchFeed(madeDexId, target || undefined)
                if (mine !== seq.current) return
                setFeed(next)
                setDate(next.date)
                setToday((current) => current || next.date)
            } catch (failure) {
                if (mine !== seq.current) return
                setError(madeErrorMessage(failure, '식탁을 불러오지 못했어요.'))
            } finally {
                if (mine === seq.current) setLoading(false)
            }
        },
        [madeDexId],
    )

    // 첫 조회만 날짜를 비운다. 그래야 서버가 기준일을 알려 준다
    useEffect(() => {
        void load('')
    }, [load])

    return {
        feed,
        date,
        today,
        loading,
        error,
        select: (next: string) => void load(next),
        reload: () => void load(date),
    }
}
