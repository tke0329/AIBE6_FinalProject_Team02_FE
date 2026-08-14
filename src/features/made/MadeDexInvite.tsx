import React, { useState } from 'react'
import {
    ArrowLeftIcon,
    BookMarkedIcon,
    CheckIcon,
    ClipboardIcon,
    CopyIcon,
    CrownIcon,
    HandshakeIcon,
    LinkIcon,
    LogOutIcon,
    RefreshCwIcon,
    UsersIcon,
} from 'lucide-react'

import { Dialog } from '@/shared/ui'
import { inviteDaysLeft, INVITE_CODE_LENGTH, memberInitial, memberName } from './types'
import type { MadeDexMember, MadeDexRole } from './types'

// owner를 들고 있는 이유는 그룹장의 나가기가 그룹 삭제라 경고 문구가 완전히 다르기 때문이다
type Confirm =
    | { kind: 'kick'; member: MadeDexMember }
    | { kind: 'transfer'; member: MadeDexMember }
    | { kind: 'leave'; owner: boolean }

interface Props {
    dexTitle: string
    /** 유효한 코드가 없으면 null — 아직 안 뽑았거나 7일이 지난 상태 */
    code: string | null
    expiresAt: string | null
    /** 공유용 전체 URL. 코드가 없으면 null */
    inviteLink: string | null
    /** 그룹장만 코드를 보고 발급할 수 있다 */
    canManage: boolean
    loading: boolean
    /** 조회가 실패했다 — "코드가 없다"와 구분해야 한다 */
    loadFailed: boolean
    issuing: boolean
    error: string | null
    members: MadeDexMember[]
    maxMembers: number
    /** 목록을 아직 못 읽었으면 null */
    myRole: MadeDexRole | null
    membersLoading: boolean
    membersFailed: boolean
    memberBusy: boolean
    memberError: string | null
    onBack: () => void
    onIssue: () => void
    onRetry: () => void
    /** 실제로 클립보드에 들어갔는지 돌려준다 */
    onCopy: (text: string) => Promise<boolean>
    onKick: (member: MadeDexMember) => void
    onTransfer: (member: MadeDexMember) => void
    onLeave: () => void
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
    members,
    maxMembers,
    myRole,
    membersLoading,
    membersFailed,
    memberBusy,
    memberError,
    onBack,
    onIssue,
    onRetry,
    onCopy,
    onKick,
    onTransfer,
    onLeave,
}: Props) {
    // 어느 버튼을 눌렀는지까지 기억해야 "복사했어요"가 그 버튼에만 뜬다
    const [copied, setCopied] = useState<'code' | 'link' | null>(null)
    const [copyFailed, setCopyFailed] = useState(false)
    const [confirm, setConfirm] = useState<Confirm | null>(null)

    // 클립보드 API는 https나 localhost가 아니면 아예 없다.
    // 결과를 확인하지 않으면 복사되지 않았는데 "복사했어요"가 뜬다.
    const copy = async (kind: 'code' | 'link', text: string) => {
        const copiedOk = await onCopy(text)
        setCopyFailed(!copiedOk)
        setCopied(copiedOk ? kind : null)
        if (copiedOk) window.setTimeout(() => setCopied(null), 1800)
    }

    const daysLeft = expiresAt ? inviteDaysLeft(expiresAt) : 0

    return (
        <div className="flex h-full flex-col bg-surface-app">
            <header className="flex items-center gap-3 px-5 py-4">
                <button onClick={onBack} aria-label="뒤로가기">
                    <ArrowLeftIcon size={22} />
                </button>
                {/* 이 화면은 코드 발급과 참여자 관리를 함께 한다. 제목이 절반만 말하면
                    "초대 코드는 어디 있지"가 된다 — 도감 정보의 메뉴 이름과 맞춰 둔다 */}
                <span className="font-display text-lg text-neutral-900">초대 코드 · 참여자 관리</span>
            </header>

            <main className="no-scrollbar flex-1 overflow-y-auto px-5">
                <section className="rounded-3xl bg-watermelon-500 p-5 text-center text-white shadow-card">
                    <p className="text-sm font-medium text-watermelon-100">{dexTitle} 전용 초대 코드</p>

                    {loading ? (
                        <p className="mt-4 text-sm text-watermelon-50">코드를 불러오는 중…</p>
                    ) : loadFailed ? (
                        // 코드가 있는지 모르는 상태다. 여기서 발급을 권하면 살아 있는 코드를 죽일 수 있다
                        <p className="mt-4 text-sm leading-5 text-watermelon-50">
                            코드를 불러오지 못했어요.
                            <br />
                            연결을 확인하고 다시 시도해 주세요.
                        </p>
                    ) : !canManage ? (
                        <p className="mt-4 text-sm leading-5 text-watermelon-50">
                            초대 코드는 그룹장이 관리해요.
                            <br />
                            친구를 부르고 싶다면 그룹장에게 코드를 요청해 주세요.
                        </p>
                    ) : code ? (
                        <>
                            <p className="mt-3 font-display text-3xl tracking-[0.28em]">{code}</p>
                            <div className="mt-4 flex flex-wrap justify-center gap-2">
                                <button
                                    onClick={() => void copy('code', code)}
                                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-watermelon-600"
                                >
                                    {copied === 'code' ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                                    {copied === 'code' ? '복사했어요' : '코드 복사'}
                                </button>
                                {inviteLink && (
                                    <button
                                        onClick={() => void copy('link', inviteLink)}
                                        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-watermelon-600"
                                    >
                                        {copied === 'link' ? <CheckIcon size={16} /> : <LinkIcon size={16} />}
                                        {copied === 'link' ? '복사했어요' : '링크 복사'}
                                    </button>
                                )}
                            </div>
                            <p className="mt-3 text-xs text-watermelon-50">
                                {daysLeft > 0
                                    ? `${daysLeft}일 뒤 만료돼요. 카톡이나 문자로 전달해 보세요.`
                                    : '오늘 만료돼요. 새 코드를 발급해 주세요.'}
                            </p>
                        </>
                    ) : (
                        <p className="mt-4 text-sm text-watermelon-50">
                            아직 유효한 코드가 없어요. 새로 발급해 주세요.
                        </p>
                    )}

                    {/* 조회에 실패했으면 발급이 아니라 재조회만 준다 */}
                    {!loading && loadFailed && (
                        <button
                            onClick={onRetry}
                            className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/60 px-4 py-2 text-sm font-bold text-white"
                        >
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
                                className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/60 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                            >
                                <RefreshCwIcon size={16} />
                                {issuing ? '발급 중…' : code ? '코드 새로 발급' : '초대 코드 만들기'}
                            </button>
                            {code && (
                                <p className="mt-2 text-xs text-watermelon-50">
                                    새로 발급하면 이전에 공유한 코드는 쓸 수 없게 돼요.
                                </p>
                            )}
                        </>
                    )}
                    {copyFailed && (
                        <p className="mt-3 text-sm text-watermelon-50">
                            복사하지 못했어요. 코드를 길게 눌러 복사해 주세요.
                        </p>
                    )}
                    {error && <p className="mt-3 text-sm font-bold text-red-100">{error}</p>}
                </section>

                <section className="mt-5">
                    <div className="flex items-center gap-2">
                        <UsersIcon size={18} className="text-watermelon-500" />
                        <h2 className="font-display text-lg text-neutral-900">
                            참여자 {members.length}/{maxMembers}명
                        </h2>
                    </div>

                    {membersLoading ? (
                        <p className="mt-3 text-sm text-neutral-400">참여자를 불러오는 중…</p>
                    ) : membersFailed ? (
                        <div className="mt-3 rounded-2xl bg-white p-4 shadow-soft">
                            <p className="text-sm text-neutral-800">참여자를 불러오지 못했어요.</p>
                            <button
                                onClick={onRetry}
                                className="mt-3 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-xs font-bold text-neutral-800"
                            >
                                <RefreshCwIcon size={14} />
                                다시 시도
                            </button>
                        </div>
                    ) : (
                        <div className="mt-3 space-y-2">
                            {members.map((member) => (
                                <article
                                    key={member.userId}
                                    className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft"
                                >
                                    <MemberAvatar member={member} />
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate text-sm font-bold text-neutral-900">
                                            {memberName(member)}
                                            {member.me && <span className="ml-1 text-xs text-neutral-400">(나)</span>}
                                        </p>
                                        {member.role === 'OWNER' && (
                                            <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-watermelon-600">
                                                <CrownIcon size={12} aria-hidden />
                                                그룹장
                                            </span>
                                        )}
                                    </div>
                                    {myRole === 'OWNER' && !member.me && (
                                        <div className="flex shrink-0 gap-1">
                                            <button
                                                disabled={memberBusy}
                                                onClick={() => setConfirm({ kind: 'transfer', member })}
                                                className="min-h-touch rounded-full bg-neutral-100 px-3 text-xs font-bold text-neutral-800 disabled:opacity-40"
                                            >
                                                위임
                                            </button>
                                            <button
                                                disabled={memberBusy}
                                                onClick={() => setConfirm({ kind: 'kick', member })}
                                                className="min-h-touch rounded-full bg-neutral-100 px-3 text-xs font-bold text-neutral-800 disabled:opacity-40"
                                            >
                                                내보내기
                                            </button>
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    )}

                    {memberError && <p className="mt-3 text-sm font-bold text-red-500">{memberError}</p>}
                </section>

                {/* 역할을 알기 전에는 감춘다. 그룹장에게 나가기는 그룹 삭제라 문구가 달라야 한다 */}
                {!membersLoading && !membersFailed && myRole && (
                    <section className="mt-5">
                        <button
                            disabled={memberBusy}
                            onClick={() => setConfirm({ kind: 'leave', owner: myRole === 'OWNER' })}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-bold text-red-500 shadow-soft disabled:opacity-40"
                        >
                            <LogOutIcon size={16} aria-hidden />
                            {myRole === 'OWNER' ? '도감 없애고 나가기' : '도감에서 나가기'}
                        </button>
                    </section>
                )}

                {/* 코드를 뿌리는 방법 안내라 그룹장에게만 의미가 있다 */}
                {canManage && (
                    <section className="mt-5 rounded-2xl bg-white p-4 text-sm text-neutral-800 shadow-soft">
                        <ClipboardIcon size={18} className="mb-2 text-watermelon-500" />
                        코드를 받은 친구는 로그잇 목록 위쪽 <strong className="text-neutral-900">초대코드</strong>를
                        눌러 {INVITE_CODE_LENGTH}
                        자리 코드를 입력하면 돼요. 링크를 보냈다면 누르는 것만으로 코드가 채워져요.
                    </section>
                )}
            </main>

            {confirm && (
                <MemberActionDialog
                    confirm={confirm}
                    dexTitle={dexTitle}
                    onCancel={() => setConfirm(null)}
                    onConfirm={() => {
                        if (confirm.kind === 'kick') onKick(confirm.member)
                        else if (confirm.kind === 'transfer') onTransfer(confirm.member)
                        else onLeave()
                        setConfirm(null)
                    }}
                />
            )}
        </div>
    )
}

function MemberAvatar({ member }: { member: MadeDexMember }) {
    const name = memberName(member)

    if (member.profileImageUrl) {
        return (
            // presigned URL이라 next/image의 도메인 설정 대상이 아니다
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={member.profileImageUrl}
                alt={`${name} 프로필 사진`}
                className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
        )
    }

    return (
        <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-bold text-neutral-900"
        >
            {memberInitial(member)}
        </span>
    )
}

interface MemberActionDialogProps {
    confirm: Confirm
    dexTitle: string
    onCancel: () => void
    onConfirm: () => void
}

/**
 * 내보내기·위임·나가기의 문구를 고르는 얇은 래퍼. 창 자체는 공통 `Dialog`가 그린다.
 * 확인을 누르면 바로 닫는다 — 진행 상태와 실패는 목록 쪽에서 알린다
 */
function MemberActionDialog({ confirm, dexTitle, onCancel, onConfirm }: MemberActionDialogProps) {
    const copy =
        confirm.kind === 'kick'
            ? {
                  title: '참여자를 내보낼까요?',
                  body: (
                      <>
                          {memberName(confirm.member)}님을 도감에서 내보낼까요?
                          <br />
                          등록한 카드는 그대로 남고, 초대 코드를 다시 받으면 들어올 수 있어요.
                      </>
                  ),
                  action: '내보내기',
              }
            : confirm.kind === 'transfer'
              ? {
                    title: '그룹장을 넘길까요?',
                    body: (
                        <>
                            {memberName(confirm.member)}님이 그룹장이 되고, 나는 일반 참여자가 돼요.
                            <br />
                            초대 코드 관리도 함께 넘어가요.
                        </>
                    ),
                    action: '위임하기',
                }
              : confirm.owner
                ? {
                      title: '도감이 사라져요',
                      body: (
                          <>
                              그룹장이 나가면 {dexTitle}이 사라지고, 참여자 모두가 함께 나가게 돼요.
                              <br />
                              도감을 남기고 싶다면 먼저 다른 참여자에게 그룹장을 위임해 주세요.
                          </>
                      ),
                      action: '없애고 나가기',
                  }
                : {
                      title: '도감에서 나갈까요?',
                      body: (
                          <>
                              {dexTitle}에서 나가면 카드를 더 등록할 수 없어요.
                              <br />
                              초대 코드를 다시 받으면 들어올 수 있어요.
                          </>
                      ),
                      action: '나가기',
                  }

    return (
        <Dialog
            title={copy.title}
            message={copy.body}
            danger
            action={{ label: copy.action, onClick: onConfirm }}
            onClose={onCancel}
        />
    )
}

interface CodeEntryProps {
    /** 초대 링크로 들어왔으면 채워진 채로 시작한다 */
    code: string
    onCodeChange: (code: string) => void
    /** 링크로 들어왔을 때 미리 확인한 그룹 이름 */
    groupName: string | null
    /** 이미 멤버다. 참여시키는 대신 도감으로 보낸다 */
    alreadyJoined: boolean
    submitting: boolean
    error: string | null
    onBack: () => void
    onSubmit: () => void
}

/** 초대 코드 입력. 통신과 결과 판단은 컨테이너(app/made/join)가 한다 */
export function MadeDexCodeEntry({
    code,
    onCodeChange,
    groupName,
    alreadyJoined,
    submitting,
    error,
    onBack,
    onSubmit,
}: CodeEntryProps) {
    return (
        <div className="flex h-full flex-col bg-surface-app">
            <header className="flex items-center gap-3 px-5 py-4">
                <button onClick={onBack} aria-label="뒤로가기">
                    <ArrowLeftIcon size={22} />
                </button>
                <span className="font-display text-lg text-neutral-900">초대 코드로 참여</span>
            </header>

            <main className="flex-1 px-5 pt-8">
                <div className="rounded-3xl bg-white p-5 text-center shadow-soft">
                    {alreadyJoined ? (
                        <BookMarkedIcon
                            size={44}
                            strokeWidth={1.5}
                            aria-hidden
                            className="mx-auto text-watermelon-500"
                        />
                    ) : (
                        <HandshakeIcon
                            size={44}
                            strokeWidth={1.5}
                            aria-hidden
                            className="mx-auto text-watermelon-500"
                        />
                    )}
                    <h1 className="mt-3 font-display text-xl text-neutral-900">
                        {alreadyJoined
                            ? '이미 참여하고 있는 도감이에요'
                            : groupName
                              ? `${groupName}에 참여할까요?`
                              : '친구의 로그잇에 참여해요'}
                    </h1>
                    <p className="mt-2 text-sm leading-5 text-neutral-400">
                        {alreadyJoined ? (
                            <>
                                {groupName ? `${groupName}은 ` : '이 도감은 '}
                                이미 내 목록에 있어요.
                                <br />
                                코드를 다시 입력하지 않아도 바로 열 수 있어요.
                            </>
                        ) : (
                            <>
                                초대받은 {INVITE_CODE_LENGTH}자리 코드를 입력하면
                                <br />
                                함께 카드를 등록할 수 있어요.
                            </>
                        )}
                    </p>
                    {/* 이미 멤버면 코드는 확인이 끝난 값이라 고칠 이유가 없다 */}
                    {!alreadyJoined && (
                        <input
                            value={code}
                            onChange={(event) => onCodeChange(event.target.value)}
                            placeholder="ABC123"
                            className="mt-6 w-full rounded-2xl border-2 border-neutral-200 bg-white px-4 py-4 text-center font-display text-2xl uppercase tracking-[0.22em] outline-none focus:border-watermelon-400"
                        />
                    )}
                    {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                </div>
            </main>

            <div className="px-5 pb-8">
                <button
                    disabled={!alreadyJoined && (code.length !== INVITE_CODE_LENGTH || submitting)}
                    onClick={onSubmit}
                    className="w-full rounded-2xl bg-watermelon-500 py-4 font-display text-lg text-white shadow-card disabled:opacity-40"
                >
                    {alreadyJoined ? '도감 열기' : submitting ? '참여하는 중…' : '도감 참여하기'}
                </button>
            </div>
        </div>
    )
}
