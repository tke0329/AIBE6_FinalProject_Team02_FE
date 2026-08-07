import React, { useEffect, useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { GripVerticalIcon, PencilIcon, RotateCcwIcon, Trash2Icon } from 'lucide-react'
import { BottomSheet } from '@/shared/ui/molecules/BottomSheet'
import { ConfirmDialog } from '@/shared/ui/molecules/ConfirmDialog'
import { useSlotEditor } from './useSlotEditor'
import { MAX_SLOTS, MIN_SLOTS, SLOT_NAME_MAX } from './logitTypes'
import type { LogitSlot } from './logitTypes'
import type { MadeDexId } from './types'

interface Props {
    madeDexId: MadeDexId
    onClose: () => void
    /** 슬롯이 바뀌면 피드도 다시 읽어야 한다 */
    onChanged: () => void
}

export function SlotEditSheet({ madeDexId, onClose, onChanged }: Props) {
    const editor = useSlotEditor(madeDexId)
    const [order, setOrder] = useState<LogitSlot[]>([])
    const [draft, setDraft] = useState('')
    const [removing, setRemoving] = useState<LogitSlot | null>(null)

    const full = editor.visible.length >= MAX_SLOTS
    const last = editor.visible.length <= MIN_SLOTS

    // 끌어 놓는 동안에는 이 배열이 화면의 진실이고, 서버 응답이 오면 다시 맞춘다
    useEffect(() => {
        setOrder(editor.visible)
    }, [editor.visible])

    // 슬롯이 바뀐 뒤에 피드를 읽어야 한다. 먼저 읽으면 바뀌기 전 식탁이 그려진다
    const apply = (action: () => Promise<void>) => {
        void action().then(onChanged)
    }

    const commitOrder = (next: LogitSlot[]) => {
        const ids = next.map((slot) => slot.slotId)
        if (ids.join() === editor.visible.map((slot) => slot.slotId).join()) return
        apply(() => editor.reorder(ids))
    }

    // 끌기는 키보드로 못 한다. 손잡이에 포커스를 두고 위아래 키로도 옮길 수 있게 한다 (§5)
    const moveByKey = (slot: LogitSlot, delta: number) => {
        const from = order.findIndex((item) => item.slotId === slot.slotId)
        const to = from + delta
        if (from < 0 || to < 0 || to >= order.length) return
        const next = [...order]
        ;[next[from], next[to]] = [next[to], next[from]]
        setOrder(next)
        commitOrder(next)
    }

    const submitNew = (event: React.FormEvent) => {
        event.preventDefault()
        const name = draft.trim()
        if (!name || full || editor.busy) return
        apply(() => editor.add(name))
        setDraft('')
    }

    return (
        <BottomSheet title="구성 편집" onClose={onClose} maxHeightClass="max-h-[85%]">
            <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6 pt-3">
                <p className="break-keep text-sm text-content-secondary">
                    참여자 누구나 이름과 순서를 편집할 수 있어요!
                </p>

                {editor.error && (
                    <p className="break-keep pt-3 text-sm font-medium text-content-link">{editor.error}</p>
                )}
                {editor.notice && (
                    <p className="break-keep pt-3 text-sm font-medium text-content-secondary">{editor.notice}</p>
                )}

                <Reorder.Group as="ul" axis="y" values={order} onReorder={setOrder} className="pt-4">
                    {order.map((slot) => (
                        <SlotRow
                            key={slot.slotId}
                            slot={slot}
                            busy={editor.busy}
                            canRemove={!last}
                            onRename={(name) => apply(() => editor.rename(slot.slotId, name))}
                            onRemove={() => setRemoving(slot)}
                            onMove={(delta) => moveByKey(slot, delta)}
                            onDropped={() => commitOrder(order)}
                        />
                    ))}
                </Reorder.Group>

                {editor.nameError && (
                    <p className="break-keep pt-2 text-sm font-medium text-content-link">{editor.nameError}</p>
                )}
                {last && <p className="break-keep pt-2 text-xs text-content-muted">끼니는 최소 한 개는 남겨 주세요.</p>}

                <form onSubmit={submitNew} className="flex items-center gap-2 pt-4">
                    <input
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        maxLength={SLOT_NAME_MAX}
                        placeholder="예: 야식, 간식"
                        aria-label="새 끼니 이름"
                        disabled={full}
                        className="min-h-touch min-w-0 flex-1 rounded-xl bg-cream-100 px-3 text-sm text-content-primary disabled:text-action-disabled-text"
                    />
                    <button
                        type="submit"
                        disabled={full || editor.busy || !draft.trim()}
                        className="min-h-touch shrink-0 rounded-full bg-action-primary px-4 text-sm font-bold text-content-on-action disabled:bg-action-disabled-bg disabled:text-action-disabled-text"
                    >
                        추가
                    </button>
                </form>
                {full && (
                    <p className="break-keep pt-2 text-xs text-content-muted">
                        끼니는 {MAX_SLOTS}개까지 만들 수 있어요.
                    </p>
                )}

                {editor.hidden.length > 0 && (
                    <section className="pt-6">
                        <h3 className="text-sm font-bold text-content-secondary">숨긴 끼니</h3>
                        <ul>
                            {editor.hidden.map((slot) => (
                                <li
                                    key={slot.slotId}
                                    className="flex items-center gap-2 border-b border-edge-default py-1"
                                >
                                    <span className="min-w-0 flex-1 truncate text-sm text-content-muted">
                                        {slot.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => apply(() => editor.restore(slot.slotId))}
                                        disabled={full || editor.busy}
                                        className="flex min-h-touch shrink-0 items-center gap-1 px-2 text-xs font-bold text-content-link disabled:text-action-disabled-text"
                                    >
                                        <RotateCcwIcon size={14} aria-hidden />
                                        되살리기
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>

            {removing && (
                <ConfirmDialog
                    title={`${removing.name}을 없앨까요?`}
                    message={
                        removing.hasRecords ? (
                            <>
                                이미 남긴 기록이 있어서 지워지지 않고 숨겨져요.
                                <br />
                                지난 날짜에서는 그대로 보이고, 여기서 다시 되살릴 수 있어요.
                            </>
                        ) : (
                            '아직 기록이 없어서 바로 없어져요.'
                        )
                    }
                    actionText="없애기"
                    onCancel={() => setRemoving(null)}
                    onConfirm={() => {
                        apply(() => editor.remove(removing.slotId))
                        setRemoving(null)
                    }}
                />
            )}
        </BottomSheet>
    )
}

interface RowProps {
    slot: LogitSlot
    busy: boolean
    canRemove: boolean
    onRename: (name: string) => void
    onRemove: () => void
    onMove: (delta: number) => void
    onDropped: () => void
}

function SlotRow({ slot, busy, canRemove, onRename, onRemove, onMove, onDropped }: RowProps) {
    const controls = useDragControls()
    const [editing, setEditing] = useState(false)
    const [name, setName] = useState(slot.name)

    // 포커스가 떠날 때도 저장한다 — 이름을 고쳐 놓고 다른 데를 누르면 사라지는 게 더 놀랍다
    const submit = (event: React.SyntheticEvent) => {
        event.preventDefault()
        const next = name.trim()
        setEditing(false)
        if (next && next !== slot.name) onRename(next)
    }

    return (
        <Reorder.Item
            as="li"
            value={slot}
            dragListener={false}
            dragControls={controls}
            onDragEnd={onDropped}
            className="flex items-center gap-1 border-b border-edge-default bg-surface-app py-1"
        >
            <button
                type="button"
                onPointerDown={(event) => controls.start(event)}
                onKeyDown={(event) => {
                    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
                    event.preventDefault()
                    onMove(event.key === 'ArrowUp' ? -1 : 1)
                }}
                disabled={busy}
                aria-label={`${slot.name} 순서 바꾸기. 위아래 화살표 키로도 옮길 수 있어요`}
                className="min-h-touch shrink-0 cursor-grab touch-none px-1 text-content-muted active:cursor-grabbing"
            >
                <GripVerticalIcon size={18} aria-hidden />
            </button>

            {editing ? (
                <form onSubmit={submit} className="flex flex-1 items-center gap-2">
                    <input
                        autoFocus
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        onBlur={submit}
                        maxLength={SLOT_NAME_MAX}
                        aria-label="끼니 이름"
                        className="min-h-touch min-w-0 flex-1 rounded-xl bg-cream-100 px-3 text-sm text-content-primary"
                    />
                    <button
                        type="submit"
                        disabled={busy}
                        className="min-h-touch shrink-0 px-2 text-sm font-bold text-content-link"
                    >
                        저장
                    </button>
                </form>
            ) : (
                <>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-content-primary">{slot.name}</span>
                    <button
                        type="button"
                        onClick={() => {
                            setName(slot.name)
                            setEditing(true)
                        }}
                        aria-label={`${slot.name} 이름 바꾸기`}
                        className="min-h-touch shrink-0 px-2 text-content-secondary"
                    >
                        <PencilIcon size={16} aria-hidden />
                    </button>
                    <button
                        type="button"
                        onClick={onRemove}
                        disabled={!canRemove || busy}
                        aria-label={`${slot.name} 없애기`}
                        className="min-h-touch shrink-0 px-2 text-content-secondary disabled:text-action-disabled-text"
                    >
                        <Trash2Icon size={16} aria-hidden />
                    </button>
                </>
            )}
        </Reorder.Item>
    )
}
