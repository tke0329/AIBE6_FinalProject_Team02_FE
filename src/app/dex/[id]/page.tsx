'use client'

import { useEffect, useState } from 'react'
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation'
import { DexDetail } from '@/features/dex/DexDetail'
import type { CategoryFilter } from '@/features/dex/useDexFilter'
import { fetchMyBasicDexDetail } from '@/features/dex/api'
import { useDexState } from '@/shared/store/AppStateProvider'
import { getTabHref, ROUTES } from '@/shared/lib/routes'
import { useAppState } from '@/shared/store/AppStateProvider'
import { CATEGORY_META, DexEntry } from '@/shared/data/dex'

function isCategoryFilter(value: string | null): value is CategoryFilter {
    return value === '전체' || CATEGORY_META.some((meta) => meta.category === value)
}

/** `/dex/[id]` 도감 카드 상세 */
export default function DexDetailPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { id } = useParams<{ id: string }>()
    const { entries, findEntry, collectedEntries, markNewBadgeSeen } = useDexState()
    const { startRegistration, setSelectedFoodId } = useAppState()
    const [detailEntry, setDetailEntry] = useState<DexEntry | null>(null)
    const [detailLoading, setDetailLoading] = useState(true)
    const category = searchParams.get('category')
    const activeCategory = isCategoryFilter(category) ? category : '전체'

    const listEntry = findEntry(Number(id))

    // 목록 조회엔 등록 카드(사진/메모/위치) 내용이 없어 슬롯 단위로 따로 불러온다.
    useEffect(() => {
        let cancelled = false
        setDetailLoading(true)
        fetchMyBasicDexDetail(Number(id))
            .then((detail) => {
                if (!cancelled) setDetailEntry(detail)
            })
            .catch(() => {
                // 실패하면 목록에 있던 요약 정보로 폴백한다 (카드 내용 없이).
            })
            .finally(() => {
                if (!cancelled) setDetailLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [id])

    // 상세를 연 것이 "봤다"의 신호다. 붙어 있지도 않았으면 서버를 부르지 않는다.
    // 낙관적 갱신으로 recentlyUnlocked가 곧 false가 되므로 이 effect는 한 번만 실행된다.
    const badgeVisible = listEntry?.recentlyUnlocked === true
    useEffect(() => {
        if (badgeVisible) markNewBadgeSeen(Number(id))
    }, [badgeVisible, id, markNewBadgeSeen])

    if (!listEntry) notFound()

    if (detailLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-cream-100">
                <p className="text-sm text-brown-soft">불러오는 중…</p>
            </div>
        )
    }

    const entry = detailEntry ?? listEntry

    return (
        <DexDetail
            entry={entry}
            entries={entries}
            collectedEntries={collectedEntries}
            activeCategory={activeCategory}
            onBack={() => router.push(ROUTES.basicDex(activeCategory))}
            onRegister={() => {
                startRegistration('basic')
                setSelectedFoodId(entry.id)
                router.push(ROUTES.registerWithFood(entry.id, ROUTES.dexDetail(entry.id, activeCategory)))
            }}
            onOpenEntry={(nextId) => router.replace(ROUTES.dexDetail(nextId, activeCategory))}
            onTab={(tab) => router.push(getTabHref(tab))}
        />
    )
}
