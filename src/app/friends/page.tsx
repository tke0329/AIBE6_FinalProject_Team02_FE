'use client'

import { FriendsPanel } from '@/features/friend/FriendsPanel'
import { ROUTES } from '@/shared/lib/routes'
import { useRouter, useSearchParams } from 'next/navigation'

export default function FriendsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialTab = searchParams.get('tab') === 'received' ? '받은 요청' : undefined

    return (
        <FriendsPanel
            onBack={() => router.push(ROUTES.my)}
            onOpenUser={(userId) => router.push(ROUTES.userProfile(userId))}
            initialTab={initialTab}
        />
    )
}
