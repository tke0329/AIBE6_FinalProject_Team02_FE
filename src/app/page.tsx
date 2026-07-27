'use client';

import { DexGrid } from '@/features/dex/DexGrid';
import { ROUTES, TAB_HREF } from '@/shared/lib/routes';
import { useAppState } from '@/shared/store/AppStateProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** `/` 기본 도감 */
export default function DexHomePage() {
  const router = useRouter();
  const { collectedIds, newlyUnlockedId, onboardingSeen, startRegistration } = useAppState();
  
  // 첫 방문이면 온보딩부터
  useEffect(() => {
    if (!onboardingSeen) router.replace(ROUTES.onboarding);
  }, [onboardingSeen, router]);

  return (
    <DexGrid
      collectedIds={collectedIds}
      newlyUnlockedId={newlyUnlockedId}
      onOpenEntry={(id) => router.push(ROUTES.dexDetail(id))}
      onRegister={() => {
        startRegistration('basic');
        router.push(ROUTES.register);
      }}
      onTab={(tab) => router.push(TAB_HREF[tab])} />);

}
