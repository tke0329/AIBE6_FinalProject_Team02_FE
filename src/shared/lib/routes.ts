import type { MadeDexId } from '@/features/made/types'
import type { NavTab } from '@/shared/ui/molecules/BottomNav'

/**
 * 앱의 모든 URL을 한곳에서 관리.
 * 라우트 경로를 문자열로 흩뿌리지 말고 항상 여기를 통해 만들 것.
 */
export const ROUTES = {
    home: '/',
    onboarding: '/onboarding',
    //로그인 경로
    login: '/login',
    oauthCallback: '/oauth/callback',
    nicknameSetup: '/nickname-setup',

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
    madeManage: (dexId: MadeDexId) => `/made/${dexId}/manage`,
    madeEdit: (dexId: MadeDexId) => `/made/${dexId}/edit`,
    madeParticipants: (dexId: MadeDexId) => `/made/${dexId}/participants`,

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
    기본: ROUTES.home,
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
