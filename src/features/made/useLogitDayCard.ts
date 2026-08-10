import { useEffect, useRef, useState } from 'react'
import { madeErrorMessage } from './errors'
import { fetchDayCard } from './logitApi'
import type { LogitDayCard } from './logitTypes'
import type { MadeDexId } from './types'

/**
 * 특정 날짜의 하루 카드
 */
export function useLogitDayCard(madeDexId: MadeDexId, date: string) {
    const [dayCard, setDayCard] = useState<LogitDayCard | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [nonce, setNonce] = useState(0)

    // 날짜를 빠르게 넘기면 먼저 쏜 응답이 늦게 도착해 화면을 되돌린다
    const seq = useRef(0)

    // 다른 날짜(도감)로 옮기면 이전 카드를 지운다
    useEffect(() => {
        setDayCard(null)
    }, [madeDexId, date])

    useEffect(() => {
        if (!date) {
            setLoading(false)
            return
        }
        const mine = ++seq.current
        setLoading(true)
        setError(null)
        fetchDayCard(madeDexId, date)
            .then((next) => {
                if (mine !== seq.current) return
                setDayCard(next)
            })
            .catch((failure) => {
                if (mine !== seq.current) return
                setError(madeErrorMessage(failure, '냉장고를 불러오지 못했어요.'))
            })
            .finally(() => {
                if (mine === seq.current) setLoading(false)
            })
    }, [madeDexId, date, nonce])

    return {
        dayCard,
        loading,
        error,
        reload: () => setNonce((n) => n + 1),
    }
}
