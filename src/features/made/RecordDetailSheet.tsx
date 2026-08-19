import React, { useEffect, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, HeartIcon } from 'lucide-react'
import { BottomSheet, Dialog } from '@/shared/ui'
import { PhotoCarousel } from './PhotoCarousel'
import { RecordSocial } from './RecordSocial'
import { deleteRecord, fetchRecord, toggleRecordLike } from './logitApi'
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
    const [expanded, setExpanded] = useState(false)

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

    const like = async () => {
        try {
            const next = await toggleRecordLike(madeDexId, recordId)
            setRecord((prev) => (prev ? { ...prev, likedByMe: next.isLike, likeCount: next.likeCount } : prev))
        } catch {
            /* 좋아요 실패는 조용히 둔다. 다음 조회에서 서버 상태로 맞춰진다. */
        }
    }

    return (
        // 댓글을 모두 펼치면 시트를 위로 더 올린다 — 접힌 상태에서는 사진이 주인공이어야 한다
        <BottomSheet
            title={record?.slotName ?? '기록'}
            onClose={onClose}
            maxHeightClass={expanded ? 'max-h-[96%]' : 'max-h-[88%]'}
        >
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

                        <div className="flex items-center justify-between gap-2 pt-3">
                            <p className="text-xs text-content-muted">
                                {record.loggedAt && `${timeLabel(record.loggedAt)} · `}
                                {record.mine ? '내' : `${record.authorNickname ?? '이름 없는 참여자'}님의`} 기록
                            </p>
                            <button
                                type="button"
                                onClick={() => void like()}
                                aria-pressed={record.likedByMe}
                                aria-label={record.likedByMe ? '기록 좋아요 취소' : '기록 좋아요'}
                                className="no-touch-expand flex min-h-touch shrink-0 items-center gap-1.5"
                            >
                                <HeartIcon
                                    size={20}
                                    aria-hidden
                                    className={record.likedByMe ? 'fill-current text-content-link' : 'text-content-secondary'}
                                />
                                <span className="text-sm font-bold tabular-nums text-content-secondary">
                                    {record.likeCount}
                                </span>
                            </button>
                        </div>

                        {/* 내 기록에도 붙인다 — 남이 남긴 반응을 내가 보는 자리이기도 하다 */}
                        <RecordSocial
                            madeDexId={madeDexId}
                            recordId={record.recordId}
                            expanded={expanded}
                            onExpand={() => setExpanded(true)}
                        />

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
                <Dialog
                    title="기록을 지울까요?"
                    message="사진과 사진에 붙인 글이 함께 사라져요. 되돌릴 수 없어요."
                    danger
                    action={{ label: '삭제하기', onClick: () => void remove() }}
                    onClose={() => setConfirming(false)}
                />
            )}
        </BottomSheet>
    )
}
