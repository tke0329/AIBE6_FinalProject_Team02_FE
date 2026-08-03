'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MadeDexList } from '@/features/made/MadeDexList';
import { createMadeDex, fetchMyMadeDexes } from '@/features/made/api';
import type { MadeDexSummary, MadeDexVisibility } from '@/features/made/types';
import { getTabHref, ROUTES } from '@/shared/lib/routes';

/** `/made` 제작 도감 목록 */
export default function MadeDexListPage() {
  const router = useRouter();
  const [dexes, setDexes] = useState<MadeDexSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setDexes(await fetchMyMadeDexes());
      setError(null);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : '도감 목록을 불러오지 못했어요.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // 개설 실패는 화면에서 잡아 인라인 폼에 띄운다
  const create = async (name: string, visibility: MadeDexVisibility) => {
    await createMadeDex({ name, visibility });
    await load();
  };

  return (
    <MadeDexList
      dexes={dexes}
      loading={loading}
      error={error}
      onCreate={create}
      onOpenDex={(dexId) => router.push(ROUTES.madeDex(dexId))}
      onJoinWithCode={() => router.push(ROUTES.madeJoin)}
      onTab={(tab) => router.push(getTabHref(tab))}
    />
  );
}
