'use client'

import { DexCategoryList } from '@/features/dex/DexCategoryList'
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
    const { entries, entriesLoading, collectedIds } = useDexState()
    const { startRegistration } = useAppState()
    const category = searchParams.get('category')
    // `?category`가 없으면 카테고리 목록, 있으면 그 카테고리의 그리드.
    // 목록에서 그리드로 갈 때 항상 파라미터를 붙이므로(`onOpenCategory`) 이 구분이 흔들리지 않는다
    const showGrid = category !== null
    const initialCategory = isCategoryFilter(category) ? category : '전체'

    useEffect(() => {
        const query = searchParams.toString()
        rememberBasicDexRoute(query ? `${pathname}?${query}` : pathname)
    }, [pathname, searchParams])

    const openRegister = () => {
        startRegistration('basic')
        router.push(ROUTES.register)
    }

    if (entriesLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-surface-app">
                <p className="text-sm text-neutral-800">불러오는 중…</p>
            </div>
        )
    }

    if (!showGrid) {
        return (
            <DexCategoryList
                entries={entries}
                collectedIds={collectedIds}
                onOpenCategory={(selectedCategory) => router.push(ROUTES.basicDex(selectedCategory))}
                onRegister={openRegister}
                onTab={(tab) => router.push(getTabHref(tab))}
            />
        )
    }

    return (
        <DexGrid
            entries={entries}
            collectedIds={collectedIds}
            initialCategory={initialCategory}
            onBackToList={() => router.push(ROUTES.basicDex())}
            onCategoryChange={(selectedCategory) => {
                router.replace(ROUTES.basicDex(selectedCategory))
            }}
            onOpenEntry={(id, selectedCategory) => router.push(ROUTES.dexDetail(id, selectedCategory))}
            onRegister={openRegister}
            onTab={(tab) => router.push(getTabHref(tab))}
        />
    )
}

/** `/basicDex` 베이짓 — 파라미터 없으면 카테고리 목록, `?category=`가 있으면 그리드 */
export default function BasicDexPage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-full items-center justify-center bg-surface-app">
                    <p className="text-sm text-neutral-800">불러오는 중…</p>
                </div>
            }
        >
            <BasicDexContent />
        </Suspense>
    )
}
