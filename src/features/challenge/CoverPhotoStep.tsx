'use client'

import { ImageCropper, ImageCropperHandle } from '@/shared/ui'
import { ImageIcon } from 'lucide-react'
import { useRef, useState } from 'react'

const V = 240 // 원형 크롭 뷰포트 한 변(px)

interface Props {
    /** 이미 적용된 대표 사진 미리보기(있으면) */
    preview: string
    /** 크롭 완료된 정사각 이미지(Blob)와 미리보기 URL */
    onApply: (blob: Blob, previewUrl: string) => void
    /** 사진 제거 */
    onClear: () => void
}

/** 챌린지 대표 사진 — 원형으로 위치·확대 조절 후 등록 (공통 `ImageCropper`) */
export function CoverPhotoStep({ preview, onApply, onClear }: Props) {
    const [src, setSrc] = useState<string | null>(null)
    const cropper = useRef<ImageCropperHandle>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setSrc(URL.createObjectURL(file))
        e.target.value = '' // 같은 파일 재선택 허용
    }

    const apply = async () => {
        const blob = await cropper.current?.crop()
        if (!blob) return
        onApply(blob, URL.createObjectURL(blob))
        setSrc(null)
    }

    return (
        <div>
            <p className="text-sm font-bold text-watermelon-500">대표 사진</p>
            <h1 className="mt-1 font-display text-2xl leading-snug text-neutral-900">챌린짓 대표 사진을 골라요</h1>
            <p className="mt-2 text-sm text-neutral-400">
                선택 사항이에요. 드래그로 위치, 슬라이더로 확대를 조절할 수 있어요.
            </p>

            <div className="mt-6 flex flex-col items-center">
                {src ? (
                    // 크롭 모드
                    <>
                        <ImageCropper ref={cropper} src={src} size={V} />
                        <div className="mt-4 flex w-full max-w-xs gap-2">
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="flex-1 rounded-full bg-neutral-100 py-2.5 text-sm font-bold text-neutral-800"
                            >
                                다른 사진
                            </button>
                            <button
                                type="button"
                                onClick={apply}
                                className="flex-1 rounded-full bg-watermelon-500 py-2.5 text-sm font-bold text-content-on-action"
                            >
                                이 사진 사용
                            </button>
                        </div>
                    </>
                ) : preview ? (
                    // 적용된 미리보기
                    <>
                        <div className="h-60 w-60 overflow-hidden rounded-full bg-neutral-100 shadow-inner">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={preview} alt="대표 사진 미리보기" className="h-full w-full object-cover" />
                        </div>
                        <div className="mt-4 flex w-full max-w-xs gap-2">
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="flex-1 rounded-full bg-neutral-100 py-2.5 text-sm font-bold text-neutral-800"
                            >
                                다른 사진
                            </button>
                            <button
                                type="button"
                                onClick={onClear}
                                className="flex-1 rounded-full bg-neutral-100 py-2.5 text-sm font-bold text-neutral-500"
                            >
                                제거
                            </button>
                        </div>
                    </>
                ) : (
                    // 선택 전 플레이스홀더
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex h-60 w-60 flex-col items-center justify-center gap-2 rounded-full border-2 border-dashed border-neutral-200 bg-neutral-50 text-neutral-400"
                    >
                        <ImageIcon size={30} aria-hidden />
                        <span className="text-sm font-medium">앨범에서 선택</span>
                    </button>
                )}
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/heic,image/heif"
                    onChange={pickFile}
                    className="hidden"
                />
            </div>
        </div>
    )
}
