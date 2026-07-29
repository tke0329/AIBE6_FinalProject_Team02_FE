'use client';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import {
    acceptReport,
    completeRequest,
    fetchPendingReports,
    fetchPendingRequests,
    rejectReport,
    rejectRequest,
} from './api';
import type { FoodRegistrationRequest, FoodReport } from './types';

type Tab = 'reports' | 'requests';

export function AdminConsole() {
  const [tab, setTab] = useState<Tab>('requests');
  const [reports, setReports] = useState<FoodReport[]>([]);
  const [requests, setRequests] = useState<FoodRegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 현재 탭에 맞는 목록을 불러온다.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'reports') setReports(await fetchPendingReports());
      else setRequests(await fetchPendingRequests());
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했어요');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  // 처리(채택/완료/반려) 후 목록에서 해당 항목을 걷어낸다 — 남은 것만 다시 보여준다.
  async function run(action: () => Promise<void>, onDone: () => void) {
    try {
      await action();
      onDone();
    } catch (e) {
      alert(e instanceof Error ? e.message : '처리에 실패했어요');
    }
  }

  const askReason = () => window.prompt('반려 사유를 입력하세요')?.trim() || null;

  return (
    <div className="flex h-full flex-col bg-cream-100">
      <header className="px-5 py-4">
        <h1 className="font-display text-xl text-brown">관리자 콘솔</h1>
      </header>

      {/* 탭 */}
      <div className="flex gap-2 px-5">
        <TabButton active={tab === 'requests'} onClick={() => setTab('requests')}>등록 요청</TabButton>
        <TabButton active={tab === 'reports'} onClick={() => setTab('reports')}>제보</TabButton>
      </div>

      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6 pt-4">
        {loading && <p className="py-10 text-center text-sm text-brown-soft">불러오는 중…</p>}
        {error && !loading && (
          <p className="py-10 text-center text-sm text-red-500">{error}</p>
        )}

        {!loading && !error && tab === 'requests' && (
          requests.length === 0
            ? <Empty label="대기 중인 등록 요청이 없어요" />
            : <ul className="flex flex-col gap-3">
                {requests.map((r) => (
                  <li key={r.id} className="rounded-2xl bg-white p-4 shadow-soft">
                    <div className="flex gap-3">
                      {r.evidenceUrl && (
                        <Image src={r.evidenceUrl} alt="증빙 사진"
                             className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-brown">{r.description}</p>
                        {r.failureReason && (
                          <p className="mt-0.5 text-xs text-brown-soft">AI: {r.failureReason}</p>
                        )}
                        <p className="mt-0.5 text-xs text-brown-muted">{formatDate(r.createdAt)}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <PrimaryBtn onClick={() => run(
                        () => completeRequest(r.id),
                        () => setRequests((prev) => prev.filter((x) => x.id !== r.id)))}>
                        등록 완료
                      </PrimaryBtn>
                      <GhostBtn onClick={() => {
                        const reason = askReason();
                        if (!reason) return;
                        run(() => rejectRequest(r.id, reason),
                            () => setRequests((prev) => prev.filter((x) => x.id !== r.id)));
                      }}>
                        반려
                      </GhostBtn>
                    </div>
                  </li>
                ))}
              </ul>
        )}

        {!loading && !error && tab === 'reports' && (
          reports.length === 0
            ? <Empty label="대기 중인 제보가 없어요" />
            : <ul className="flex flex-col gap-3">
                {reports.map((r) => (
                  <li key={r.id} className="rounded-2xl bg-white p-4 shadow-soft">
                    <p className="font-medium text-brown">{r.description}</p>
                    <p className="mt-0.5 text-xs text-brown-muted">{formatDate(r.createdAt)}</p>
                    <div className="mt-3 flex gap-2">
                      <PrimaryBtn onClick={() => run(
                        () => acceptReport(r.id),
                        () => setReports((prev) => prev.filter((x) => x.id !== r.id)))}>
                        채택
                      </PrimaryBtn>
                      <GhostBtn onClick={() => {
                        const reason = askReason();
                        if (!reason) return;
                        run(() => rejectReport(r.id, reason),
                            () => setReports((prev) => prev.filter((x) => x.id !== r.id)));
                      }}>
                        반려
                      </GhostBtn>
                    </div>
                  </li>
                ))}
              </ul>
        )}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick}
      className={`min-h-touch rounded-full px-4 text-sm font-medium transition ${
        active ? 'bg-orange-500 text-white' : 'bg-white text-brown-soft shadow-soft'}`}>
      {children}
    </button>
  );
}

function PrimaryBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="min-h-touch flex-1 rounded-xl bg-orange-500 text-sm font-medium text-white">
      {children}
    </button>
  );
}

function GhostBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="min-h-touch flex-1 rounded-xl bg-cream-200 text-sm font-medium text-brown-soft">
      {children}
    </button>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="py-16 text-center text-sm text-brown-soft">{label}</p>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}