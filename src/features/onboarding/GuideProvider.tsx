'use client'

import { useAuth } from '@/features/auth/AuthContext'
import { apiFetch } from '@/shared/lib/api'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { GuideKey } from './guides'

/**
 * 예전에 봤음 여부를 여기에도 저장했다. **지금은 읽지 않고 지우기만 한다** — 아래 주석 참고.
 * 남아 있으면 그냥 죽은 키라 무해하지만, 쓰던 흔적을 남기지 않으려고 한 번 치운다
 */
const LEGACY_CACHE_KEY = 'catcheat:seen-guides'

interface GuideContextValue {
    /** 아직 안 본 가이드인가 — 그 화면에서 투어를 자동 재생할지 판단 */
    unseen: (key: GuideKey) => boolean
    /** 봤음으로 기록. 낙관적으로 즉시 반영하고 서버에는 뒤따라 보낸다 */
    markSeen: (key: GuideKey) => void
    /** 준비 여부. me를 아직 못 받았으면 투어를 띄우지 않는다 */
    ready: boolean
}

const GuideContext = createContext<GuideContextValue | null>(null)

/**
 * 도메인별 온보딩을 봤는지 들고 있는다.
 *
 * ## 서버가 유일한 기준이다
 *
 * `me` 응답(`AuthContext`)에 `seenGuides`가 실려 온다. 따로 받으면 라운드트립이 하나
 * 늘 뿐 아니라, 그 응답 전에 화면이 먼저 그려져 **이미 본 투어가 잠깐 떴다 사라진다.**
 *
 * ## localStorage에 저장하지 않는다 (2026-08-14 제거)
 *
 * 처음에는 "POST가 실패해도 매번 뜨지는 않게" 하는 보험으로 localStorage에도 적었다.
 * 그런데 판단을 **서버 값과 로컬 값의 합집합**으로 하다 보니 로컬이 서버를 이겨 버렸다.
 *
 *   - DB를 초기화해도 브라우저에는 남아서 **투어가 영영 안 떴다** (실제로 겪음)
 *   - 한 브라우저에서 다른 계정으로 로그인하면 **앞사람이 본 것을 물려받았다**
 *
 * 얻는 것에 비해 대가가 컸다. 아래 `local`은 **메모리에만** 있고, 이게 "닫으면 즉시
 * 사라지고 이번 세션에 다시 안 뜬다"를 이미 만들어 준다. POST가 실패하면 다음 접속에
 * 한 번 더 보게 되는데, 그 정도는 감수할 만하다
 */
export function GuideProvider({ children }: { children: React.ReactNode }) {
    const { me, loading } = useAuth()
    // 이번 세션에 닫은 것. **메모리에만 산다** — 새로고침하면 서버 값만 남는다
    const [local, setLocal] = useState<GuideKey[]>([])

    // 옛 캐시 정리. 읽지 않으므로 있어도 무해하지만 남겨 둘 이유도 없다
    useEffect(() => {
        try {
            window.localStorage.removeItem(LEGACY_CACHE_KEY)
        } catch {
            // 사파리 프라이빗 등에서 막힐 수 있다. 실패해도 아무 영향 없다
        }
    }, [])

    /**
     * 계정이 바뀌면 이번 세션 기록을 비운다.
     * 안 비우면 로그아웃 후 다른 계정으로 들어왔을 때 앞사람이 닫은 투어가 그대로 막는다
     */
    useEffect(() => {
        setLocal([])
    }, [me?.id])

    const seen = useMemo(() => new Set<string>([...(me?.seenGuides ?? []), ...local]), [me?.seenGuides, local])

    const markSeen = useCallback((key: GuideKey) => {
        // 1. 메모리를 먼저 올린다 — 투어가 즉시 닫히고 이번 세션에 다시 뜨지 않는다
        setLocal((prev) => (prev.includes(key) ? prev : [...prev, key]))
        // 2. 서버에는 뒤따라 보낸다. **재시도하지 않는다** — 실패하면 다음 접속에 한 번
        //    더 보게 될 뿐이고, 그게 요청을 물고 늘어지는 것보다 낫다
        apiFetch(`/api/v1/onboarding/guides/${key}`, { method: 'POST' }).catch(() => {})
    }, [])

    const value: GuideContextValue = {
        unseen: (key) => !seen.has(key),
        markSeen,
        // 비로그인은 투어 대상이 아니다(AuthGate가 로그인으로 보낸다)
        ready: !loading && me !== null,
    }

    return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>
}

export function useGuideStore(): GuideContextValue {
    const ctx = useContext(GuideContext)
    if (!ctx) throw new Error('useGuideStore must be used within <GuideProvider>')
    return ctx
}
