'use client';

import { useRouter } from 'next/navigation';
import { MyPage } from '@/features/my/MyPage';
import { useAppState } from '@/shared/store/AppStateProvider';
import { ROUTES, TAB_HREF } from '@/shared/lib/routes';

/** `/my` 마이페이지 */
export default function MyPageRoute() {
  const router = useRouter();
  const { collectedIds, profilePhoto, equippedBadge } = useAppState();

  return (
    <MyPage
      collectedCount={collectedIds.length}
      profilePhoto={profilePhoto}
      equippedBadge={equippedBadge}
      onChangePhoto={() => router.push(ROUTES.myPhoto)}
      onReplayOnboarding={() => router.push(`${ROUTES.onboarding}?from=my`)}
      onOpenProfile={() => router.push(ROUTES.myProfile)}
      onOpenBadges={() => router.push(ROUTES.myBadges)}
      onTab={(tab) => router.push(TAB_HREF[tab])} />);

}
