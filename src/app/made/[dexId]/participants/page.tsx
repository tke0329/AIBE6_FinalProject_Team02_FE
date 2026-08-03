'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import { MadeDexInvite } from '@/features/made/MadeDexInvite';
import { useAppState } from '@/shared/store/AppStateProvider';
import { ROUTES } from '@/shared/lib/routes';
import { parseMadeDexId } from '@/features/made/types';

/** `/made/[dexId]/participants` 초대 코드 + 참여자 관리 */
export default function MadeDexParticipantsPage() {
  const router = useRouter();
  const params = useParams<{dexId: string;}>();
  const { madeParticipants, madeDexTitle, madeDexCode, removeParticipant } = useAppState();

  const dexId = parseMadeDexId(params.dexId);
  if (!dexId) notFound();

  const code = madeDexCode(dexId);

  return (
    <MadeDexInvite
      dexTitle={madeDexTitle(dexId)}
      code={code}
      participants={madeParticipants[dexId] ?? []}
      onBack={() => router.push(ROUTES.madeDex(dexId))}
      onCopy={() => {
        if (navigator.clipboard) void navigator.clipboard.writeText(code);
      }}
      onRemove={(participantId) => removeParticipant(dexId, participantId)} />);

}
