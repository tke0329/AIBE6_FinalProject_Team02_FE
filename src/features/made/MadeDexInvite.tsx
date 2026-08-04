import React, { useState } from 'react';
import {
  ArrowLeftIcon,
  CheckIcon,
  ClipboardIcon,
  CopyIcon,
  LinkIcon,
  RefreshCwIcon,
  UsersIcon,
} from 'lucide-react';

import { Badge } from '@/shared/ui/atoms/Badge';
import { inviteDaysLeft, INVITE_CODE_LENGTH, MadeParticipant } from './types';

export type { MadeParticipant } from './types';

interface Props {
  dexTitle: string;
  /** 유효한 코드가 없으면 null — 아직 안 뽑았거나 7일이 지난 상태 */
  code: string | null;
  expiresAt: string | null;
  /** 공유용 전체 URL. 코드가 없으면 null */
  inviteLink: string | null;
  /** 그룹장만 코드를 보고 발급할 수 있다 */
  canManage: boolean;
  loading: boolean;
  /** 조회가 실패했다 — "코드가 없다"와 구분해야 한다 */
  loadFailed: boolean;
  issuing: boolean;
  error: string | null;
  participants: MadeParticipant[];
  onBack: () => void;
  onIssue: () => void;
  onRetry: () => void;
  /** 실제로 클립보드에 들어갔는지 돌려준다 */
  onCopy: (text: string) => Promise<boolean>;
  onRemove: (id: string) => void;
}

export function MadeDexInvite({
  dexTitle,
  code,
  expiresAt,
  inviteLink,
  canManage,
  loading,
  loadFailed,
  issuing,
  error,
  participants,
  onBack,
  onIssue,
  onRetry,
  onCopy,
  onRemove,
}: Props) {
  // 어느 버튼을 눌렀는지까지 기억해야 "복사했어요"가 그 버튼에만 뜬다
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const [removing, setRemoving] = useState<MadeParticipant | null>(null);

  // 클립보드 API는 https나 localhost가 아니면 아예 없다.
  // 결과를 확인하지 않으면 복사되지 않았는데 "복사했어요"가 뜬다.
  const copy = async (kind: 'code' | 'link', text: string) => {
    const copiedOk = await onCopy(text);
    setCopyFailed(!copiedOk);
    setCopied(copiedOk ? kind : null);
    if (copiedOk) window.setTimeout(() => setCopied(null), 1800);
  };

  const daysLeft = expiresAt ? inviteDaysLeft(expiresAt) : 0;

  return (
    <div className="flex h-full flex-col bg-cream-100">
      <header className="flex items-center gap-3 px-5 py-4">
        <button onClick={onBack} aria-label="뒤로가기">
          <ArrowLeftIcon size={22} />
        </button>
        <span className="font-display text-lg text-brown">참여자 관리</span>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto px-5">
        <section className="rounded-3xl bg-orange-500 p-5 text-center text-white shadow-card">
          <p className="text-sm font-medium text-orange-100">
            {dexTitle} 전용 초대 코드
          </p>

          {loading ? (
            <p className="mt-4 text-sm text-orange-50">코드를 불러오는 중…</p>
          ) : loadFailed ? (
            // 코드가 있는지 모르는 상태다. 여기서 발급을 권하면 살아 있는 코드를 죽일 수 있다
            <p className="mt-4 text-sm leading-5 text-orange-50">
              코드를 불러오지 못했어요.
              <br />
              연결을 확인하고 다시 시도해 주세요.
            </p>
          ) : !canManage ? (
            <p className="mt-4 text-sm leading-5 text-orange-50">
              초대 코드는 그룹장이 관리해요.
              <br />
              친구를 부르고 싶다면 그룹장에게 코드를 요청해 주세요.
            </p>
          ) : code ? (
            <>
              <p className="mt-3 font-display text-3xl tracking-[0.28em]">
                {code}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => void copy('code', code)}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-orange-600">
                  {copied === 'code' ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                  {copied === 'code' ? '복사했어요' : '코드 복사'}
                </button>
                {inviteLink && (
                  <button
                    onClick={() => void copy('link', inviteLink)}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-orange-600">
                    {copied === 'link' ? <CheckIcon size={16} /> : <LinkIcon size={16} />}
                    {copied === 'link' ? '복사했어요' : '링크 복사'}
                  </button>
                )}
              </div>
              <p className="mt-3 text-xs text-orange-50">
                {daysLeft > 0
                  ? `${daysLeft}일 뒤 만료돼요. 카톡이나 문자로 전달해 보세요.`
                  : '오늘 만료돼요. 새 코드를 발급해 주세요.'}
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm text-orange-50">
              아직 유효한 코드가 없어요. 새로 발급해 주세요.
            </p>
          )}

          {/* 조회에 실패했으면 발급이 아니라 재조회만 준다 */}
          {!loading && loadFailed && (
            <button
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/60 px-4 py-2 text-sm font-bold text-white">
              <RefreshCwIcon size={16} />
              다시 시도
            </button>
          )}

          {/* 멤버에게는 눌러도 403이 나는 버튼을 보여주지 않는다 */}
          {canManage && !loadFailed && (
            <>
              <button
                onClick={onIssue}
                disabled={issuing}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/60 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                <RefreshCwIcon size={16} />
                {issuing ? '발급 중…' : code ? '코드 새로 발급' : '초대 코드 만들기'}
              </button>
              {code && (
                <p className="mt-2 text-xs text-orange-50">
                  새로 발급하면 이전에 공유한 코드는 쓸 수 없게 돼요.
                </p>
              )}
            </>
          )}
          {copyFailed && (
            <p className="mt-3 text-sm text-orange-50">
              복사하지 못했어요. 코드를 길게 눌러 복사해 주세요.
            </p>
          )}
          {error && <p className="mt-3 text-sm font-bold text-red-100">{error}</p>}
        </section>

        <section className="mt-5">
          <div className="flex items-center gap-2">
            <UsersIcon size={18} className="text-orange-500" />
            <h2 className="font-display text-lg text-brown">
              참여자 {participants.length}명
            </h2>
          </div>
          {/* TODO(멤버 관리 이슈): 참여자 목록과 내보내기는 아직 목 데이터다 */}
          <div className="mt-3 space-y-2">
            {participants.map((participant) => (
              <article
                key={participant.id}
                className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft">
                <Badge
                  variant="member"
                  className="h-10 w-10 border-0 text-sm"
                  label={`참여자 ${participant.name}`}>
                  {participant.name}
                </Badge>
                <span className="flex-1 text-sm font-bold text-brown">
                  {participant.name}님
                </span>
                {participant.id !== 'me' && (
                  <button
                    onClick={() => setRemoving(participant)}
                    className="min-h-touch rounded-full bg-cream-200 px-4 text-xs font-bold text-brown-soft">
                    삭제
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* 코드를 뿌리는 방법 안내라 그룹장에게만 의미가 있다 */}
        {canManage && (
          <section className="mt-5 rounded-2xl bg-white p-4 text-sm text-brown-soft shadow-soft">
            <ClipboardIcon size={18} className="mb-2 text-orange-500" />
            코드를 받은 친구는 제작 도감 목록에서{' '}
            <strong className="text-brown">초대 코드로 참여</strong>를 선택해{' '}
            {INVITE_CODE_LENGTH}자리 코드를 입력하면 돼요. 링크를 보냈다면 누르는
            것만으로 코드가 채워져요.
          </section>
        )}
      </main>

      {removing && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 px-5">
          <section
            role="dialog"
            aria-modal="true"
            className="w-full rounded-3xl bg-cream-50 p-5 shadow-pop">
            <h2 className="font-display text-xl text-brown">
              참여자를 내보낼까요?
            </h2>
            <p className="mt-2 text-sm text-brown-soft">
              {removing.name}님을 도감에서 내보낼까요?
              <br />
              기존에 등록한 카드는 유지됩니다.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => setRemoving(null)}
                className="rounded-2xl bg-cream-200 py-3 text-sm font-bold text-brown-soft">
                취소
              </button>
              <button
                onClick={() => {
                  onRemove(removing.id);
                  setRemoving(null);
                }}
                className="rounded-2xl bg-orange-500 py-3 text-sm font-bold text-white">
                내보내기
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

interface CodeEntryProps {
  /** 초대 링크로 들어왔으면 채워진 채로 시작한다 */
  code: string;
  onCodeChange: (code: string) => void;
  /** 링크로 들어왔을 때 미리 확인한 그룹 이름 */
  groupName: string | null;
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
}

/** 초대 코드 입력. 통신과 결과 판단은 컨테이너(app/made/join)가 한다 */
export function MadeDexCodeEntry({
  code,
  onCodeChange,
  groupName,
  submitting,
  error,
  onBack,
  onSubmit,
}: CodeEntryProps) {
  return (
    <div className="flex h-full flex-col bg-cream-100">
      <header className="flex items-center gap-3 px-5 py-4">
        <button onClick={onBack} aria-label="뒤로가기">
          <ArrowLeftIcon size={22} />
        </button>
        <span className="font-display text-lg text-brown">초대 코드로 참여</span>
      </header>

      <main className="flex-1 px-5 pt-8">
        <div className="rounded-3xl bg-white p-5 text-center shadow-soft">
          <span className="text-4xl">🤝</span>
          <h1 className="mt-3 font-display text-xl text-brown">
            {groupName
              ? `${groupName}에 참여할까요?`
              : '친구의 제작 도감에 참여해요'}
          </h1>
          <p className="mt-2 text-sm leading-5 text-brown-muted">
            초대받은 {INVITE_CODE_LENGTH}자리 코드를 입력하면
            <br />
            함께 카드를 등록할 수 있어요.
          </p>
          <input
            value={code}
            onChange={(event) => onCodeChange(event.target.value)}
            placeholder="ABC123"
            className="mt-6 w-full rounded-2xl border-2 border-cream-300 bg-cream-50 px-4 py-4 text-center font-display text-2xl uppercase tracking-[0.22em] outline-none focus:border-orange-400" />
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      </main>

      <div className="px-5 pb-8">
        <button
          disabled={code.length !== INVITE_CODE_LENGTH || submitting}
          onClick={onSubmit}
          className="w-full rounded-2xl bg-orange-500 py-4 font-display text-lg text-white shadow-card disabled:opacity-40">
          {submitting ? '참여하는 중…' : '도감 참여하기'}
        </button>
      </div>
    </div>
  );
}
