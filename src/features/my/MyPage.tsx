import { ServerBadge } from '@/shared/ui/atoms/ServerBadge'
import { BottomNav, NavTab } from '@/shared/ui/molecules/BottomNav'
import { AwardIcon, BookOpenIcon, CameraIcon, ChevronRightIcon, LogOutIcon, PencilIcon, UsersIcon } from 'lucide-react'
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
    onReplayOnboarding: () => void
    onOpenBadges: () => void
    onOpenFriends: () => void
    onLogout: () => void
    onWithdraw: () => void
    onTab: (tab: NavTab) => void
}

export function MyPage({
    nickname,
    profileImageUrl,
    equippedBadge,
    onChangePhoto,
    onEditNickname,
    onReplayOnboarding,
    onOpenBadges,
    onOpenFriends,
    onLogout,
    onWithdraw,
    onTab,
}: Props) {
    return (
        <div className="flex h-full flex-col bg-cream-100">
            <header className="flex items-center px-5 py-4">
                <h1 className="font-display text-xl text-brown">마이페이지</h1>
            </header>
            <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6">
                <div className="flex w-full items-center gap-4">
                    <button
                        onClick={onChangePhoto}
                        aria-label="프로필 사진 변경"
                        className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-200 font-display text-2xl text-orange-700"
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
                        <span className="flex items-center gap-2">
                            {equippedBadge && (
                                <ServerBadge
                                    code={equippedBadge.code}
                                    imageUrl={equippedBadge.imageUrl}
                                    name={equippedBadge.name}
                                    size={50}
                                />
                            )}
                            <span className="font-display text-2xl text-brown">{nickname}</span>
                        </span>
                        <span className="block text-sm text-brown-soft">먹을수록 채워지는 나의 도감</span>
                    </div>
                </div>
                <button onClick={onOpenBadges} className="mt-4 w-full rounded-2xl bg-white p-4 text-left shadow-soft">
                    <div className="flex items-center gap-2">
                        <AwardIcon size={18} className="text-orange-500" />
                        <span className="font-medium text-brown">뱃지</span>
                        <ChevronRightIcon size={16} className="ml-auto text-brown-muted" />
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                            {equippedBadge ? (
                                <ServerBadge
                                    code={equippedBadge.code}
                                    imageUrl={equippedBadge.imageUrl}
                                    name={equippedBadge.name}
                                    size={50}
                                />
                            ) : (
                                <AwardIcon size={20} className="text-brown-muted" />
                            )}
                        </span>
                        <span className="text-sm text-brown-soft">
                            {equippedBadge ? `대표 뱃지 · ${equippedBadge.name}` : '대표 뱃지 없음'}
                        </span>
                    </div>
                </button>
                <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-soft">
                    <MenuItem
                        onClick={onOpenFriends}
                        icon={<UsersIcon size={18} className="text-brown-soft" />}
                        label="친구"
                    />
                    <MenuItem
                        onClick={onReplayOnboarding}
                        icon={<BookOpenIcon size={18} className="text-brown-soft" />}
                        label="튜토리얼 다시 보기"
                    />
                    <MenuItem
                        onClick={onEditNickname}
                        icon={<PencilIcon size={18} className="text-brown-soft" />}
                        label="닉네임 수정"
                        hint="1개월에 1회 가능"
                    />
                    <MenuItem
                        onClick={onLogout}
                        icon={<LogOutIcon size={18} className="text-brown-soft" />}
                        label="로그아웃"
                    />
                </div>
                <button onClick={onWithdraw} className="mt-6 min-h-touch w-full text-center text-xs text-brown-soft">
                    회원 탈퇴
                </button>
            </main>
            <BottomNav active="마이" onTab={onTab} />
        </div>
    )
}
function MenuItem({
    icon,
    label,
    hint,
    onClick,
}: {
    icon: React.ReactNode
    label: string
    hint?: string
    onClick?: () => void
}) {
    return (
        <button
            onClick={onClick}
            className="flex min-h-touch w-full items-center gap-3 border-b border-cream-100 px-4 py-3 text-left last:border-0"
        >
            {icon}
            <span className="flex-1 text-sm font-medium text-brown">{label}</span>
            {hint && <span className="text-xs text-brown-soft">{hint}</span>}
            <ChevronRightIcon size={16} className="text-brown-muted" />
        </button>
    )
}
