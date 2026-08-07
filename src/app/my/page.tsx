'use client'

import { useAuth } from '@/features/auth/AuthContext'
import { getMyBadges, getMyProfile, withdrawAccount } from '@/features/my/api'
import { MyPage } from '@/features/my/MyPage'
import { WithdrawConfirmSheet } from '@/features/my/WithdrawConfirmSheet'
import { getTabHref, ROUTES } from '@/shared/lib/routes'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

/** `/my` 마이페이지 */
export default function MyPageRoute() {
    const router = useRouter()
    const { me, logout } = useAuth()

    // 프로필 사진(표시용 URL) — 없으면 MyPage가 닉네임 첫 글자로 대체
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
    // 대표(장착) 뱃지 — 서버 획득 목록에서 equipped 항목을 찾아 표시
    const [equippedBadge, setEquippedBadge] = useState<{
        name: string
        code: string | null
        imageUrl: string | null
    } | null>(null)

    const [confirmOpen, setConfirmOpen] = useState(false)
    const [withdrawing, setWithdrawing] = useState(false)
    const [withdrawError, setWithdrawError] = useState<string | null>(null)

    useEffect(() => {
        getMyProfile()
            .then((p) => setProfileImageUrl(p.profileImageUrl))
            .catch(() => setProfileImageUrl(null))
        getMyBadges()
            .then((list) => {
                const eq = list.find((b) => b.equipped)
                setEquippedBadge(eq ? { name: eq.name, code: eq.code, imageUrl: eq.imageUrl } : null)
            })
            .catch(() => setEquippedBadge(null))
    }, [])

    const handleLogout = async () => {
        await logout()
        router.replace(ROUTES.login)
    }

    const handleWithdraw = async () => {
        setWithdrawing(true)
        setWithdrawError(null)
        try {
            await withdrawAccount()
            await logout() // 세션(쿠키·refresh) 정리
            router.replace(ROUTES.login)
        } catch (e) {
            setWithdrawError(e instanceof Error ? e.message : '문제가 발생했어요. 다시 시도해 주세요.')
            setWithdrawing(false)
        }
    }

    return (
        <>
            <MyPage
                nickname={me?.nickname ?? ''}
                profileImageUrl={profileImageUrl}
                equippedBadge={equippedBadge}
                onChangePhoto={() => router.push(ROUTES.myPhoto)}
                onEditNickname={() => router.push(ROUTES.myNickname)}
                onReplayOnboarding={() => router.push(`${ROUTES.onboarding}?from=my`)}
                onOpenBadges={() => router.push(ROUTES.myBadges)}
                onOpenFriends={() => router.push(ROUTES.friends)}
                onLogout={handleLogout}
                onWithdraw={() => setConfirmOpen(true)}
                onTab={(tab) => router.push(getTabHref(tab))}
            />
            {confirmOpen && (
                <WithdrawConfirmSheet
                    pending={withdrawing}
                    error={withdrawError}
                    onConfirm={handleWithdraw}
                    onClose={() => !withdrawing && setConfirmOpen(false)}
                />
            )}
        </>
    )
}
