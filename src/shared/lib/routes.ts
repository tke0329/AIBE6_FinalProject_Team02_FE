import type { MadeDexId } from '@/features/made/types';
import type { NavTab } from '@/shared/ui/molecules/BottomNav';

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

  dexDetail: (id: number) => `/dex/${id}`,

  made: '/made',
  madeJoin: '/made/join',
  madeDex: (dexId: MadeDexId) => `/made/${dexId}`,
  madeParticipants: (dexId: MadeDexId) => `/made/${dexId}/participants`,

  challenge: '/challenge',
  challengeNew: '/challenge/new',
  challengeNewBadge: '/challenge/new/badge',
  challengeDetail: (id: string) => `/challenge/${id}`,

  my: '/my',
  myProfile: '/my/profile',
  myNickname: '/my/nickname',
  myBadges: '/my/badges',
  myPhoto: '/my/photo',

  admin: '/admin',

  register: '/register',
  registerAnalyze: '/register/analyze',
  registerRecord: '/register/record',
  registerTags: '/register/tags',
  registerUnlock: '/register/unlock',
} as const;

/** 하단 네비 4탭 → 라우트 */
export const TAB_HREF: Record<NavTab, string> = {
  기본: ROUTES.home,
  제작: ROUTES.made,
  챌린지: ROUTES.challenge,
  마이: ROUTES.my,
};
