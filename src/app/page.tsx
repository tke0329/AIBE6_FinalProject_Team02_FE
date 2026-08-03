'use client';

import { DexCategoryList } from '@/features/dex/DexCategoryList';
import { getTabHref, rememberBasicDexRoute, ROUTES } from '@/shared/lib/routes';
import { useAppState, useDexState } from '@/shared/store/AppStateProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** `/` 기본 도감 카테고리 목록 (인증/온보딩 진입 분기는 AuthGate가 전담) */
export default function DexHomePage() {
  const router = useRouter();
  const { entries, entriesLoading, collectedIds } = useDexState();
  const { startRegistration } = useAppState();

  useEffect(() => {
    rememberBasicDexRoute(ROUTES.home);
  }, []);

  if (entriesLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-cream-100">
        <p className="text-sm text-brown-soft">불러오는 중…</p>
      </div>
    );
  }

  return (
    <DexCategoryList
      entries={entries}
      collectedIds={collectedIds}
      onOpenCategory={(category) => router.push(ROUTES.basicDex(category))}
      onRegister={() => {
        startRegistration('basic');
        router.push(ROUTES.register);
      }}
      onTab={(tab) => router.push(getTabHref(tab))} />);

}
