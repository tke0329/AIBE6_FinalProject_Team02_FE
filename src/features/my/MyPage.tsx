import { BottomNav, NavTab, ServerBadge } from '@/shared/ui'
import {
    AwardIcon,
    BellIcon,
    CameraIcon,
    ChevronRightIcon,
    HeartIcon,
    LogOutIcon,
    PencilIcon,
    StarIcon,
    UserMinusIcon,
    UsersIcon,
    ShieldIcon,
} from 'lucide-react'
import React from 'react'

interface Props {
    nickname: string
    profileImageUrl: string | null
    equippedBadge: {
        name: string
        code: string | null
        imageUrl: string | null
    } | null
    onChangePhoto: () => void
    onEditNickname: () => void
    onOpenBadges: () => void
    onOpenWritten: () => void
    onOpenLikes: () => void
    onOpenFriends: () => void
    onOpenNotifications: () => void
    unreadNotificationCount?: number
    onLogout: () => void
    onWithdraw: () => void
    onTab: (tab: NavTab) => void
    isAdmin?: boolean
    onOpenAdmin?: () => void
}

/**
 * 마이페이지.
 *
 * ## 메뉴를 세 묶음으로 갈랐다
 *
 * 예전에는 친구·닉네임 수정·로그아웃이 한 상자에 있고 회원 탈퇴만 아래 회색 글씨로 떨어져
 * 있었다. 성격이 다른 것들이 섞여 있어서 **찾을 때 목록 전체를 훑어야 했다.**
 *
 *   - **내 활동** — 내가 남긴 것 (리뷰·댓글·좋아요)
 *   - **소셜**   — 남과 이어지는 것 (친구·알림)
 *   - **내 계정 관리** — 계정 자체를 손대는 것 (닉네임·로그아웃·탈퇴)
 *
 * 탈퇴를 「내 계정 관리」 안으로 들인 이유는 **숨겨 두면 더 위험하기 때문**이다.
 * 아래 회색 글씨는 "여긴 뭐지" 하고 눌러 보게 만든다. 제자리에 두고 빨간 글씨로
 * 무엇인지 밝히는 쪽이 실수로 들어갈 확률이 낮다 (확인 절차는 WithdrawConfirmSheet가 맡는다).
 */
export function MyPage({
    nickname,
    profileImageUrl,
    equippedBadge,
    onChangePhoto,
    onEditNickname,
    onOpenBadges,
    onOpenWritten,
    onOpenLikes,
    onOpenFriends,
    onOpenNotifications,
    unreadNotificationCount = 0,
    onLogout,
    onWithdraw,
    onTab,
    isAdmin,
    onOpenAdmin,
}: Props) {
    return (
        <div className="flex h-full flex-col bg-surface-app">
            <header className="flex items-center px-5 py-4">
                <h1 className="font-display text-xl text-content-primary">마이페이지</h1>
            </header>
            <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-8">
                <div className="flex w-full items-center gap-4">
                    <button
                        onClick={onChangePhoto}
                        aria-label="프로필 사진 변경"
                        className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-watermelon-200 font-display text-2xl text-watermelon-700"
                    >
                        {profileImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={profileImageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <span>{nickname.charAt(0) || '?'}</span>
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white opacity-0 transition group-active:opacity-100">
                            <CameraIcon size={19} />
                        </span>
                    </button>
                    <div className="min-w-0 text-left">
                        {/* gap-1 — 뱃지는 닉네임에 딸린 표식이라 붙어 있어야 "내 뱃지"로 읽힌다 */}
                        <span className="flex items-center gap-1">
                            {equippedBadge && (
                                <ServerBadge
                                    code={equippedBadge.code}
                                    imageUrl={equippedBadge.imageUrl}
                                    name={equippedBadge.name}
                                    size={50}
                                />
                            )}
                            <span className="font-display text-2xl text-content-primary">{nickname}</span>
                        </span>
                        <span className="block text-sm text-content-secondary">먹을수록 채워지는 나의 도감</span>
                    </div>
                </div>

                <button
                    onClick={onOpenBadges}
                    className="mt-4 w-full rounded-2xl bg-surface-card p-4 text-left shadow-card"
                >
                    <div className="flex items-center gap-2">
                        <AwardIcon size={18} aria-hidden className="text-watermelon-500" />
                        <span className="font-medium text-content-primary">뱃지</span>
                        <ChevronRightIcon size={16} aria-hidden className="ml-auto text-content-muted" />
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-watermelon-50">
                            {equippedBadge ? (
                                // 40px 칸 안이라 32 — size가 높이라서 50이면 칸을 넘친다
                                <ServerBadge
                                    code={equippedBadge.code}
                                    imageUrl={equippedBadge.imageUrl}
                                    name={equippedBadge.name}
                                    size={32}
                                />
                            ) : (
                                <AwardIcon size={20} aria-hidden className="text-content-muted" />
                            )}
                        </span>
                        <span className="text-sm text-content-secondary">
                            {equippedBadge ? `대표 뱃지 · ${equippedBadge.name}` : '대표 뱃지 없음'}
                        </span>
                    </div>
                </button>

                <MenuGroup title="내 활동">
                    {/*
                     * 두 항목 모두 안에서 「챌린짓 / 로그잇」 탭으로 갈린다. 그래서 이름을
                     * 「…리뷰」가 아니라 「…글」로 넓게 잡았다 — 챌린짓 리뷰와 로그잇 댓글이
                     * 함께 담기므로 좁은 이름은 한쪽을 빠뜨린 것처럼 보인다.
                     * 별도로 있던 「내가 쓴 댓글」(comingSoon)은 「내가 쓴 글」의 로그잇 탭이 되었다.
                     * 로그잇 댓글 좋아요는 아직 담지 않았다 — MyLikes 주석 참고
                     */}
                    <MenuItem icon={<StarIcon size={18} aria-hidden />} label="내가 쓴 글" onClick={onOpenWritten} />
                    <MenuItem icon={<HeartIcon size={18} aria-hidden />} label="좋아요한 글" onClick={onOpenLikes} />
                </MenuGroup>

                <MenuGroup title="소셜">
                    <MenuItem icon={<UsersIcon size={18} aria-hidden />} label="친구" onClick={onOpenFriends} />
                    <MenuItem
                        icon={<BellIcon size={18} aria-hidden />}
                        label="알림"
                        count={unreadNotificationCount}
                        onClick={onOpenNotifications}
                    />
                </MenuGroup>

                {isAdmin && (
                    <MenuGroup title="시스템 관리">
                        <MenuItem
                            icon={<ShieldIcon size={18} aria-hidden />}
                            label="관리자 페이지"
                            onClick={onOpenAdmin}
                        />
                    </MenuGroup>
                )}

                <MenuGroup title="내 계정 관리">
                    <MenuItem
                        icon={<PencilIcon size={18} aria-hidden />}
                        label="닉네임 수정"
                        hint="1개월에 1회 가능"
                        onClick={onEditNickname}
                    />
                    <MenuItem icon={<LogOutIcon size={18} aria-hidden />} label="로그아웃" onClick={onLogout} />
                    <MenuItem
                        icon={<UserMinusIcon size={18} aria-hidden />}
                        label="회원 탈퇴"
                        onClick={onWithdraw}
                        danger
                    />
                </MenuGroup>
            </main>
            <BottomNav active="마이" onTab={onTab} />
        </div>
    )
}

/** 대주제 하나 + 그 아래 목록 한 상자 */
function MenuGroup({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="mt-6" aria-label={title}>
            <h2 className="px-1 pb-2 text-sm font-bold text-content-secondary">{title}</h2>
            <div className="overflow-hidden rounded-2xl bg-surface-card shadow-card">{children}</div>
        </section>
    )
}

function MenuItem({
    icon,
    label,
    hint,
    count,
    onClick,
    danger = false,
    /**
     * 아직 만들지 않은 항목. **자리를 미리 보여 준다.**
     * 목록에서 통째로 빼면 나중에 생겼을 때 어디에 붙을지 사용자가 다시 익혀야 한다 —
     * 자리를 잡아 두고 "준비 중"이라고 말해 두는 편이 낫다. 눌리지 않으므로 헛걸음도 없다
     */
    comingSoon = false,
}: {
    icon: React.ReactNode
    label: string
    hint?: string
    count?: number
    onClick?: () => void
    danger?: boolean
    comingSoon?: boolean
}) {
    const tone = danger ? 'text-feedback-error' : comingSoon ? 'text-content-muted' : 'text-content-primary'
    return (
        <button
            type="button"
            onClick={comingSoon ? undefined : onClick}
            disabled={comingSoon}
            className="flex min-h-touch w-full items-center gap-3 border-b border-neutral-50 px-4 py-3 text-left last:border-0 disabled:cursor-default"
        >
            <span aria-hidden className={`shrink-0 ${tone}`}>
                {icon}
            </span>
            <span className={`flex-1 text-sm font-medium ${tone}`}>{label}</span>
            {comingSoon ? (
                <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-content-muted">
                    준비 중
                </span>
            ) : (
                <>
                    {typeof count === 'number' && count > 0 && (
                        <span
                            aria-label={`안 읽은 알림 ${count > 99 ? '99개 이상' : `${count}개`}`}
                            className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-watermelon-500 px-1.5 text-xs font-bold leading-none text-white"
                        >
                            {count > 99 ? '99+' : count}
                        </span>
                    )}
                    {hint && <span className="shrink-0 text-xs text-content-secondary">{hint}</span>}
                    <ChevronRightIcon size={16} aria-hidden className="shrink-0 text-content-muted" />
                </>
            )}
        </button>
    )
}
