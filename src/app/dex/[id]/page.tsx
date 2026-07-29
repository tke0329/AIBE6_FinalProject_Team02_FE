'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { DexDetail } from '@/features/dex/DexDetail';
import { fetchMyBasicDexDetail } from '@/features/dex/api';
import { useDexState } from '@/shared/store/AppStateProvider';
import { ROUTES, TAB_HREF } from '@/shared/lib/routes';
import { DexEntry } from '@/shared/data/dex';

/** `/dex/[id]` 도감 카드 상세 */
export default function DexDetailPage() {
  const router = useRouter();
  const { id } = useParams<{id: string;}>();
  const { entries, findEntry, collectedEntries } = useDexState();
  const [detailEntry, setDetailEntry] = useState<DexEntry | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);

  const listEntry = findEntry(Number(id));

  // 목록 조회엔 등록 카드(사진/메모/위치) 내용이 없어 슬롯 단위로 따로 불러온다.
  useEffect(() => {
    let cancelled = false;
    setDetailLoading(true);
    fetchMyBasicDexDetail(Number(id))
      .then((detail) => {
        if (!cancelled) setDetailEntry(detail);
      })
      .catch(() => {
        // 실패하면 목록에 있던 요약 정보로 폴백한다 (카드 내용 없이).
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!listEntry) notFound();

  if (detailLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-cream-100">
        <p className="text-sm text-brown-soft">불러오는 중…</p>
      </div>);

  }

  const entry = detailEntry ?? listEntry;

  return (
    <DexDetail
      entry={entry}
      entries={entries}
      collectedEntries={collectedEntries}
      onBack={() => router.push(ROUTES.home)}
      onOpenEntry={(nextId) => router.replace(ROUTES.dexDetail(nextId))}
      onTab={(tab) => router.push(TAB_HREF[tab])} />);

}
