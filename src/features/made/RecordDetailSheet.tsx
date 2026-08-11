import React, { useEffect, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { BottomSheet } from '@/shared/ui/molecules/BottomSheet'
import { ConfirmDialog } from '@/shared/ui/molecules/ConfirmDialog'
import { PhotoCarousel } from './PhotoCarousel'
import { deleteRecord, fetchRecord } from './logitApi'
import { madeErrorMessage } from './errors'
import { timeLabel } from './logitTypes'
import type { LogitRecordDetail } from './logitTypes'
import type { MadeDexId } from './types'

interface Props {
    madeDexId: MadeDexId
    /** 카드 한 장에 여러 기록이 접혀 있다. 시트 안에서 넘긴다 */
    recordIds: number[]
    onClose: () => void
    onEdit: (recordId: number) => void
    onDeleted: () => void
}

export function RecordDetailSheet({ madeDexId, recordIds, onClose, onEdit, onDeleted }: Props) {
    const [index, setIndex] = useState(0)
    const [record, setRecord] = useState<LogitRecordDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [confirming, setConfirming] = useState(false)

    const recordId = recordIds[index]

    useEffect(() => {
        let live = true
        setLoading(true)
        setError(null)
        fetchRecord(madeDexId, recordId)
            .then((next) => {
                if (live) setRecord(next)
            })
            .catch((failure) => {
                if (live) setError(madeErrorMessage(failure, '기록을 불러오지 못했어요.'))
            })
            .finally(() => {
                if (live) setLoading(false)
            })
        return () => {
            live = false
        }
    }, [madeDexId, recordId])

    const remove = async () => {
        setConfirming(false)
        try {
            await deleteRecord(madeDexId, recordId)
            onDeleted()
        } catch (failure) {
            setError(madeErrorMessage(failure, '기록을 지우지 못했어요.'))
        }
    }

    return (
        <BottomSheet title={record?.slotName ?? '기록'} onClose={onClose} maxHeightClass="max-h-[88%]">
            <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6 pt-3">
                {recordIds.length > 1 && (
                    <div className="flex items-center justify-between pb-3">
                        <button
                            type="button"
                            onClick={() => setIndex((current) => current - 1)}
                            disabled={index === 0}
                            aria-label="이전 기록"
                            className="min-h-touch px-2 text-content-secondary disabled:text-action-disabled-text"
                        >
                            <ChevronLeftIcon size={20} aria-hidden />
                        </button>
                        <span className="text-xs font-bold text-content-secondary">
                            {index + 1} / {recordIds.length}
                        </span>
                        <button
                            type="button"
                            onClick={() => setIndex((current) => current + 1)}
                            disabled={index === recordIds.length - 1}
                            aria-label="다음 기록"
                            className="min-h-touch px-2 text-content-secondary disabled:text-action-disabled-text"
                        >
                            <ChevronRightIcon size={20} aria-hidden />
                        </button>
                    </div>
                )}

                {error && (
                    <p className="break-keep py-6 text-center text-sm font-medium text-content-secondary">{error}</p>
                )}

                {loading && !error && (
                    <div className="aspect-square w-full animate-pulse rounded-2xl bg-neutral-100" aria-hidden />
                )}

                {record && !loading && !error && (
                    <>
                        <PhotoCarousel photos={record.photos} />

                        <p className="pt-3 text-xs text-content-muted">
                            {record.loggedAt && `${timeLabel(record.loggedAt)} · `}
                            {record.mine ? '내' : `${record.authorNickname ?? '이름 없는 참여자'}님의`} 기록
                        </p>

                        {record.mine && (
                            <div className="grid grid-cols-2 gap-2 pt-5">
                                <button
                                    type="button"
                                    onClick={() => onEdit(record.recordId)}
                                    className="min-h-touch rounded-2xl bg-neutral-100 text-sm font-bold text-content-secondary"
                                >
                                    수정하기
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfirming(true)}
                                    className="min-h-touch rounded-2xl bg-action-primary text-sm font-bold text-content-on-action"
                                >
                                    삭제하기
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {confirming && (
                <ConfirmDialog
                    title="기록을 지울까요?"
                    message="사진과 사진에 붙인 글이 함께 사라져요. 되돌릴 수 없어요."
                    actionText="삭제하기"
                    onCancel={() => setConfirming(false)}
                    onConfirm={() => void remove()}
                />
            )}
        </BottomSheet>
    )
}
