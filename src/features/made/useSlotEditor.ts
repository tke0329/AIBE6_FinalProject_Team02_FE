import { useCallback, useEffect, useMemo, useState } from 'react'
import { addSlot, deleteSlot, fetchSlots, renameSlot, reorderSlots, restoreSlot } from './logitApi'
import { isSlotNameTaken, isSlotOrderStale, madeErrorMessage } from './errors'
import type { LogitSlot } from './logitTypes'
import type { MadeDexId } from './types'

/** 슬롯 편집은 멤버 전원이 한다. 낙관적 갱신 대신 매번 다시 읽어 남의 편집과 어긋나지 않게 한다 */
export function useSlotEditor(madeDexId: MadeDexId) {
    const [slots, setSlots] = useState<LogitSlot[]>([])
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [nameError, setNameError] = useState<string | null>(null)
    const [notice, setNotice] = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            setSlots(await fetchSlots(madeDexId))
            setError(null)
        } catch (failure) {
            setError(madeErrorMessage(failure, '끼니를 불러오지 못했어요.'))
        } finally {
            setLoading(false)
        }
    }, [madeDexId])

    useEffect(() => {
        void load()
    }, [load])

    const run = async (action: () => Promise<void>) => {
        setBusy(true)
        setError(null)
        setNameError(null)
        setNotice(null)
        try {
            await action()
            await load()
        } catch (failure) {
            // 이름 중복은 입력 칸 옆에 붙어야 한다. 시트를 닫으면 쓰던 이름이 사라진다
            if (isSlotNameTaken(failure)) {
                setNameError(madeErrorMessage(failure, '같은 이름의 끼니가 이미 있어요.'))
                return
            }
            // 다른 멤버가 먼저 순서를 바꿨다. 문구보다 최신 목록이 먼저다
            if (isSlotOrderStale(failure)) await load()
            setError(madeErrorMessage(failure, '끼니를 바꾸지 못했어요.'))
        } finally {
            setBusy(false)
        }
    }

    // 끌어 놓는 목록이 이 배열을 그대로 들고 있어서, 매 렌더 새 배열을 만들면 순서가 되돌아간다
    const visible = useMemo(() => slots.filter((slot) => !slot.hidden), [slots])
    const hidden = useMemo(() => slots.filter((slot) => slot.hidden), [slots])

    return {
        slots,
        visible,
        hidden,
        loading,
        busy,
        error,
        nameError,
        notice,
        add: (name: string) =>
            run(async () => {
                await addSlot(madeDexId, name)
            }),
        rename: (slotId: number, name: string) =>
            run(async () => {
                await renameSlot(madeDexId, slotId, name)
            }),
        remove: (slotId: number) =>
            run(async () => {
                const result = await deleteSlot(madeDexId, slotId)
                if (result.hidden) {
                    setNotice('기록이 있어 지우지 않고 숨겼어요. 여기서 다시 되살릴 수 있어요.')
                }
            }),
        restore: (slotId: number) =>
            run(async () => {
                await restoreSlot(madeDexId, slotId)
            }),
        /** 보이는 슬롯 전체를 새 순서로. 일부만 보내면 서버가 막는다 */
        reorder: (slotIds: number[]) =>
            run(async () => {
                await reorderSlots(madeDexId, slotIds)
            }),
        clearNameError: () => setNameError(null),
    }
}
