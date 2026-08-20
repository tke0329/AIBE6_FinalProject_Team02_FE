'use client'

import { ChevronLeftIcon, RefreshCwIcon } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { acceptReport, completeRequest, fetchPendingRequests, fetchReports, rejectReport, rejectRequest } from './api'
import type { FoodRegistrationRequest, FoodReport, ReportStatus } from './types'

type Tab = 'requests' | 'reports'
type RejectTarget = { kind: 'report' | 'request'; id: number }

const REPORT_FILTERS: { value: ReportStatus; label: string }[] = [
    { value: 'PENDING', label: '대기' },
    { value: 'ACCEPTED', label: '채택' },
    { value: 'REJECTED', label: '반려' },
]

export function AdminConsole() {
    const router = useRouter()
    const [tab, setTab] = useState<Tab>('requests')
    const [reportStatus, setReportStatus] = useState<ReportStatus>('PENDING')
    const [reports, setReports] = useState<FoodReport[]>([])
    const [requests, setRequests] = useState<FoodRegistrationRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // 반려 모달 상태
    const [rejectTarget, setRejectTarget] = useState<RejectTarget | null>(null)
    const [reason, setReason] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            if (tab === 'reports') setReports(await fetchReports(reportStatus))
            else setRequests(await fetchPendingRequests())
        } catch (e) {
            setError(e instanceof Error ? e.message : '불러오지 못했어요')
        } finally {
            setLoading(false)
        }
    }, [tab, reportStatus])

    useEffect(() => {
        load()
    }, [load])

    // 채택/완료 — 성공 시 목록에서 제거
    async function run(action: () => Promise<void>, onDone: () => void) {
        try {
            await action()
            onDone()
        } catch (e) {
            alert(e instanceof Error ? e.message : '처리에 실패했어요')
        }
    }

    // 반려 모달 확정
    async function confirmReject() {
        if (!rejectTarget || submitting) return
        const trimmed = reason.trim()
        if (!trimmed) return
        setSubmitting(true)
        try {
            if (rejectTarget.kind === 'report') {
                await rejectReport(rejectTarget.id, trimmed)
                setReports((prev) => prev.filter((x) => x.id !== rejectTarget.id))
            } else {
                await rejectRequest(rejectTarget.id, trimmed)
                setRequests((prev) => prev.filter((x) => x.id !== rejectTarget.id))
            }
            closeReject()
        } catch (e) {
            alert(e instanceof Error ? e.message : '반려에 실패했어요')
        } finally {
            setSubmitting(false)
        }
    }

    function openReject(target: RejectTarget) {
        setRejectTarget(target)
        setReason('')
    }
    function closeReject() {
        setRejectTarget(null)
        setReason('')
    }

    const isPendingReports = tab === 'reports' && reportStatus === 'PENDING'

    return (
        <div className="flex h-full flex-col bg-surface-app">
            <header className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.back()}
                        aria-label="뒤로 가기"
                        className="-ml-2 p-2 text-neutral-900 transition active:scale-95"
                    >
                        <ChevronLeftIcon size={24} />
                    </button>
                    <h1 className="font-display text-xl text-neutral-900">관리자 콘솔</h1>
                </div>
                <button
                    onClick={load}
                    aria-label="새로고침"
                    className="-mr-2 p-2 text-neutral-900 transition active:scale-95"
                >
                    <RefreshCwIcon size={20} className={loading ? 'animate-spin text-neutral-400' : ''} />
                </button>
            </header>

            {/* 상단 탭 */}
            <div className="flex gap-2 px-5">
                <TabButton active={tab === 'requests'} onClick={() => setTab('requests')}>
                    등록 요청
                </TabButton>
                <TabButton active={tab === 'reports'} onClick={() => setTab('reports')}>
                    제보
                </TabButton>
            </div>

            {/* 제보 탭일 때만: 상태 필터 */}
            {tab === 'reports' && (
                <div className="mt-3 flex gap-2 px-5">
                    {REPORT_FILTERS.map((f) => (
                        <FilterChip
                            key={f.value}
                            active={reportStatus === f.value}
                            onClick={() => setReportStatus(f.value)}
                        >
                            {f.label}
                        </FilterChip>
                    ))}
                </div>
            )}

            <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6 pt-4">
                {loading && <p className="py-10 text-center text-sm text-neutral-800">불러오는 중…</p>}
                {error && !loading && <p className="py-10 text-center text-sm text-red-500">{error}</p>}

                {!loading &&
                    !error &&
                    tab === 'requests' &&
                    (requests.length === 0 ? (
                        <Empty label="대기 중인 등록 요청이 없어요" />
                    ) : (
                        <ul className="flex flex-col gap-3">
                            {requests.map((r) => (
                                <li key={r.id} className="rounded-2xl bg-white p-4 shadow-soft">
                                    <div className="flex gap-3">
                                        {r.evidenceUrl && (
                                            <Image
                                                src={r.evidenceUrl}
                                                alt="증빙 사진"
                                                width={64}
                                                height={64}
                                                unoptimized
                                                className="h-16 w-16 shrink-0 rounded-xl object-cover"
                                            />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-neutral-900">{r.description}</p>
                                            {r.failureReason && (
                                                <p className="mt-0.5 text-xs text-neutral-800">AI: {r.failureReason}</p>
                                            )}
                                            <p className="mt-0.5 text-xs text-neutral-400">{formatDate(r.createdAt)}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <PrimaryBtn
                                            onClick={() =>
                                                run(
                                                    () => completeRequest(r.id),
                                                    () => setRequests((p) => p.filter((x) => x.id !== r.id)),
                                                )
                                            }
                                        >
                                            등록 완료
                                        </PrimaryBtn>
                                        <GhostBtn onClick={() => openReject({ kind: 'request', id: r.id })}>
                                            반려
                                        </GhostBtn>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ))}

                {!loading &&
                    !error &&
                    tab === 'reports' &&
                    (reports.length === 0 ? (
                        <Empty label={`${REPORT_FILTERS.find((f) => f.value === reportStatus)?.label} 제보가 없어요`} />
                    ) : (
                        <ul className="flex flex-col gap-3">
                            {reports.map((r) => (
                                <li key={r.id} className="rounded-2xl bg-white p-4 shadow-soft">
                                    <p className="font-medium text-neutral-900">{r.description}</p>
                                    <p className="mt-0.5 text-xs text-neutral-400">
                                        {r.reporterName ?? '알 수 없음'} · {formatDate(r.createdAt)}
                                    </p>
                                    {isPendingReports ? (
                                        <div className="mt-3 flex gap-2">
                                            <PrimaryBtn
                                                onClick={() =>
                                                    run(
                                                        () => acceptReport(r.id),
                                                        () => setReports((p) => p.filter((x) => x.id !== r.id)),
                                                    )
                                                }
                                            >
                                                채택
                                            </PrimaryBtn>
                                            <GhostBtn onClick={() => openReject({ kind: 'report', id: r.id })}>
                                                반려
                                            </GhostBtn>
                                        </div>
                                    ) : (
                                        <p className="mt-2 text-xs font-medium text-neutral-800">
                                            {reportStatus === 'ACCEPTED' ? '채택됨' : '반려됨'}
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ))}
            </main>

            {/* 반려 사유 모달 */}
            {rejectTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
                    onClick={closeReject}
                >
                    <div
                        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-pop"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="font-display text-lg text-neutral-900">반려 사유</h2>
                        <p className="mt-1 text-xs text-neutral-800">왜 반려하는지 적어주세요.</p>
                        <textarea
                            autoFocus
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            maxLength={200}
                            placeholder="예: 도감에 이미 있는 음식이에요"
                            className="mt-3 w-full resize-none rounded-xl border border-neutral-100 p-3 text-sm text-neutral-900 outline-none focus:border-watermelon-400"
                        />
                        <div className="mt-4 flex gap-2">
                            <GhostBtn onClick={closeReject}>취소</GhostBtn>
                            <button
                                onClick={confirmReject}
                                disabled={submitting || !reason.trim()}
                                className="min-h-touch flex-1 rounded-xl bg-watermelon-500 text-sm font-medium text-white disabled:opacity-50"
                            >
                                {submitting ? '반려 중…' : '반려하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`min-h-touch rounded-full px-4 text-sm font-medium transition ${
                active ? 'bg-watermelon-500 text-white' : 'bg-white text-neutral-800 shadow-soft'
            }`}
        >
            {children}
        </button>
    )
}

function FilterChip({
    active,
    onClick,
    children,
}: {
    active: boolean
    onClick: () => void
    children: React.ReactNode
}) {
    return (
        <button
            onClick={onClick}
            className={`min-h-touch rounded-full px-3 text-xs font-medium transition ${
                active ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-800 shadow-soft'
            }`}
        >
            {children}
        </button>
    )
}

function PrimaryBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className="min-h-touch flex-1 rounded-xl bg-watermelon-500 text-sm font-medium text-white"
        >
            {children}
        </button>
    )
}

function GhostBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className="min-h-touch flex-1 rounded-xl bg-neutral-100 text-sm font-medium text-neutral-800"
        >
            {children}
        </button>
    )
}

function Empty({ label }: { label: string }) {
    return <p className="py-16 text-center text-sm text-neutral-800">{label}</p>
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('ko-KR', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}
