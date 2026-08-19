'use client'

import { ImageCropper, ImageCropperHandle } from '@/shared/ui'
import { ArrowLeftIcon, ImageIcon } from 'lucide-react'
import { useRef, useState } from 'react'

interface Props {
    nickname: string
    currentImageUrl: string | null
    submitting: boolean
    error: string | null
    /** 크롭된 정사각 이미지(Blob) 업로드 */
    onSubmit: (blob: Blob) => void
    /** 사진 제거 → 닉네임 첫 글자로 */
    onRemove: () => void
    onBack: () => void
}

const V = 256 // 크롭 뷰포트 한 변(px)

/** 프로필 사진 변경 — 이미지를 골라 원형으로 위치 조정 후 등록, 없으면 닉네임 첫 글자 */
export function ProfilePhotoChange({
    nickname,
    currentImageUrl,
    submitting,
    error,
    onSubmit,
    onRemove,
    onBack,
}: Props) {
    const [src, setSrc] = useState<string | null>(null)
    const cropper = useRef<ImageCropperHandle>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    const letter = nickname.trim().charAt(0) || '?'

    const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setSrc(URL.createObjectURL(file))
        e.target.value = '' // 같은 파일 재선택 허용
    }

    const apply = async () => {
        if (submitting) return
        const blob = await cropper.current?.crop()
        if (blob) onSubmit(blob)
    }

    return (
        <div className="flex h-full flex-col bg-surface-app">
            <header className="flex items-center gap-3 px-5 py-4">
                <button onClick={onBack} aria-label="뒤로가기">
                    <ArrowLeftIcon size={21} className="text-neutral-900" />
                </button>
                <h1 className="font-display text-xl text-neutral-900">프로필 사진</h1>
            </header>

            <main className="flex flex-1 flex-col items-center px-6 pt-4">
                {src ? (
                    <ImageCropper ref={cropper} src={src} size={V} />
                ) : (
                    // 선택 전: 현재 프로필 미리보기
                    <div className="flex h-64 w-64 items-center justify-center overflow-hidden rounded-full bg-watermelon-100">
                        {currentImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={currentImageUrl} alt="현재 프로필" className="h-full w-full object-cover" />
                        ) : (
                            <span className="font-display text-6xl text-watermelon-700">{letter}</span>
                        )}
                    </div>
                )}

                {error && <p className="mt-3 text-sm text-watermelon-600">{error}</p>}
                {/* 숨은 파일 입력 */}
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/heic,image/heif"
                    onChange={pickFile}
                    className="hidden"
                />
            </main>

            <div className="space-y-3 px-6 pb-10">
                {src ? (
                    <button
                        onClick={apply}
                        disabled={submitting}
                        className="h-cta w-full rounded-full bg-watermelon-500 font-display text-lg text-white shadow-card transition active:scale-[0.98] disabled:bg-neutral-200 disabled:text-neutral-400"
                    >
                        {submitting ? '저장 중…' : '이 사진으로 등록'}
                    </button>
                ) : (
                    <button
                        onClick={() => fileRef.current?.click()}
                        disabled={submitting}
                        className="flex h-cta w-full items-center justify-center gap-2 rounded-full bg-watermelon-500 font-display text-lg text-white shadow-card transition active:scale-[0.98] disabled:opacity-60"
                    >
                        <ImageIcon size={20} /> 앨범에서 선택
                    </button>
                )}

                {!src && currentImageUrl && (
                    <button
                        onClick={onRemove}
                        disabled={submitting}
                        className="min-h-touch w-full text-center text-sm text-neutral-800 disabled:opacity-60"
                    >
                        기본 이미지로 변경
                    </button>
                )}
                {src && (
                    <button
                        onClick={() => fileRef.current?.click()}
                        disabled={submitting}
                        className="min-h-touch w-full text-center text-sm text-neutral-800 disabled:opacity-60"
                    >
                        다른 사진 선택
                    </button>
                )}
            </div>
        </div>
    )
}
