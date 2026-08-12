'use client'

import { ROUTES } from '@/shared/lib/routes'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * `/` 앱 진입점. 지금은 **로그잇으로 보낸다.**
 *
 * 예전에는 여기가 베이짓 카테고리 목록이었다. 로그잇이 1순위 화면이라
 * 목록은 `/basicDex`로 옮기고 이 자리는 "들어오면 어디로 가는가"만 정한다.
 *
 * 진입 경로가 로그인·온보딩·OAuth·북마크로 넷이라 각각 고치면 또 갈린다.
 * **이 파일 한 곳만 보면 되도록** 나머지는 전부 `ROUTES.home`을 향한 채로 둔다.
 * 나중에 홈 화면이 생기면 리다이렉트를 지우고 여기에 그리면 된다.
 */
export default function EntryPage() {
    const router = useRouter()

    useEffect(() => {
        router.replace(ROUTES.made)
    }, [router])

    return (
        <div className="flex h-full items-center justify-center bg-surface-app">
            <p className="text-sm text-neutral-800">불러오는 중…</p>
        </div>
    )
}
