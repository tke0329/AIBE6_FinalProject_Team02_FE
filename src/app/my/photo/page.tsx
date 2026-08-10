'use client'

import { useAuth } from '@/features/auth/AuthContext'
import { getMyProfile, patchProfileImage, removeProfileImage } from '@/features/my/api'
import { ProfilePhotoChange } from '@/features/my/ProfilePhotoChange'
import { ROUTES } from '@/shared/lib/routes'
import { uploadImageToS3 } from '@/shared/lib/upload'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

/** `/my/photo` 프로필 사진 변경 (원형 크롭 + S3 업로드) */
export default function ProfilePhotoPage() {
    const router = useRouter()
    const { me } = useAuth()
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        getMyProfile()
            .then((p) => setCurrentImageUrl(p.profileImageUrl))
            .catch(() => setCurrentImageUrl(null))
    }, [])

    const handleSubmit = async (blob: Blob) => {
        setSubmitting(true)
        setError(null)
        try {
            const { key } = await uploadImageToS3(blob, 'profile.jpg') // S3 직접 업로드
            await patchProfileImage(key) // key만 서버에 저장
            router.push(ROUTES.my)
        } catch (e) {
            setError(e instanceof Error ? e.message : '문제가 발생했어요. 다시 시도해 주세요.')
            setSubmitting(false)
        }
    }

    const handleRemove = async () => {
        setSubmitting(true)
        setError(null)
        try {
            await removeProfileImage()
            router.push(ROUTES.my)
        } catch (e) {
            setError(e instanceof Error ? e.message : '문제가 발생했어요. 다시 시도해 주세요.')
            setSubmitting(false)
        }
    }

    return (
        <ProfilePhotoChange
            nickname={me?.nickname ?? ''}
            currentImageUrl={currentImageUrl}
            submitting={submitting}
            error={error}
            onSubmit={handleSubmit}
            onRemove={handleRemove}
            onBack={() => router.push(ROUTES.my)}
        />
    )
}
