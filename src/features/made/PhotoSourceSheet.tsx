import React, { useEffect, useRef, useState } from 'react'
import { CameraIcon, ImageIcon } from 'lucide-react'
import { BottomSheet } from '@/shared/ui'
import { PHOTO_INPUT_ACCEPT } from '@/shared/lib/upload'

interface Props {
    onPick: (files: File[]) => void
    onClose: () => void
}

/** 찍는 게 먼저고 적는 건 나중이다. 기록은 사진을 고르는 데서 시작한다 */
export function PhotoSourceSheet({ onPick, onClose }: Props) {
    const cameraRef = useRef<HTMLInputElement>(null)
    const albumRef = useRef<HTMLInputElement>(null)
    const [touchDevice, setTouchDevice] = useState(false)

    // 데스크톱에는 촬영을 내밀지 않는다. SSR에서는 알 수 없어 마운트 후 판별한다
    useEffect(() => {
        setTouchDevice(window.matchMedia('(pointer: coarse)').matches)
    }, [])

    const handle = (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return
        onPick(Array.from(fileList))
        onClose()
    }

    return (
        <BottomSheet title="사진 올리기" onClose={onClose}>
            <div className="px-5 pb-8 pt-4">
                <input
                    ref={cameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(event) => {
                        handle(event.target.files)
                        event.target.value = '' // 같은 파일을 다시 골라도 change가 뜨도록
                    }}
                />
                <input
                    ref={albumRef}
                    type="file"
                    accept={PHOTO_INPUT_ACCEPT}
                    multiple
                    className="hidden"
                    onChange={(event) => {
                        handle(event.target.files)
                        event.target.value = ''
                    }}
                />

                {touchDevice && (
                    <button
                        type="button"
                        onClick={() => cameraRef.current?.click()}
                        className="flex min-h-touch w-full items-center gap-3 rounded-2xl bg-neutral-50 px-4 py-3 text-left"
                    >
                        <CameraIcon size={20} aria-hidden className="text-content-link" />
                        <span className="text-sm font-bold text-content-primary">사진 찍기</span>
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => albumRef.current?.click()}
                    className="mt-2 flex min-h-touch w-full items-center gap-3 rounded-2xl bg-neutral-50 px-4 py-3 text-left"
                >
                    <ImageIcon size={20} aria-hidden className="text-content-link" />
                    <span className="text-sm font-bold text-content-primary">앨범에서 선택</span>
                </button>
            </div>
        </BottomSheet>
    )
}
