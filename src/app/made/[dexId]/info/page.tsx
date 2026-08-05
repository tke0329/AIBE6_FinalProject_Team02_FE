'use client';

import { useCallback, useEffect, useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { MadeDexInfo } from '@/features/made/MadeDexInfo';
import {
  fetchActiveInvite,
  fetchMadeDexDetail,
  leaveMadeDex,
} from '@/features/made/api';
import { isNotOwner, madeErrorMessage } from '@/features/made/errors';
import { parseMadeDexId } from '@/features/made/types';
import type { MadeDexDetail } from '@/features/made/types';
import { ROUTES } from '@/shared/lib/routes';

async function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** `/made/[dexId]/info` 도감 정보 */
export default function MadeDexInfoPage() {
  const router = useRouter();
  const params = useParams<{dexId: string;}>();

  const dexId = parseMadeDexId(params.dexId);

  const [detail, setDetail] = useState<MadeDexDetail | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (madeDexId: number) => {
    setLoading(true);
    try {
      const next = await fetchMadeDexDetail(madeDexId);
      setDetail(next);
      setError(null);

      // 초대 링크는 그룹장에게만 의미가 있다. 멤버가 부르면 403이라 아예 걸지 않는다
      if (next.myRole !== 'OWNER') {
        setInviteCode(null);
        return;
      }
      try {
        setInviteCode((await fetchActiveInvite(madeDexId))?.code ?? null);
      } catch (failure) {
        // 코드를 못 읽어도 정보 화면은 보여준다
        if (!isNotOwner(failure)) setInviteCode(null);
      }
    } catch (failure) {
      setError(madeErrorMessage(failure, '도감 정보를 불러오지 못했어요.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dexId) void load(dexId);
  }, [dexId, load]);

  if (!dexId) notFound();

  const leave = async () => {
    setLeaving(true);
    setError(null);
    try {
      await leaveMadeDex(dexId);
      router.replace(ROUTES.made);
    } catch (failure) {
      setError(madeErrorMessage(failure, '나가지 못했어요. 잠시 후 다시 시도해 주세요.'));
      setLeaving(false);
    }
  };

  if (loading || !detail) {
    return (
      <div className="flex h-full items-center justify-center bg-cream-100">
        <p className="text-sm text-content-secondary">
          {error ?? '도감 정보를 불러오는 중…'}
        </p>
      </div>);

  }

  const inviteLink =
  inviteCode && typeof window !== 'undefined' ?
  `${window.location.origin}${ROUTES.madeJoinWithCode(inviteCode)}` :
  null;

  return (
    <MadeDexInfo
      detail={detail}
      leaving={leaving}
      error={error}
      inviteLink={inviteLink}
      onBack={() => router.push(ROUTES.madeDex(dexId))}
      onManage={() => router.push(ROUTES.madeManage(dexId))}
      onLeave={() => void leave()}
      onCopyInviteLink={copyToClipboard} />);

}
