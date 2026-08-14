'use client'

import { DexCategoryList } from '@/features/dex/DexCategoryList'
import { DexGrid } from '@/features/dex/DexGrid'
import type { CategoryFilter } from '@/features/dex/useDexFilter'
import { CATEGORY_META, DexEntry } from '@/shared/data/dex'
import { isOverlayEntry, markInAppNav, OVERLAY_PARAM, pushInApp } from '@/shared/lib/backNav'
import { getTabHref, rememberBasicDexRoute, ROUTES } from '@/shared/lib/routes'
import { useAppState, useDexState } from '@/shared/store/AppStateProvider'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

function isCategoryFilter(value: string | null): value is CategoryFilter {
    return value === '전체' || CATEGORY_META.some((meta) => meta.category === value)
}

/**
 * 시트 파라미터를 뺀 격자 주소. **돌아올 곳으로 쓰는 값은 전부 이것이다.**
 *
 * `?food=`가 섞여 들어가면 등록을 마치고 돌아왔을 때·하단 탭으로 다시 들어왔을 때
 * 이미 채운 칸의 미해금 시트가 되살아난다
 */
function gridHrefOf(pathname: string, params: URLSearchParams) {
    const sp = new URLSearchParams(Array.from(params.entries()))
    sp.delete('food')
    sp.delete(OVERLAY_PARAM)
    const query = sp.toString()
    return query ? `${pathname}?${query}` : pathname
}

function BasicDexContent() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { entries, entriesLoading, collectedIds } = useDexState()
    const { startRegistration, setSelectedFoodId } = useAppState()
    const category = searchParams.get('category')
    // `?category`가 없으면 카테고리 목록, 있으면 그 카테고리의 그리드.
    // 목록에서 그리드로 갈 때 항상 파라미터를 붙이므로(`onOpenCategory`) 이 구분이 흔들리지 않는다
    const showGrid = category !== null
    const initialCategory = isCategoryFilter(category) ? category : '전체'

    const gridHref = () => gridHrefOf(pathname, searchParams)

    useEffect(() => {
        rememberBasicDexRoute(gridHrefOf(pathname, searchParams))
    }, [pathname, searchParams])

    /** 지금 보고 있는 주소를 그대로 들고 간다 — 카테고리·검색 상태까지 그 자리로 돌아온다 */
    const openRegister = () => {
        startRegistration('basic')
        pushInApp(router, ROUTES.registerFrom(gridHref()))
    }

    /**
     * 미해금 시트는 **열 때 push, 닫을 때 back**이다 (챌린짓 음식 시트와 같은 규칙).
     *
     * push로 열어야 뒤로가기 제스처로 닫힌다. 그런데 닫을 때 `replace`를 하면 항목이
     * 그대로 남아, 칸을 몇 개 눌러 봤는지만큼 뒤로가기를 더 눌러야 격자를 벗어난다.
     * 내가 넣은 항목인지는 `ov=1`이 답한다 (backNav.ts 주석)
     */
    const openLocked = (id: number) => {
        const sp = new URLSearchParams(Array.from(searchParams.entries()))
        sp.set('food', String(id))
        sp.set(OVERLAY_PARAM, '1')
        // 시트도 앱 안에서 넣은 항목이다. 표시가 없으면 여기서 연 등록 화면의 ←가
        // `back` 대신 `push`로 떨어져 히스토리가 늘어난다
        markInAppNav()
        router.push(`${pathname}?${sp.toString()}`, { scroll: false })
    }
    const closeLocked = () => {
        if (isOverlayEntry(searchParams)) router.back()
        else router.replace(gridHref(), { scroll: false })
    }

    /**
     * 시트의 등록하기. **시트 항목을 갈아 끼운다.**
     *
     * `push`로 쌓으면 등록을 마치고 뒤로 나올 때 방금 채운 칸의 "미해금" 시트 항목을
     * 밟는다 — 칸이 이미 열려 있어 시트는 안 뜨고, 아무 일도 없는 뒤로가기 한 번만 남는다.
     * 시트 항목은 내가 넣은 것이므로(`ov=1`) 그 자리에 등록 화면을 얹으면
     * 히스토리가 **격자 → 등록**으로 곧게 남는다
     */
    const registerFood = (entry: DexEntry) => {
        startRegistration('basic')
        setSelectedFoodId(entry.id)
        const href = ROUTES.registerWithFood(entry.id, gridHref())
        if (isOverlayEntry(searchParams)) router.replace(href)
        else pushInApp(router, href)
    }

    /**
     * 어떤 칸의 시트를 열었는지. **해금 여부는 서버가 준 목록만 믿는다** —
     * 등록을 마치고 돌아와 칸이 열렸으면 미해금 시트는 저절로 안 뜬다
     */
    const foodParam = searchParams.get('food')
    const foodId = foodParam ? Number(foodParam) : null
    const lockedEntry =
        foodId !== null && !collectedIds.includes(foodId)
            ? (entries.find((entry) => entry.id === foodId) ?? null)
            : null

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
            onOpenEntry={(id, selectedCategory) => pushInApp(router, ROUTES.dexDetail(id, selectedCategory))}
            lockedEntry={lockedEntry}
            onOpenLocked={(id) => openLocked(id)}
            onCloseLocked={closeLocked}
            onRegisterFood={registerFood}
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
