'use client';

import { useRouter } from 'next/navigation';
import { MadeDexList } from '@/features/made/MadeDexList';
import { useAppState } from '@/shared/store/AppStateProvider';
import { getTabHref, ROUTES } from '@/shared/lib/routes';

/** `/made` 제작 도감 목록 */
export default function MadeDexListPage() {
  const router = useRouter();
  const { madeParticipants } = useAppState();

  return (
    <MadeDexList
      participants={madeParticipants}
      onOpenDex={(dexId) => router.push(ROUTES.madeDex(dexId))}
      onJoinWithCode={() => router.push(ROUTES.madeJoin)}
      onTab={(tab) => router.push(getTabHref(tab))} />);

}
