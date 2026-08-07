'use client'

import { equipBadge, getMyBadges, type MyBadge } from '@/features/my/api'
import { BadgeCollection } from '@/features/my/BadgeCollection'
import { ROUTES } from '@/shared/lib/routes'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

/** `/my/badges` 뱃지 보관함 — 획득 목록 조회 + 대표 뱃지 장착/해제 */
export default function BadgeCollectionPage() {
    const router = useRouter()
    const [badges, setBadges] = useState<MyBadge[] | null>(null)
    const [pending, setPending] = useState(false)

    useEffect(() => {
        getMyBadges()
            .then(setBadges)
            .catch(() => setBadges([]))
    }, [])

    const handleEquip = async (badgeId: number | null) => {
        setPending(true)
        try {
            await equipBadge(badgeId)
            router.push(ROUTES.my) // 마이페이지 재진입 시 새 대표 뱃지 반영
        } catch {
            setPending(false)
        }
    }

    if (!badges) {
        return (
            <div className="flex h-full items-center justify-center bg-cream-100">
                <p className="text-sm text-brown-soft">불러오는 중…</p>
            </div>
        )
    }

    return (
        <BadgeCollection
            badges={badges}
            pending={pending}
            onEquip={handleEquip}
            onBack={() => router.push(ROUTES.my)}
        />
    )
}
