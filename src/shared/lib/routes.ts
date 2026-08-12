import type { MadeDexId } from '@/features/made/types'
import type { NavTab } from '@/shared/ui'

/**
 * 앱의 모든 URL을 한곳에서 관리.
 * 라우트 경로를 문자열로 흩뿌리지 말고 항상 여기를 통해 만들 것.
 */
export const ROUTES = {
    /**
     * 앱 진입점. **어떤 화면인지는 `src/app/page.tsx`가 정한다** — 지금은 로그잇으로 보낸다.
     * 로그인·온보딩·OAuth가 끝난 뒤 돌아올 곳으로 계속 이걸 쓴다.
     * 첫 화면을 바꿀 때 여기저기 고치지 않으려고 한 겹 둔 것
     */
    home: '/',
    onboarding: '/onboarding',
    //로그인 경로
    login: '/login',
    oauthCallback: '/oauth/callback',
    nicknameSetup: '/nickname-setup',

    /** 인자 없으면 카테고리 목록, 카테고리를 주면 그 카테고리 그리드 */
    basicDex: (category?: string) => (category ? `/basicDex?category=${encodeURIComponent(category)}` : '/basicDex'),
    dexDetail: (id: number, category?: string) =>
        category ? `/dex/${id}?category=${encodeURIComponent(category)}` : `/dex/${id}`,

    made: '/made',
    madeNew: '/made/new',
    madeJoin: '/made/join',
    /** 초대 링크. 코드가 채워진 채로 참여 화면이 열린다 */
    madeJoinWithCode: (code: string) => `/made/join?code=${encodeURIComponent(code)}`,
    madeDex: (dexId: MadeDexId) => `/made/${dexId}`,
    madeInfo: (dexId: MadeDexId) => `/made/${dexId}/info`,
    madeEdit: (dexId: MadeDexId) => `/made/${dexId}/edit`,
    madeParticipants: (dexId: MadeDexId) => `/made/${dexId}/participants`,
    /** 식사 기록 화면(CATCHEAT-52). 날짜와 끼니를 채운 채로 연다 */
    madeRecordNew: (dexId: MadeDexId, date: string, slotId?: number) =>
        slotId ? `/made/${dexId}/records/new?date=${date}&slotId=${slotId}` : `/made/${dexId}/records/new?date=${date}`,
    madeRecordEdit: (dexId: MadeDexId, recordId: number) => `/made/${dexId}/records/${recordId}/edit`,

    challenge: '/challenge',
    challengeNew: '/challenge/new',
    challengeNewBadge: '/challenge/new/badge',
    challengeDetail: (id: string) => `/challenge/${id}`,

    my: '/my',
    myNickname: '/my/nickname',
    myBadges: '/my/badges',
    myPhoto: '/my/photo',

    friends: '/friends',
    userProfile: (id: number | 'me') => `/users/${id}`,

    admin: '/admin',

    register: '/register',
    registerWithFood: (foodId: number, from?: string) =>
        from ? `/register?foodId=${foodId}&from=${encodeURIComponent(from)}` : `/register?foodId=${foodId}`,
    registerAnalyze: '/register/analyze',
    registerRecord: '/register/record',
    registerTags: '/register/tags',
    registerUnlock: '/register/unlock',
} as const

/** 하단 네비 4탭 → 라우트 */
export const TAB_HREF: Record<NavTab, string> = {
    기본: ROUTES.basicDex(),
    제작: ROUTES.made,
    챌린지: ROUTES.challenge,
    마이: ROUTES.my,
}

const LAST_BASIC_DEX_ROUTE_KEY = 'catcheat:last-basic-dex-route'

export function rememberBasicDexRoute(path: string) {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(LAST_BASIC_DEX_ROUTE_KEY, path)
}

export function getTabHref(tab: NavTab) {
    if (tab !== '기본') return TAB_HREF[tab]
    if (typeof window === 'undefined') return TAB_HREF[tab]
    return window.sessionStorage.getItem(LAST_BASIC_DEX_ROUTE_KEY) ?? TAB_HREF[tab]
}
