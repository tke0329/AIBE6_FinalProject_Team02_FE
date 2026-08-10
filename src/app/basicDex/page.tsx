'use client'

import { DexGrid } from '@/features/dex/DexGrid'
import type { CategoryFilter } from '@/features/dex/useDexFilter'
import { CATEGORY_META } from '@/shared/data/dex'
import { getTabHref, rememberBasicDexRoute, ROUTES } from '@/shared/lib/routes'
import { useAppState, useDexState } from '@/shared/store/AppStateProvider'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

function isCategoryFilter(value: string | null): value is CategoryFilter {
    return value === '전체' || CATEGORY_META.some((meta) => meta.category === value)
}

function BasicDexContent() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { entries, entriesLoading, collectedIds, newlyUnlockedId } = useDexState()
    const { startRegistration } = useAppState()
    const category = searchParams.get('category')
    const initialCategory = isCategoryFilter(category) ? category : '전체'

    useEffect(() => {
        const query = searchParams.toString()
        rememberBasicDexRoute(query ? `${pathname}?${query}` : pathname)
    }, [pathname, searchParams])

    if (entriesLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-cream-100">
                <p className="text-sm text-brown-soft">불러오는 중…</p>
            </div>
        )
    }

    return (
        <DexGrid
            entries={entries}
            collectedIds={collectedIds}
            newlyUnlockedId={newlyUnlockedId}
            initialCategory={initialCategory}
            onBackToList={() => router.push(ROUTES.home)}
            onCategoryChange={(selectedCategory) => {
                router.replace(ROUTES.basicDex(selectedCategory))
            }}
            onOpenEntry={(id, selectedCategory) => router.push(ROUTES.dexDetail(id, selectedCategory))}
            onRegister={() => {
                startRegistration('basic')
                router.push(ROUTES.register)
            }}
            onTab={(tab) => router.push(getTabHref(tab))}
        />
    )
}

/** `/basicDex` 기본 도감 그리드 */
export default function BasicDexPage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-full items-center justify-center bg-cream-100">
                    <p className="text-sm text-brown-soft">불러오는 중…</p>
                </div>
            }
        >
            <BasicDexContent />
        </Suspense>
    )
}
