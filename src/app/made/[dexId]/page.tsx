'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import { MadeDexHome } from '@/features/made/MadeDexHome';
import { useAppState } from '@/shared/store/AppStateProvider';
import { getTabHref, ROUTES } from '@/shared/lib/routes';
import { parseMadeDexId } from '@/features/made/types';

/** `/made/[dexId]` 제작 도감 홈 */
export default function MadeDexHomePage() {
  const router = useRouter();
  const params = useParams<{dexId: string;}>();
  const { madeParticipants, recentMadeCard, startRegistration } = useAppState();

  const dexId = parseMadeDexId(params.dexId);
  if (!dexId) notFound();

  return (
    <MadeDexHome
      dexId={dexId}
      recentCard={recentMadeCard}
      participants={madeParticipants[dexId] ?? []}
      onBack={() => router.push(ROUTES.made)}
      onSwitchDex={(nextId) => router.replace(ROUTES.madeDex(nextId))}
      onRegister={() => {
        startRegistration('made', String(dexId));
        router.push(ROUTES.register);
      }}
      onManageParticipants={() => router.push(ROUTES.madeParticipants(dexId))}
      onOpenInfo={() => router.push(ROUTES.madeInfo(dexId))}
      onTab={(tab) => router.push(getTabHref(tab))} />);

}
