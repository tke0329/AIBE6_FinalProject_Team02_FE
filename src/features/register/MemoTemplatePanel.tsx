'use client'

import { ApiError } from '@/shared/lib/api'
import { BookmarkPlusIcon, Loader2Icon, Trash2Icon } from 'lucide-react'
import { RefObject, useCallback, useEffect, useRef, useState } from 'react'
import {
    MemoTemplate,
    TEMPLATE_MAX_COUNT,
    deleteMemoTemplate,
    fetchMemoTemplates,
    markMemoTemplateUsed,
    saveMemoTemplate,
} from './memoTemplateApi'

interface Props {
    /** 지금 입력란에 있는 메모. 저장 후보이자 덮어쓰기 확인 여부의 기준 */
    currentMemo: string
    /** 패널을 연 버튼. 닫을 때 여기로 포커스를 되돌린다 */
    triggerRef: RefObject<HTMLButtonElement | null>
    onPick: (content: string) => void
    onClose: () => void
}

/**
 * 떠 있는 레이어가 아니라 메모 아래에 자리를 차지하며 펼쳐진다 — 겹쳐 띄우면
 * 메모나 수집 위치가 가려진다. 같은 이유로 바깥 클릭으로 닫지 않는다.
 */
export function MemoTemplatePanel({ currentMemo, triggerRef, onPick, onClose }: Props) {
    const [templates, setTemplates] = useState<MemoTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    /** 덮어쓰기 확인을 띄운 항목 */
    const [confirmId, setConfirmId] = useState<number | null>(null)

    const panelRef = useRef<HTMLDivElement>(null)

    const memo = currentMemo.trim()
    const alreadySaved = templates.some((template) => template.content === memo)
    const pending = templates.find((template) => template.id === confirmId)
    // 이미 저장된 문구를 다시 저장하는 건 개수를 늘리지 않으므로 막지 않는다
    const atLimit = !alreadySaved && templates.length >= TEMPLATE_MAX_COUNT

    const load = useCallback(async () => {
        setLoading(true)
        try {
            setTemplates(await fetchMemoTemplates())
            setError(null)
        } catch {
            setError('템플릿을 불러오지 못했어요')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void load()
    }, [load])

    // 펼쳐진 만큼 아래로 밀리므로 화면 밖으로 나갈 수 있다. 최소한만 스크롤해 들여온다
    useEffect(() => {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        panelRef.current?.scrollIntoView({
            block: 'nearest',
            behavior: reduceMotion ? 'auto' : 'smooth',
        })
    }, [])

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [onClose])

    // 포커스 복귀는 **닫힐 때 한 번**이어야 한다.
    // 위 이펙트에 같이 두면 onClose 정체성이 렌더마다 바뀌는 탓에 정리 함수가 매 렌더 돌아,
    // 메모를 한 글자 칠 때마다 포커스가 트리거 버튼으로 튄다.
    useEffect(() => {
        const trigger = triggerRef.current
        return () => trigger?.focus()
    }, [triggerRef])

    const save = async () => {
        setSaving(true)
        try {
            await saveMemoTemplate(memo)
            await load()
        } catch (caught) {
            // 개수 초과처럼 서버가 이유를 말해 주는 경우가 있어 그 문구를 그대로 쓴다
            setError(caught instanceof ApiError ? caught.message : '저장하지 못했어요')
        } finally {
            setSaving(false)
        }
    }

    const apply = (template: MemoTemplate) => {
        onPick(template.content)
        // 정렬용 기록이라 실패해도 사용자가 할 일은 없다 — 기다리지 않고 닫는다
        void markMemoTemplateUsed(template.id).catch(() => {})
        onClose()
    }

    /** 메모가 비어 있으면 바로 넣고, 내용이 있으면 지워진다는 걸 먼저 알린다 */
    const request = (template: MemoTemplate) => {
        if (!memo) {
            apply(template)
            return
        }
        setConfirmId(template.id)
    }

    const remove = async (template: MemoTemplate) => {
        // 낙관적 제거 — 목록이 짧아 되돌릴 일이 거의 없고, 매번 로딩을 보이는 게 더 거슬린다
        setTemplates((current) => current.filter((item) => item.id !== template.id))
        try {
            await deleteMemoTemplate(template.id)
        } catch {
            setError('지우지 못했어요')
            void load()
        }
    }

    return (
        <div
            ref={panelRef}
            role="group"
            aria-label="메모 템플릿"
            className="mt-2 rounded-2xl border border-edge-default bg-surface-card p-3"
        >
            <button
                type="button"
                disabled={!memo || alreadySaved || atLimit || saving}
                onClick={save}
                className="flex min-h-touch w-full items-center justify-center gap-1.5 rounded-xl border-2 border-watermelon-400 px-3 text-xs font-medium text-watermelon-600 disabled:opacity-40"
            >
                {saving ? (
                    <Loader2Icon size={14} aria-hidden className="animate-spin" />
                ) : (
                    <BookmarkPlusIcon size={14} aria-hidden className="shrink-0" />
                )}
                {alreadySaved
                    ? '이미 저장된 메모예요'
                    : atLimit
                      ? `메모는 최대 ${TEMPLATE_MAX_COUNT}개까지만 저장할 수 있어요`
                      : '지금 메모를 템플릿으로 저장'}
            </button>

            {error && (
                <p role="alert" className="mt-2 text-xs text-feedback-error">
                    {error}
                </p>
            )}

            {loading ? (
                <p className="py-4 text-center text-xs text-content-secondary">불러오는 중…</p>
            ) : templates.length === 0 ? (
                <p className="py-4 text-center text-xs text-content-secondary">아직 저장한 템플릿이 없어요</p>
            ) : (
                // 최대 3개라 목록이 길어지지 않는다 — 높이 제한도 스크롤도 두지 않는다
                <ul className="mt-2 space-y-1" aria-label="저장된 메모 템플릿">
                    {templates.map((template) => (
                        <li key={template.id} className="flex items-center gap-1">
                            {/* min-w-0 + truncate라야 휴지통 앞에서 끊기고 …이 붙는다.
                  띄어쓰기 없는 문구는 줄바꿈 지점이 없어 안 자르면 그대로 흘러나간다 */}
                            <button
                                type="button"
                                onClick={() => request(template)}
                                title={template.content}
                                className={`min-w-0 flex-1 truncate rounded-xl px-2 py-2 text-left text-sm text-content-primary hover:bg-surface-accent ${
                                    confirmId === template.id ? 'bg-surface-accent' : ''
                                }`}
                            >
                                {template.content}
                            </button>
                            <button
                                type="button"
                                onClick={() => remove(template)}
                                aria-label={`템플릿 지우기: ${template.content}`}
                                className="shrink-0 p-1.5 text-content-muted"
                            >
                                <Trash2Icon size={15} aria-hidden />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* 확인은 목록 자리를 건드리지 않고 맨 아래에 붙는다 — 고른 항목이 계속 보여야 한다 */}
            {pending && (
                <div
                    role="alertdialog"
                    aria-label="메모 덮어쓰기 확인"
                    className="mt-2 rounded-xl bg-surface-accent p-2.5"
                >
                    <p className="text-xs leading-5 text-content-secondary">
                        지금 쓴 메모가 지워지고 이 템플릿으로 바뀌어요.
                    </p>
                    <div className="mt-1.5 flex justify-end gap-1.5">
                        <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            className="rounded-full px-2.5 py-1 text-xs text-content-secondary"
                        >
                            취소
                        </button>
                        <button
                            type="button"
                            onClick={() => apply(pending)}
                            className="rounded-full bg-action-primary px-2.5 py-1 text-xs font-bold text-content-on-action"
                        >
                            가져오기
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
