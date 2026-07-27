'use client';

import { DexGrid } from '@/features/dex/DexGrid';
import { ROUTES, TAB_HREF } from '@/shared/lib/routes';
import { useAppState } from '@/shared/store/AppStateProvider';
import { useRouter } from 'next/navigation';

/** `/` 기본 도감 (인증/온보딩 진입 분기는 AuthGate가 전담) */
export default function DexHomePage() {
  const router = useRouter();
  const { entries, collectedIds, newlyUnlockedId, startRegistration } = useAppState();

  return (
    <DexGrid
      entries={entries}
      collectedIds={collectedIds}
      newlyUnlockedId={newlyUnlockedId}
      onOpenEntry={(id) => router.push(ROUTES.dexDetail(id))}
      onRegister={() => {
        startRegistration('basic');
        router.push(ROUTES.register);
      }}
      onTab={(tab) => router.push(TAB_HREF[tab])} />);

}
