import React, { useEffect, useRef, useState } from 'react'
import { CameraIcon } from 'lucide-react'
import { Button, ImageCropper, ImageCropperHandle } from '@/shared/ui'

import { MADE_DEX_DESCRIPTION_MAX, MADE_DEX_NAME_MAX } from './api'
import { DEFAULT_MADE_DEX_COVER } from './types'

/** 이미 올라가 있는 표지. 그대로 두면 key를 되돌려 보내고, 보여줄 땐 url을 쓴다 */
export interface ExistingCover {
    key: string
    url: string
}

/** 새로 고른 파일이거나, 기존 표지 그대로거나, 없거나 */
export type CoverImage = File | ExistingCover | null

/** 파일일 때만 미리보기 URL을 새로 만들고, 바뀌거나 떠날 때 놓아준다 */
export function useCoverPreview(image: CoverImage): string | null {
    const [preview, setPreview] = useState<string | null>(null)

    useEffect(() => {
        if (!image) {
            setPreview(null)
            return
        }
        if (!(image instanceof File)) {
            setPreview(image.url)
            return
        }
        const url = URL.createObjectURL(image)
        setPreview(url)
        return () => URL.revokeObjectURL(url)
    }, [image])

    return preview
}

interface CoverPickerProps {
    preview: string | null
    onPick: (file: File) => void
    onClear: () => void
}

/**
 * 표지 고르기.
 *
 * 고른 사진을 **바로 쓰지 않고 자르기 창을 거친다.** 표지는 목록에서 원형으로 잘려
 * 보이는데, 예전에는 파일을 그대로 올려서 가로·세로가 다른 사진은 가운데만 남았다 —
 * 보여 주고 싶은 부분이 잘려도 손쓸 방법이 없었다. 프로필·챌린짓 대표 사진과 같은
 * 창(`ImageCropper`)을 쓴다.
 *
 * 밖으로 나가는 값은 여전히 `File`이라 부르는 쪽 코드는 그대로다.
 */
export function MadeDexCoverPicker({ preview, onPick, onClear }: CoverPickerProps) {
    const filePicker = useRef<HTMLInputElement>(null)
    const cropper = useRef<ImageCropperHandle>(null)
    const [picked, setPicked] = useState<string | null>(null)
    const open = () => filePicker.current?.click()

    const applyCrop = async () => {
        const blob = await cropper.current?.crop()
        if (!blob) return
        onPick(new File([blob], 'cover.jpg', { type: blob.type }))
        setPicked(null)
    }

    return (
        <>
            <p className="text-sm font-bold text-content-primary">
                표지 이미지
                <span className="ml-1 font-medium text-content-muted">(선택)</span>
            </p>

            {picked ? (
                <div className="mt-3">
                    <ImageCropper ref={cropper} src={picked} size={216} />
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button variant="secondary" size="md" onClick={() => setPicked(null)}>
                            취소
                        </Button>
                        <Button size="md" onClick={applyCrop}>
                            이 사진 사용
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="mt-3 flex flex-col items-center gap-3">
                    {/* 사진 자체가 버튼이다. 작은 아이콘만 노리게 하면 누르기 어렵다 */}
                    <button
                        type="button"
                        onClick={open}
                        aria-label={preview ? '표지 이미지 바꾸기' : '표지 이미지 고르기'}
                        className="relative rounded-full"
                    >
                        {/* blob: 이거나 presigned URL이라 next/image로 최적화할 대상이 아니다 */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={preview ?? DEFAULT_MADE_DEX_COVER}
                            alt=""
                            className="h-32 w-32 rounded-full bg-neutral-100 object-cover"
                        />
                        <span
                            aria-hidden
                            className="absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center rounded-full bg-content-primary text-white ring-4 ring-neutral-50"
                        >
                            <CameraIcon size={19} />
                        </span>
                    </button>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={open}
                            className="min-h-touch rounded-full bg-neutral-100 px-4 text-sm font-bold text-content-primary"
                        >
                            사진 {preview ? '바꾸기' : '고르기'}
                        </button>
                        {/* 기본 이미지가 있으니 "지우기"가 아니라 "되돌리기"다 */}
                        {preview && (
                            <button
                                type="button"
                                onClick={onClear}
                                className="min-h-touch rounded-full px-4 text-sm font-bold text-content-secondary underline"
                            >
                                기본 이미지로
                            </button>
                        )}
                    </div>
                </div>
            )}

            <input
                ref={filePicker}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) setPicked(URL.createObjectURL(file))
                    // 같은 파일을 다시 골라도 change가 뜨도록 비운다
                    event.target.value = ''
                }}
            />
        </>
    )
}

interface BasicFieldsProps {
    name: string
    description: string
    onNameChange: (name: string) => void
    onDescriptionChange: (description: string) => void
}

export function MadeDexBasicFields({ name, description, onNameChange, onDescriptionChange }: BasicFieldsProps) {
    return (
        <>
            <label htmlFor="made-dex-name" className="block text-sm font-bold text-content-primary">
                도감 이름
            </label>
            <input
                id="made-dex-name"
                value={name}
                maxLength={MADE_DEX_NAME_MAX}
                placeholder="예: 우리 동네 맛집 도감"
                onChange={(event) => onNameChange(event.target.value)}
                className="mt-2 w-full rounded-2xl bg-surface-card px-4 py-4 text-sm shadow-card outline-none focus:ring-2 focus:ring-watermelon-400"
            />

            <label htmlFor="made-dex-description" className="mt-6 block text-sm font-bold text-content-primary">
                소개말
                <span className="ml-1 font-medium text-content-muted">(선택)</span>
            </label>
            <textarea
                id="made-dex-description"
                value={description}
                maxLength={MADE_DEX_DESCRIPTION_MAX}
                rows={4}
                placeholder="어떤 도감인지 알려주면 참여자가 이해하기 쉬워요"
                onChange={(event) => onDescriptionChange(event.target.value)}
                className="mt-2 w-full resize-none rounded-2xl bg-surface-card px-4 py-4 text-sm shadow-card outline-none focus:ring-2 focus:ring-watermelon-400"
            />
            <p className="mt-1 text-right text-xs text-content-muted">
                {description.length}/{MADE_DEX_DESCRIPTION_MAX}
            </p>
        </>
    )
}
