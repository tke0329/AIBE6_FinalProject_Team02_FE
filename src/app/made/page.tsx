'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MadeDexList } from '@/features/made/MadeDexList';
import { fetchMyMadeDexes } from '@/features/made/api';
import type { MadeDexSummary } from '@/features/made/types';
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

  return (
    <MadeDexList
      dexes={dexes}
      loading={loading}
      error={error}
      onCreateNew={() => router.push(ROUTES.madeNew)}
      onOpenDex={(dexId) => router.push(ROUTES.madeDex(dexId))}
      onEnterCode={(code) => router.push(ROUTES.madeJoinWithCode(code))}
      onTab={(tab) => router.push(getTabHref(tab))}
    />
  );
}
