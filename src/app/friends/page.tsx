'use client'

import { FriendsPanel } from '@/features/friend/FriendsPanel'
import { ROUTES } from '@/shared/lib/routes'
import { useRouter } from 'next/navigation'

export default function FriendsPage() {
    const router = useRouter()
    return (
        <FriendsPanel
            onBack={() => router.push(ROUTES.my)}
            onOpenUser={(userId) => router.push(ROUTES.userProfile(userId))}
        />
    )
}
