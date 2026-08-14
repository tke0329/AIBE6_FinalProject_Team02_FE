'use client'

import { UserProfile } from '@/features/my/UserProfile'
import { goBackOr, pushInApp } from '@/shared/lib/backNav'
import { getTabHref, ROUTES } from '@/shared/lib/routes'
import { useParams, useRouter } from 'next/navigation'

export default function UserProfilePage() {
    const router = useRouter()
    const params = useParams()
    const raw = String(params.id)
    const userId = raw === 'me' ? 'me' : Number(raw)
    return (
        <UserProfile
            userId={userId}
            // 맨 `back()`이면 공유 링크로 이 화면이 첫 항목일 때 **앱을 벗어난다**.
            // 리뷰·친구 목록 어디서 왔든 왔던 자리로 돌아가고, 올 자리가 없을 때만 친구 목록으로
            onBack={() => goBackOr(router, ROUTES.friends)}
            onTab={(tab) => router.push(getTabHref(tab))}
            onOpenUser={(id) => pushInApp(router, ROUTES.userProfile(id))}
        />
    )
}
