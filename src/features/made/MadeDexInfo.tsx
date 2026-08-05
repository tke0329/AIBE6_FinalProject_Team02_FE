import React, { useState } from 'react';
import {
  ArrowLeftIcon,
  CheckIcon,
  GlobeIcon,
  LinkIcon,
  LockIcon,
  UsersIcon,
} from 'lucide-react';

import { BottomSheet } from '@/shared/ui/molecules/BottomSheet';
import { DEFAULT_MADE_DEX_COVER, madeDexDayCount, MadeDexDetail } from './types';

interface Props {
  detail: MadeDexDetail;
  /** 나가기가 도는 동안 버튼을 잠근다 */
  leaving: boolean;
  error: string | null;
  onBack: () => void;
  onManage: () => void;
  onLeave: () => void;
  /** 초대 링크. 그룹장이 아니거나 유효 코드가 없으면 null */
  inviteLink: string | null;
  /** 실제로 클립보드에 들어갔는지 돌려준다 */
  onCopyInviteLink: (text: string) => Promise<boolean>;
}

export function MadeDexInfo({
  detail,
  leaving,
  error,
  onBack,
  onManage,
  onLeave,
  inviteLink,
  onCopyInviteLink,
}: Props) {
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const owner = detail.myRole === 'OWNER';
  const isPublic = detail.visibility === 'PUBLIC';
  const VisibilityIcon = isPublic ? GlobeIcon : LockIcon;

  const copy = async () => {
    if (!inviteLink) return;
    const ok = await onCopyInviteLink(inviteLink);
    setCopyFailed(!ok);
    setCopied(ok);
    if (ok) window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="relative flex h-full flex-col bg-cream-100">
      <header className="flex items-center justify-between gap-3 px-5 py-4">
        <button type="button" onClick={onBack} aria-label="뒤로가기" className="min-h-touch">
          <ArrowLeftIcon size={22} className="text-content-primary" />
        </button>
        <div className="flex items-center gap-1">
          {owner && (
            <button
              type="button"
              onClick={onManage}
              className="min-h-touch rounded-full px-3 text-sm font-bold text-content-primary">
              도감 관리
            </button>
          )}
          {detail.myRole && (
            <button
              type="button"
              disabled={leaving}
              onClick={() => setLeaveOpen(true)}
              className="min-h-touch rounded-full px-3 text-sm font-bold text-feedback-error disabled:opacity-40">
              나가기
            </button>
          )}
        </div>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-8">
        <section className="rounded-3xl bg-surface-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-lg text-content-primary">도감 정보</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-cream-200 px-3 py-1.5 text-xs font-bold text-content-secondary">
              <VisibilityIcon size={13} aria-hidden />
              {isPublic ? '공개' : '비공개'}
            </span>
          </div>

          <div className="mt-5 flex flex-col items-center text-center">
            {/* presigned URL이라 next/image의 도메인 설정 대상이 아니다 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={detail.imageUrl ?? DEFAULT_MADE_DEX_COVER}
              alt=""
              className="h-28 w-28 rounded-full bg-cream-200 object-cover" />

            <h2 className="mt-4 font-display text-xl text-content-primary">
              {detail.name}
            </h2>

            {detail.description && (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-content-secondary">
                {detail.description}
              </p>
            )}

            <p className="mt-4 flex items-center gap-1 text-sm text-content-secondary">
              <UsersIcon size={15} aria-hidden />
              {detail.memberCount}/{detail.maxMembers}명 참여 중
            </p>
            <p className="mt-1 text-xs text-content-muted">
              개설 {madeDexDayCount(detail.createdAt)}일째
            </p>
          </div>
        </section>

        {/* 코드를 뿌리는 건 그룹장 일이라 링크도 그룹장에게만 보인다 */}
        {inviteLink && (
          <button
            type="button"
            onClick={() => void copy()}
            className="mt-4 flex min-h-touch w-full items-center justify-center gap-2 rounded-2xl border border-orange-400 bg-surface-card py-4 text-sm font-bold text-content-link">
            {copied ? <CheckIcon size={17} aria-hidden /> : <LinkIcon size={17} aria-hidden />}
            {copied ? '초대 링크를 복사했어요' : '초대 링크 복사'}
          </button>
        )}
        {copyFailed && (
          <p className="mt-2 text-center text-sm text-content-secondary">
            복사하지 못했어요. 도감 관리에서 코드를 확인해 주세요.
          </p>
        )}

        {error && <p className="mt-4 text-sm text-feedback-error">{error}</p>}
      </main>

      {leaveOpen && (
        <BottomSheet
          title={owner ? '도감이 사라져요' : '도감에서 나갈까요?'}
          onClose={() => setLeaveOpen(false)}>
          <div className="px-5 pb-8 pt-2">
            <p className="text-sm leading-5 text-content-secondary">
              {owner ? (
                <>
                  그룹장이 나가면 {detail.name}이 사라지고, 참여자 모두가 함께
                  나가게 돼요. 도감을 남기고 싶다면 도감 관리에서 먼저 그룹장을
                  넘겨 주세요.
                </>
              ) : (
                <>
                  나가면 카드를 더 등록할 수 없어요. 초대 코드를 다시 받으면
                  들어올 수 있어요.
                </>
              )}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLeaveOpen(false)}
                className="min-h-touch rounded-2xl border border-edge-default text-sm font-medium text-content-secondary">
                취소
              </button>
              <button
                type="button"
                disabled={leaving}
                onClick={() => {
                  setLeaveOpen(false);
                  onLeave();
                }}
                className="min-h-touch rounded-2xl bg-action-primary text-sm font-bold text-content-on-action disabled:bg-action-disabled-bg disabled:text-action-disabled-text">
                {owner ? '없애고 나가기' : '나가기'}
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>);

}
