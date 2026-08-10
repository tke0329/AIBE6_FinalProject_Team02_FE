'use client'

import {
    AlertCircleIcon,
    CameraIcon,
    CheckIcon,
    ImageIcon,
    Loader2Icon,
    RotateCwIcon,
    UploadCloudIcon,
    XIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { RegisterPhoto, useRegisterFlow } from './RegisterFlowContext'
import { MAX_PHOTOS, PHOTO_INPUT_ACCEPT } from './uploadApi'

/**
 * 사진 업로드 (등록 건당 1~5장, JPG/PNG/HEIC, 장당 10MB).
 *
 * 고르는 즉시 S3로 올린다. "다음"에서 한꺼번에 올리면 사용자가 결과를 늦게 알게 되고,
 * 실패했을 때 되돌아갈 지점도 사라진다.
 */
export function PhotoUploader() {
    const { photos, addPhotos, removePhoto, retryPhoto, photoError, analysisPhoto, setAnalysisPhotoId } =
        useRegisterFlow()

    const cameraInputRef = useRef<HTMLInputElement>(null)
    const albumInputRef = useRef<HTMLInputElement>(null)
    const [dragging, setDragging] = useState(false)
    const [touchDevice, setTouchDevice] = useState(false)

    // 데스크톱은 카메라 촬영을 제공하지 않는다.
    // SSR에서는 알 수 없으므로 마운트 후 판별한다 — 초기 렌더는 데스크톱 기준.
    useEffect(() => {
        setTouchDevice(window.matchMedia('(pointer: coarse)').matches)
    }, [])

    const pick = (input: HTMLInputElement | null) => input?.click()

    const handleFiles = (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return
        addPhotos(Array.from(fileList))
    }

    const full = photos.length >= MAX_PHOTOS

    return (
        <section aria-label="음식 사진 올리기">
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => {
                    handleFiles(event.target.files)
                    event.target.value = '' // 같은 파일을 다시 골라도 change가 뜨도록
                }}
            />

            <input
                ref={albumInputRef}
                type="file"
                accept={PHOTO_INPUT_ACCEPT}
                multiple
                className="hidden"
                onChange={(event) => {
                    handleFiles(event.target.files)
                    event.target.value = ''
                }}
            />

            {photos.length === 0 ? (
                <button
                    type="button"
                    onClick={() => pick(albumInputRef.current)}
                    onDragOver={(event) => {
                        event.preventDefault()
                        setDragging(true)
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(event) => {
                        event.preventDefault()
                        setDragging(false)
                        handleFiles(event.dataTransfer.files)
                    }}
                    className={`mt-5 flex aspect-[4/3] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-colors ${
                        dragging
                            ? 'border-edge-active bg-surface-accent'
                            : 'border-orange-400/60 bg-orange-50/40 text-brown-muted'
                    }`}
                >
                    <UploadCloudIcon size={44} aria-hidden className="text-orange-400" />
                    <span className="mt-2 text-sm">사진을 여기에 올려 주세요</span>
                    <span className="text-xs">한 상 사진도 수집할 수 있어요</span>
                </button>
            ) : (
                <div className="mt-5">
                    {/* 화면 끝까지 흘리지 않는다 — 첫 사진의 왼쪽이 제목·본문과 같은 선에 맞아야 한다.
              오른쪽에서 다음 사진이 잘려 보이는 것만으로 넘길 수 있다는 건 충분히 전달된다 */}
                    <div className="no-scrollbar flex snap-x gap-2.5 overflow-x-auto">
                        {photos.map((photo) => (
                            <PhotoThumb
                                key={photo.id}
                                photo={photo}
                                isAnalysis={analysisPhoto?.id === photo.id}
                                selectable={photos.length > 1}
                                onSelect={() => setAnalysisPhotoId(photo.id)}
                                onRemove={() => removePhoto(photo.id)}
                                onRetry={() => retryPhoto(photo.id)}
                            />
                        ))}
                    </div>

                    {photos.length > 1 && (
                        <p className="mt-2 text-xs text-content-secondary">
                            AI에게는 <strong className="text-content-link">분석 사진 1장</strong>만 보내요. 탭해서 분석
                            사진을 바꿀 수 있어요.
                        </p>
                    )}
                </div>
            )}

            <div className={`mt-4 grid gap-3 ${touchDevice ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {touchDevice && (
                    <button
                        type="button"
                        disabled={full}
                        onClick={() => pick(cameraInputRef.current)}
                        className="flex min-h-touch items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 font-medium text-white shadow-card active:scale-[0.98] disabled:opacity-40"
                    >
                        <CameraIcon size={18} aria-hidden />
                        촬영하기
                    </button>
                )}
                <button
                    type="button"
                    disabled={full}
                    onClick={() => pick(albumInputRef.current)}
                    className="flex min-h-touch items-center justify-center gap-2 rounded-2xl border-2 border-orange-400 py-3.5 font-medium text-orange-600 active:scale-[0.98] disabled:opacity-40"
                >
                    <ImageIcon size={18} aria-hidden />
                    {touchDevice ? '앨범에서 선택' : '사진 선택'}
                </button>
            </div>

            <p className="mt-2 text-right text-xs text-content-secondary">
                {photos.length} / {MAX_PHOTOS}장
            </p>

            {photoError && (
                <p role="alert" className="mt-1 flex items-center gap-1.5 text-xs text-feedback-error">
                    <AlertCircleIcon size={14} aria-hidden />
                    {photoError}
                </p>
            )}
        </section>
    )
}

interface ThumbProps {
    photo: RegisterPhoto
    isAnalysis: boolean
    selectable: boolean
    onSelect: () => void
    onRemove: () => void
    onRetry: () => void
}

function PhotoThumb({ photo, isAnalysis, selectable, onSelect, onRemove, onRetry }: ThumbProps) {
    // HEIC는 대부분의 브라우저가 렌더하지 못한다. 미리보기가 깨져도 업로드 자체는 유효하다.
    const [previewBroken, setPreviewBroken] = useState(false)

    return (
        <div
            // 그리드가 아니라 가로 스크롤이라 폭을 직접 준다
            className={`relative aspect-square w-28 shrink-0 snap-start overflow-hidden rounded-2xl border-2 ${
                isAnalysis ? 'border-edge-active' : 'border-transparent'
            }`}
        >
            <button
                type="button"
                onClick={selectable ? onSelect : undefined}
                aria-label={
                    selectable
                        ? `${photo.file.name}, ${isAnalysis ? '분석 사진으로 지정됨' : '분석 사진으로 지정하기'}`
                        : photo.file.name
                }
                className="h-full w-full bg-surface-card-locked"
            >
                {previewBroken ? (
                    <span className="flex h-full w-full items-center justify-center text-3xl">🖼️</span>
                ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- blob: 미리보기라 next/image 최적화 대상이 아니다
                    <img
                        src={photo.previewUrl}
                        alt=""
                        onError={() => setPreviewBroken(true)}
                        className="h-full w-full object-cover"
                    />
                )}
            </button>

            {photo.status === 'uploading' && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <Loader2Icon size={20} aria-hidden className="animate-spin text-white" />
                    <span className="sr-only">올리는 중</span>
                </span>
            )}

            {photo.status === 'failed' && (
                <button
                    type="button"
                    onClick={onRetry}
                    aria-label={`${photo.file.name} 다시 올리기`}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 text-white"
                >
                    <RotateCwIcon size={18} aria-hidden />
                    <span className="text-xs font-bold">다시 시도</span>
                </button>
            )}

            {isAnalysis && photo.status === 'uploaded' && (
                <span className="absolute bottom-1 left-1 flex items-center gap-1 rounded-full bg-action-primary px-2 py-0.5 text-xs font-bold text-content-on-action">
                    <CheckIcon size={11} aria-hidden />
                    분석
                </span>
            )}

            <button
                type="button"
                onClick={onRemove}
                aria-label={`${photo.file.name} 빼기`}
                className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-brown-muted shadow-soft"
            >
                <XIcon size={13} aria-hidden />
            </button>
        </div>
    )
}
