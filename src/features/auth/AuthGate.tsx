'use client'

import { useAuth } from '@/features/auth/AuthContext'
import { ROUTES } from '@/shared/lib/routes'
import { useAppState } from '@/shared/store/AppStateProvider'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

// 인증이 필요 없는 공개 경로 (로그인 화면 · OAuth 도착지 · 공통 UI 갤러리)
// `/ui-check`는 로그인 없이 열려야 한다 — 공통 컴포넌트를 눈으로 대조하는 화면이라
// 로그인을 요구하면 확인 자체가 번거로워진다. 서비스 데이터를 읽지 않는다
const PUBLIC_PATHS: string[] = [ROUTES.login, ROUTES.oauthCallback, '/ui-check']

/**
 * 앱 전역 인증/온보딩 라우팅 가드
 * 퍼널 순서: 비로그인→/login, 닉네임 없음→/nickname-setup, 온보딩 미완료→/onboarding, 완료→요청 페이지
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const { isAuthenticated, loading, me } = useAuth()
    const { onboardingSeen } = useAppState()

    const isPublic = PUBLIC_PATHS.includes(pathname)
    // 판단에 필요한 두 상태가 모두 확정됐는지 (auth 확인 끝 + 온보딩 상태 수신)
    const ready = !loading && onboardingSeen !== null

    // 이 사용자가 있어야 할 경로. null이면 현재 경로 그대로 OK.
    let redirectTo: string | null = null
    if (ready && !isPublic) {
        if (!isAuthenticated) {
            redirectTo = ROUTES.login
        } else if (me?.nickname == null) {
            // 신규: 닉네임을 온보딩보다 먼저 정한다
            redirectTo = ROUTES.nicknameSetup
        } else if (pathname === ROUTES.nicknameSetup) {
            // 닉네임 세팅을 마쳤는데 아직 세팅 화면이면 다음 단계로 내보낸다
            redirectTo = onboardingSeen === false ? ROUTES.onboarding : ROUTES.home
        } else if (onboardingSeen === false) {
            redirectTo = ROUTES.onboarding
        }
        // 이미 목적지에 있으면 리다이렉트 불필요 (온보딩 다시보기 등 통과)
        if (redirectTo === pathname) redirectTo = null
    }

    useEffect(() => {
        if (redirectTo) router.replace(redirectTo)
    }, [redirectTo, router])

    // 공개 경로는 상태와 무관하게 즉시 렌더
    if (isPublic) return <>{children}</>

    // 상태 미확정이거나 리다이렉트 대기 중이면 로딩 표시 (플래시 방지)
    if (!ready || redirectTo) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-gray-500">불러오는 중…</p>
            </div>
        )
    }

    return <>{children}</>
}
