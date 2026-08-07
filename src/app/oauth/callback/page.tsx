'use client'

import { useAuth } from '@/features/auth/AuthContext'
import { ROUTES } from '@/shared/lib/routes'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

/**
 * `/oauth/callback` — 소셜 로그인 성공 후 BE가 리다이렉트하는 도착지.
 * 이 시점엔 이미 httpOnly 쿠키에 토큰이 세팅돼 있으므로,
 * 프론트는 별도 토큰 처리 없이 홈으로 보내기만 하면 된다.
 * (로그인 실패 시 BE가 ?error=... 를 붙여 보내므로 그 경우 로그인 화면으로 되돌린다.)
 */
function OAuthCallbackContent() {
    const router = useRouter()
    const params = useSearchParams()
    const { refresh } = useAuth()

    useEffect(() => {
        const error = params.get('error')
        if (error) {
            // 실패: 로그인 화면으로 (쿼리로 사유 전달)
            router.replace(`${ROUTES.login}?error=${encodeURIComponent(error)}`)
            return
        }
        // 로그인 성공 → me를 불러와 상태를 채운 뒤 홈으로
        refresh().finally(() => router.replace(ROUTES.home))
    }, [params, router, refresh])

    // 리다이렉트 직전 잠깐 보이는 로딩 화면
    return (
        <main className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-500">로그인 처리 중…</p>
        </main>
    )
}

export default function OAuthCallbackPage() {
    return (
        <Suspense
            fallback={
                <main className="flex h-full items-center justify-center">
                    <p className="text-sm text-gray-500">로그인 처리 중…</p>
                </main>
            }
        >
            <OAuthCallbackContent />
        </Suspense>
    )
}
