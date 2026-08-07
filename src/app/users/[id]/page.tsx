'use client'

import { UserProfile } from '@/features/my/UserProfile'
import { getTabHref } from '@/shared/lib/routes'
import { useParams, useRouter } from 'next/navigation'

export default function UserProfilePage() {
    const router = useRouter()
    const params = useParams()
    const raw = String(params.id)
    const userId = raw === 'me' ? 'me' : Number(raw)
    return (
        <UserProfile
            userId={userId}
            onBack={() => router.back()}
            onTab={(tab) => router.push(getTabHref(tab))}
            onOpenUser={(id) => router.push(`/users/${id}`)}
        />
    )
}
