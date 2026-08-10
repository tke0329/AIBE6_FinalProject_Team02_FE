import React, { useEffect, useRef, useState } from 'react'
import { CameraIcon, GlobeIcon, LockIcon } from 'lucide-react'

import { MADE_DEX_DESCRIPTION_MAX, MADE_DEX_NAME_MAX } from './api'
import { DEFAULT_MADE_DEX_COVER, MadeDexVisibility } from './types'

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

export function MadeDexCoverPicker({ preview, onPick, onClear }: CoverPickerProps) {
    const filePicker = useRef<HTMLInputElement>(null)
    const open = () => filePicker.current?.click()

    return (
        <>
            <p className="text-sm font-bold text-content-primary">
                표지 이미지
                <span className="ml-1 font-medium text-content-muted">(선택)</span>
            </p>

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
                        className="h-32 w-32 rounded-full bg-cream-200 object-cover"
                    />
                    <span
                        aria-hidden
                        className="absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center rounded-full bg-content-primary text-cream-50 ring-4 ring-cream-100"
                    >
                        <CameraIcon size={19} />
                    </span>
                </button>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={open}
                        className="min-h-touch rounded-full bg-cream-200 px-4 text-sm font-bold text-content-primary"
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

            <input
                ref={filePicker}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) onPick(file)
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
                className="mt-2 w-full rounded-2xl bg-surface-card px-4 py-4 text-sm shadow-card outline-none focus:ring-2 focus:ring-orange-400"
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
                className="mt-2 w-full resize-none rounded-2xl bg-surface-card px-4 py-4 text-sm shadow-card outline-none focus:ring-2 focus:ring-orange-400"
            />
            <p className="mt-1 text-right text-xs text-content-muted">
                {description.length}/{MADE_DEX_DESCRIPTION_MAX}
            </p>
        </>
    )
}

const VISIBILITY_OPTIONS: Array<{
    value: MadeDexVisibility
    label: string
    description: string
    Icon: typeof LockIcon
}> = [
    {
        value: 'PRIVATE',
        label: '비공개 도감',
        description: '초대 코드를 받은 사람만 열람하고 참여할 수 있어요',
        Icon: LockIcon,
    },
    {
        value: 'PUBLIC',
        label: '공개 도감',
        description: '누구나 열람할 수 있어요. 참여는 초대 코드로만 가능해요',
        Icon: GlobeIcon,
    },
]

interface VisibilityPickerProps {
    visibility: MadeDexVisibility
    onChange: (visibility: MadeDexVisibility) => void
}

export function MadeDexVisibilityPicker({ visibility, onChange }: VisibilityPickerProps) {
    return (
        <div className="space-y-3">
            {VISIBILITY_OPTIONS.map(({ value, label, description, Icon }) => (
                <button
                    key={value}
                    type="button"
                    aria-pressed={visibility === value}
                    onClick={() => onChange(value)}
                    className={`flex w-full items-center gap-4 rounded-2xl p-4 text-left shadow-card ${
                        visibility === value ? 'bg-surface-accent ring-2 ring-orange-400' : 'bg-surface-card'
                    }`}
                >
                    <span className="min-w-0 flex-1">
                        <span className="block font-display text-lg text-content-primary">{label}</span>
                        <span className="mt-1 block text-xs leading-4 text-content-secondary">{description}</span>
                    </span>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cream-200">
                        <Icon size={22} aria-hidden className="text-content-secondary" />
                    </span>
                </button>
            ))}
        </div>
    )
}
