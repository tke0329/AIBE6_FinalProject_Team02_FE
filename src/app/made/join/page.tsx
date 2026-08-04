'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MadeDexCodeEntry } from '@/features/made/MadeDexInvite';
import { fetchInvitePreview, joinMadeDex } from '@/features/made/api';
import { INVITE_CODE_LENGTH, normalizeInviteCode } from '@/features/made/types';
import { useAuth } from '@/features/auth/AuthContext';
import { ApiError, UnauthorizedError } from '@/shared/lib/api';
import { ROUTES } from '@/shared/lib/routes';

/** 서버 에러 코드 → 화면 문구. 모르는 코드면 서버 message를 그대로 보여준다 */
const MESSAGES: Record<string, string> = {
  MADE_DEX_INVITE_CODE_REQUIRED: '초대 코드를 입력해 주세요.',
  MADE_DEX_INVITE_CODE_INVALID: '존재하지 않는 초대 코드예요.',
  MADE_DEX_INVITE_CODE_EXPIRED: '만료된 초대 코드예요. 새 코드를 요청해 주세요.',
  MADE_DEX_ALREADY_JOINED: '이미 이 제작 도감에 참여 중이에요.',
  MADE_DEX_FULL: '인원이 가득 찬 도감이에요.',
  MADE_DEX_NOT_FOUND: '사라진 도감이에요.',
};

function messageOf(failure: unknown): string {
  if (failure instanceof UnauthorizedError) {
    return '로그인이 풀렸어요. 다시 로그인해 주세요.';
  }
  if (failure instanceof ApiError) {
    return MESSAGES[failure.code] ?? failure.message;
  }
  return '참여하지 못했어요. 잠시 후 다시 시도해 주세요.';
}

function JoinContent() {
  const router = useRouter();
  const linkedCode = useSearchParams().get('code');
  const { me, loading: authLoading } = useAuth();

  const [code, setCode] = useState('');
  const [groupName, setGroupName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 미리보기 응답이 늦게 도착했을 때 "지금 입력된 코드"와 대조하려고 들고 있는다
  const codeRef = useRef('');

  const changeCode = useCallback((value: string) => {
    const next = normalizeInviteCode(value);
    codeRef.current = next;
    setCode(next);
    setGroupName(null);
    setError(null);
  }, []);

  // 미리보기는 링크로 들어온 경우에만 부른다.
  // 입력할 때마다 부르면 코드를 넣어보며 남의 그룹 이름을 캐낼 수 있다.
  useEffect(() => {
    if (!linkedCode || !me) return;
    const prefilled = normalizeInviteCode(linkedCode);
    codeRef.current = prefilled;
    setCode(prefilled);
    if (prefilled.length !== INVITE_CODE_LENGTH) return;

    let alive = true;
    // 응답이 도는 사이 사용자가 다른 코드를 입력했다면 그 결과는 버린다.
    // 그러지 않으면 입력창의 코드와 화면의 그룹 이름이 어긋난다
    const isStale = () => !alive || codeRef.current !== prefilled;

    fetchInvitePreview(prefilled).
      then((preview) => {
        if (isStale()) return;
        // 이미 멤버면 참여 버튼을 보여줄 이유가 없다
        if (preview.alreadyMember) {
          router.replace(ROUTES.madeDex(preview.madeDexId));
          return;
        }
        setGroupName(preview.name);
      }).
      catch((failure) => {
        if (!isStale()) setError(messageOf(failure));
      });
    return () => {
      alive = false;
    };
  }, [linkedCode, me, router]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      router.replace(ROUTES.madeDex(await joinMadeDex(code)));
    } catch (failure) {
      setError(messageOf(failure));
      setSubmitting(false);
    }
  }, [code, router]);

  // 초대 링크 자체는 로그인 없이 열리지만, 참여는 내가 누구인지 알아야 가능하다.
  // 로그인 후 원래 링크로 되돌리는 처리는 OAuth 콜백이 홈 고정이라 아직 없다.
  if (!authLoading && !me) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-cream-100 px-8 text-center">
        <span className="text-4xl">🤝</span>
        <p className="text-sm leading-5 text-brown-soft">
          로그인하면 초대받은 도감에 참여할 수 있어요.
          <br />
          로그인한 뒤 초대 링크를 다시 눌러 주세요.
        </p>
        <button
          onClick={() => router.push(ROUTES.login)}
          className="rounded-2xl bg-orange-500 px-6 py-3 font-display text-white shadow-card">
          로그인하러 가기
        </button>
      </div>);

  }

  return (
    <MadeDexCodeEntry
      code={code}
      onCodeChange={changeCode}
      groupName={groupName}
      submitting={submitting}
      error={error}
      onBack={() => router.push(ROUTES.made)}
      onSubmit={() => void submit()} />);

}

/** `/made/join` 초대 코드로 제작 도감 참여 (useSearchParams는 Suspense로 감싼다) */
export default function MadeDexJoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinContent />
    </Suspense>);

}
