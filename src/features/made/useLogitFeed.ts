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

    // 복귀 이벤트 핸들러가 date를 의존성으로 잡으면 리스너를 매번 다시 단다
    const dateRef = useRef('')
    dateRef.current = date

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
                // 서버가 조회한 날과 기준일을 따로 준다. 과거를 봐도 오늘이 오염되지 않는다
                setToday(next.today)
            } catch (failure) {
                if (mine !== seq.current) return
                setError(madeErrorMessage(failure, '식탁을 불러오지 못했어요.'))
            } finally {
                if (mine === seq.current) setLoading(false)
            }
        },
        [madeDexId],
    )

    // 첫 조회만 날짜를 비운다. 그래야 서버가 오늘을 골라 준다
    useEffect(() => {
        void load('')
    }, [load])

    /**
     * 자정을 넘겨 돌아오면 화면이 어제를 "오늘"이라 우긴다.
     * 폰에서 앱을 뒤로 보냈다 돌아오는 게 그 전형적인 경로라, 복귀 시점에 다시 읽는다.
     * 보고 있던 날짜 그대로 부르면 응답의 today가 갱신되면서 화면이 스스로 바로잡힌다.
     */
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState !== 'visible') return
            // 과거를 들여다보는 중이라면 그 날짜를 유지한다. 기준일만 새로 받으면 된다
            void load(dateRef.current)
        }
        document.addEventListener('visibilitychange', onVisible)
        return () => document.removeEventListener('visibilitychange', onVisible)
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
