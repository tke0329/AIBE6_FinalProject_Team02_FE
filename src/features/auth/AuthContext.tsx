'use client'

import { apiFetch } from '@/shared/lib/api'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

/** /api/v1/auth/me 응답 (BE UserResponseDTO와 일치) */
export interface Me {
    id: number
    nickname: string | null
    email: string | null
    role: 'USER' | 'ADMIN'
    /**
     * 이미 본 도메인 온보딩 키. me에 실려 오는 이유는 **추가 요청을 없애기 위해서다** —
     * 따로 받으면 그 응답 전에 화면이 먼저 그려져 이미 본 투어가 잠깐 떴다 사라진다.
     * 구버전 BE 응답에는 없을 수 있어 optional
     */
    seenGuides?: string[]
}

interface AuthContextValue {
    me: Me | null // 로그인 유저 정보 (없으면 비로그인)
    loading: boolean // 최초 인증 확인 중 여부
    isAuthenticated: boolean
    refresh: () => Promise<void> // me 다시 불러오기 (로그인 직후 등)
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [me, setMe] = useState<Me | null>(null)
    const [loading, setLoading] = useState(true)

    // 서버에 "나 누구야?"를 물어 로그인 여부를 판단한다.
    const loadMe = useCallback(async () => {
        try {
            const data = await apiFetch<Me>('/api/v1/auth/me')
            setMe(data)
        } catch {
            // 401(UnauthorizedError) 등 → 비로그인으로 처리
            setMe(null)
        } finally {
            setLoading(false)
        }
    }, [])

    // 앱 최초 로드 시 한 번 확인
    useEffect(() => {
        loadMe()
    }, [loadMe])

    const logout = useCallback(async () => {
        try {
            await fetch(`${API_BASE}/api/v1/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            })
        } finally {
            setMe(null) // 서버 응답과 무관하게 로컬 상태는 비운다
        }
    }, [])

    const value: AuthContextValue = {
        me,
        loading,
        isAuthenticated: me !== null,
        refresh: loadMe,
        logout,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Provider 밖에서 쓰면 명확한 에러 (AGENTS.md FE 규칙) */
export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
    return ctx
}
