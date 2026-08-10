'use client'

import { useAuth } from '@/features/auth/AuthContext'
import { getMyProfile, patchNickname, type MyProfile } from '@/features/my/api'
import { NicknameEdit } from '@/features/my/NicknameEdit'
import { ROUTES } from '@/shared/lib/routes'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * `/my/nickname` 닉네임 변경 (1개월 1회)
 * 진입 시 프로필을 불러와 변경 가능 여부/가능일을 표시하고,
 * 변경 성공하면 refresh()로 me를 갱신한 뒤 마이페이지로 돌아간다.
 */
export default function NicknameEditPage() {
    const router = useRouter()
    const { refresh } = useAuth()
    const [profile, setProfile] = useState<MyProfile | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        getMyProfile()
            .then(setProfile)
            .catch(() => setProfile(null))
    }, [])

    const handleSubmit = async (nickname: string) => {
        setSubmitting(true)
        setError(null)
        try {
            await patchNickname(nickname)
            await refresh() // me.nickname 갱신 → 마이페이지 표시 반영
            router.replace(ROUTES.my)
        } catch (e) {
            setError(e instanceof Error ? e.message : '문제가 발생했어요. 다시 시도해 주세요.')
            setSubmitting(false)
        }
    }

    if (!profile) {
        return (
            <div className="flex h-full items-center justify-center bg-cream-100">
                <p className="text-sm text-brown-soft">불러오는 중…</p>
            </div>
        )
    }

    return (
        <NicknameEdit
            currentNickname={profile.nickname}
            changeable={profile.nicknameChangeable}
            changeableAt={profile.nicknameChangeableAt}
            submitting={submitting}
            error={error}
            onSubmit={handleSubmit}
            onBack={() => router.back()}
        />
    )
}
