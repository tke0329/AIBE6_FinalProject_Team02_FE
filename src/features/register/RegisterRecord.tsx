'use client'

import {
    AlertCircleIcon,
    ArrowLeftIcon,
    BookmarkIcon,
    CheckIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ClockIcon,
} from 'lucide-react'
import React, { useMemo, useRef, useState } from 'react'
import { MemoTemplatePanel } from './MemoTemplatePanel'
import { PlacePicker } from './PlacePicker'
import { RegisterPhoto, useRegisterFlow } from './RegisterFlowContext'
import { CardInput, LocationInput } from './confirmApi'

const MEMO_MAX = 100

/**
 * 사진 위에 얹는 순서 변경 버튼.
 *
 * 24px이라 최소 터치 타깃(44px)에 못 미치지만, `no-touch-expand`를 붙이지 않아
 * globals.css의 아이콘 버튼 규칙이 히트 영역을 44px로 넓혀 준다. 보이는 크기만 작다
 */
function OrderButton({
    label,
    disabled,
    onClick,
    children,
}: {
    label: string
    disabled: boolean
    onClick: () => void
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-content-primary disabled:opacity-30"
        >
            {children}
        </button>
    )
}

interface Props {
    submitting: boolean
    error: string | null
    onBack: () => void
    onSubmit: (cards: CardInput[], location: LocationInput | null) => void
}

/**
 * `photoKeys`의 **순서가 곧 카드에 실리는 순서**다. 첫 장이 대표 사진이 된다.
 *
 * 예전에는 `thumbnailKey`를 따로 들고 "대표" 버튼으로 골랐는데, 순서라는 개념이
 * 없으니 대표만 정해도 나머지가 어떤 차례로 실리는지 알 수 없었다. 순서 하나로 합치면
 * 대표를 고르는 일이 "맨 앞으로 옮기기"가 되어 눈에 보이는 대로 동작한다
 */
interface Draft {
    photoKeys: string[]
    memo: string
}

/**
 * 음식별 기록.
 *
 * 모든 입력이 선택이다 — 사진을 안 고르면 분석 사진이 자동으로 붙고, 메모·위치는 비워도 된다.
 * 기록을 강제하면 등록 이탈이 생긴다는 것이 기획 원칙이다.
 * 위치는 카드마다가 아니라 등록 건 전체에 일괄 적용된다.
 */
export function RegisterRecord({ submitting, error, onBack, onSubmit }: Props) {
    const { recordSlots, photos, analysisPhoto } = useRegisterFlow()

    const [step, setStep] = useState(0)
    const [drafts, setDrafts] = useState<Record<number, Draft>>({})
    // 검색해서 고른 식당이면 좌표까지, 직접 입력이면 이름만 담긴다
    const [location, setLocation] = useState<LocationInput | null>(null)
    const [templateOpen, setTemplateOpen] = useState(false)
    const templateTriggerRef = useRef<HTMLButtonElement>(null)

    const uploaded = useMemo(
        () => photos.filter((photo): photo is RegisterPhoto & { key: string } => Boolean(photo.key)),
        [photos],
    )

    const slot = recordSlots[step]
    const total = recordSlots.length
    const last = step === total - 1

    /**
     * **올린 사진이 처음부터 다 들어가 있다.**
     *
     * 예전 기본값은 빈 목록이었고, 안 고르면 분석 사진 한 장만 붙었다. 그런데 사진을
     * 여러 장 올린 사람은 그 여러 장을 남기려고 올린 것이다 — 기본값이 그 반대라
     * 매번 전부 다시 눌러야 했다. 빼는 쪽이 고르는 쪽보다 드물다
     */
    const defaultDraft = useMemo<Draft>(() => ({ photoKeys: uploaded.map((photo) => photo.key), memo: '' }), [uploaded])
    const draft = drafts[slot?.slotId] ?? defaultDraft

    const patch = (change: Partial<Draft>) =>
        setDrafts((current) => ({
            ...current,
            [slot.slotId]: { ...draft, ...change },
        }))

    /** 뺐다가 다시 넣으면 맨 뒤로 간다 — 순서를 되돌리는 방법이기도 하다 */
    const togglePhoto = (key: string) =>
        patch({
            photoKeys: draft.photoKeys.includes(key)
                ? draft.photoKeys.filter((selected) => selected !== key)
                : [...draft.photoKeys, key],
        })

    /** 이웃과 자리를 바꾼다. 끝에서 더 밀면 아무 일도 안 한다 */
    const movePhoto = (key: string, direction: -1 | 1) => {
        const from = draft.photoKeys.indexOf(key)
        const to = from + direction
        if (from < 0 || to < 0 || to >= draft.photoKeys.length) return
        const next = [...draft.photoKeys]
        ;[next[from], next[to]] = [next[to], next[from]]
        patch({ photoKeys: next })
    }

    const submit = () => {
        const cards: CardInput[] = recordSlots.map((passed) => {
            const saved = drafts[passed.slotId] ?? defaultDraft
            return {
                slotId: passed.slotId,
                cardPhotoKeys: saved.photoKeys,
                // 대표는 첫 장이다 (Draft 주석 참고)
                thumbnailKey: saved.photoKeys[0] ?? null,
                memo: saved.memo.trim() || null,
            }
        })
        onSubmit(cards, location)
    }

    if (!slot) return null

    return (
        // break-keep은 상속된다 — 이 화면 전체에서 한글이 단어 중간에 끊기지 않는다
        <div className="flex h-full flex-col break-keep bg-surface-app">
            <header className="flex shrink-0 items-center gap-3 px-5 py-4">
                <button type="button" onClick={() => (step === 0 ? onBack() : setStep(step - 1))} aria-label="뒤로가기">
                    <ArrowLeftIcon size={22} aria-hidden className="text-neutral-900" />
                </button>
                <span className="font-display text-lg text-content-primary">음식별 기록</span>
                <span className="ml-auto rounded-full bg-watermelon-50 px-2.5 py-1 text-xs font-bold text-content-link">
                    {step + 1} / {total}
                </span>
            </header>

            <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-4">
                <div className="flex items-baseline gap-2">
                    <h1 className="font-display text-xl text-content-primary">{slot.slotName}</h1>
                    <span className="text-xs text-content-secondary">{slot.category}</span>
                </div>

                {/* AI가 확인하지 못한 칸은 검토를 거쳐야 열린다 — 기록 시점에 미리 알린다 */}
                {!slot.matched && (
                    <p className="mt-2 flex items-start gap-1.5 rounded-2xl bg-surface-accent p-3 text-xs leading-5 text-content-secondary">
                        <ClockIcon size={14} aria-hidden className="mt-0.5 shrink-0 text-content-link" />
                        <span>
                            이 음식은 사진으로 확인되지 않아 <strong className="text-content-link">검토 후</strong>{' '}
                            도감이 열려요. 지금 남긴 기록은 그대로 저장돼요.
                        </span>
                    </p>
                )}

                <section className="mt-5" aria-label="카드 사진 고르기">
                    <p className="text-sm font-medium text-content-secondary">카드에 넣을 사진</p>
                    <p className="mt-0.5 text-xs text-content-secondary">
                        올린 사진이 모두 들어가요. 뺄 사진은 눌러서 빼고, <strong>1번이 대표 사진</strong>이에요
                    </p>

                    <div className="mt-2.5 grid grid-cols-3 gap-2.5">
                        {uploaded.map((photo) => {
                            const order = draft.photoKeys.indexOf(photo.key)
                            const picked = order >= 0
                            return (
                                <div key={photo.id} className="relative">
                                    <button
                                        type="button"
                                        onClick={() => togglePhoto(photo.key)}
                                        aria-pressed={picked}
                                        aria-label={
                                            picked
                                                ? `${order + 1}번째 사진 빼기`
                                                : `사진 넣기 (맨 뒤 ${draft.photoKeys.length + 1}번)`
                                        }
                                        className={`aspect-square w-full overflow-hidden rounded-2xl border-2 ${
                                            picked ? 'border-edge-active' : 'border-transparent opacity-45 grayscale'
                                        }`}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element -- blob: 미리보기 */}
                                        <img src={photo.previewUrl} alt="" className="h-full w-full object-cover" />
                                    </button>

                                    {/* 순번. 대표(1번)만 채운 색이라 어느 것이 표지인지 한눈에 보인다 */}
                                    {picked && (
                                        <span
                                            aria-hidden
                                            className={`absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                                                order === 0
                                                    ? 'bg-action-primary text-content-on-action'
                                                    : 'bg-white/90 text-content-primary'
                                            }`}
                                        >
                                            {order + 1}
                                        </span>
                                    )}

                                    {photo.id === analysisPhoto?.id && (
                                        <span className="absolute right-1 top-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-content-primary">
                                            분석
                                        </span>
                                    )}

                                    {/*
                                        끌어서 옮기는 대신 화살표 두 개로 순서를 바꾼다.
                                        좁은 3열 격자에서 드래그는 스크롤과 다투고, 키보드로는 아예 못 쓴다
                                    */}
                                    {picked && draft.photoKeys.length > 1 && (
                                        <div className="absolute inset-x-1 bottom-1 flex justify-between">
                                            <OrderButton
                                                label={`${order + 1}번째 사진 앞으로`}
                                                disabled={order === 0}
                                                onClick={() => movePhoto(photo.key, -1)}
                                            >
                                                <ChevronLeftIcon size={14} aria-hidden />
                                            </OrderButton>
                                            <OrderButton
                                                label={`${order + 1}번째 사진 뒤로`}
                                                disabled={order === draft.photoKeys.length - 1}
                                                onClick={() => movePhoto(photo.key, 1)}
                                            >
                                                <ChevronRightIcon size={14} aria-hidden />
                                            </OrderButton>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {draft.photoKeys.length === 0 && (
                        <p className="mt-2 text-xs font-medium text-feedback-error">
                            사진을 하나도 안 넣으면 카드에 사진이 없어요
                        </p>
                    )}
                </section>

                <section className="mt-6" aria-label="메모">
                    <div className="flex items-center justify-between">
                        <label htmlFor="memo" className="text-sm font-medium text-content-secondary">
                            메모 <span className="text-xs">(선택)</span>
                        </label>
                        <button
                            ref={templateTriggerRef}
                            type="button"
                            onClick={() => setTemplateOpen((open) => !open)}
                            aria-expanded={templateOpen}
                            aria-label="저장한 메모 템플릿 열기"
                            className="flex min-h-touch items-center gap-1 px-1 text-xs text-content-link"
                        >
                            <BookmarkIcon size={14} aria-hidden />
                            메모 불러오기
                        </button>
                    </div>
                    <textarea
                        id="memo"
                        value={draft.memo}
                        maxLength={MEMO_MAX}
                        onChange={(event) => patch({ memo: event.target.value })}
                        placeholder={`${slot.slotName} 어땠나요?`}
                        // break-words가 없으면 띄어쓰기 없는 긴 문자열이 break-keep 탓에 줄바꿈되지 못해
                        // 가로로 흘러 스크롤바가 생긴다. 일반 문장은 그대로 단어 단위로 끊긴다
                        className="mt-1.5 h-24 w-full resize-none break-words rounded-2xl border border-edge-default bg-surface-card px-4 py-3 text-sm outline-none focus:border-edge-active"
                    />
                    <p className="mt-1 text-right text-xs text-content-secondary">
                        {draft.memo.length} / {MEMO_MAX}
                    </p>

                    {templateOpen && (
                        <MemoTemplatePanel
                            currentMemo={draft.memo}
                            triggerRef={templateTriggerRef}
                            // 불러오기는 작성의 시작점이다 — 넣은 뒤 그대로 고칠 수 있다
                            onPick={(content) => patch({ memo: content })}
                            onClose={() => setTemplateOpen(false)}
                        />
                    )}
                </section>

                <section className="mt-4" aria-label="수집 위치">
                    {/* 고르고 나면 입력창이 사라져 label의 대상이 없어진다 — 설명 문구로 두고
              PlacePicker 내부에서 aria-label을 단다 */}
                    <p className="text-sm font-medium text-content-secondary">
                        수집 위치 <span className="text-xs">(선택)</span>
                    </p>
                    <PlacePicker value={location} onChange={setLocation} />
                </section>

                {error && (
                    <p role="alert" className="mt-4 flex items-center gap-1.5 text-xs text-feedback-error">
                        <AlertCircleIcon size={14} aria-hidden />
                        {error}
                    </p>
                )}
            </main>

            <div className="shrink-0 px-5 pb-8 pt-4">
                <button
                    type="button"
                    disabled={submitting}
                    onClick={() => (last ? submit() : setStep(step + 1))}
                    className="flex h-cta w-full items-center justify-center gap-2 rounded-2xl bg-action-primary font-display text-lg text-content-on-action shadow-card disabled:opacity-40"
                >
                    {last && <CheckIcon size={18} aria-hidden />}
                    {submitting ? '등록하는 중…' : last ? '등록 완료' : '다음'}
                </button>
            </div>
        </div>
    )
}
