'use client';

import { useCallback, useEffect, useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { MadeDexInvite } from '@/features/made/MadeDexInvite';
import { fetchActiveInvite, issueInvite } from '@/features/made/api';
import { parseMadeDexId } from '@/features/made/types';
import type { MadeDexInvite as Invite } from '@/features/made/types';
import { useAppState } from '@/shared/store/AppStateProvider';
import { ApiError, UnauthorizedError } from '@/shared/lib/api';
import { ROUTES } from '@/shared/lib/routes';

const MESSAGES: Record<string, string> = {
  MADE_DEX_NOT_FOUND: '사라진 도감이에요.',
};

/** 코드 관리는 그룹장 전용이다. 멤버에게는 에러가 아니라 화면 상태로 다룬다 */
function isNotOwner(failure: unknown): boolean {
  return failure instanceof ApiError && failure.code === 'MADE_DEX_NOT_OWNER';
}

function messageOf(failure: unknown): string {
  if (failure instanceof UnauthorizedError) {
    return '로그인이 풀렸어요. 다시 로그인해 주세요.';
  }
  if (failure instanceof ApiError) {
    return MESSAGES[failure.code] ?? failure.message;
  }
  return '초대 코드를 처리하지 못했어요.';
}

/**
 * 클립보드 API는 https나 localhost에서만 존재하고, 있어도 거부될 수 있다.
 * 성공 여부를 돌려줘야 화면이 "복사했어요"를 거짓으로 띄우지 않는다.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** `/made/[dexId]/participants` 초대 코드 + 참여자 관리 */
export default function MadeDexParticipantsPage() {
  const router = useRouter();
  const params = useParams<{dexId: string;}>();
  // TODO(멤버 관리 이슈): 참여자 목록·제목은 아직 목 스토어에서 온다
  const { madeParticipants, madeDexTitle, removeParticipant } = useAppState();

  const dexId = parseMadeDexId(params.dexId);

  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 그룹장이 아니면 조회 자체가 403이다. 이건 실패가 아니라 "권한 없음" 화면이다
  const [canManage, setCanManage] = useState(true);
  // 조회가 깨진 것과 코드가 없는 것은 다르다. 섞으면 살아 있는 코드를 죽이는 발급을 권하게 된다
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(async (madeDexId: number) => {
    setLoading(true);
    try {
      setInvite(await fetchActiveInvite(madeDexId));
      setLoadFailed(false);
      setError(null);
    } catch (failure) {
      if (isNotOwner(failure)) {
        setCanManage(false);
        setLoadFailed(false);
        setError(null);
      } else {
        setLoadFailed(true);
        setError(messageOf(failure));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dexId) void load(dexId);
  }, [dexId, load]);

  if (!dexId) notFound();

  const issue = async () => {
    setIssuing(true);
    setError(null);
    try {
      setInvite(await issueInvite(dexId));
    } catch (failure) {
      // 조회는 됐는데 발급에서 403이면 그사이 그룹장이 위임된 것이다
      if (isNotOwner(failure)) setCanManage(false);
      else setError(messageOf(failure));
    } finally {
      setIssuing(false);
    }
  };

  // 링크는 지금 보고 있는 앱의 주소로 만든다 — 서버가 배포 주소를 알 필요가 없다
  const inviteLink =
  invite && typeof window !== 'undefined' ?
  `${window.location.origin}${ROUTES.madeJoinWithCode(invite.code)}` :
  null;

  return (
    <MadeDexInvite
      dexTitle={madeDexTitle(dexId)}
      code={invite?.code ?? null}
      expiresAt={invite?.expiresAt ?? null}
      inviteLink={inviteLink}
      canManage={canManage}
      loading={loading}
      loadFailed={loadFailed}
      issuing={issuing}
      error={error}
      participants={madeParticipants[dexId] ?? []}
      onBack={() => router.push(ROUTES.madeDex(dexId))}
      onIssue={() => void issue()}
      onRetry={() => void load(dexId)}
      onCopy={copyToClipboard}
      onRemove={(participantId) => removeParticipant(dexId, participantId)} />);

}
