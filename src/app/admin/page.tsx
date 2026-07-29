'use client';

import { AdminConsole } from '@/features/admin/AdminConsole';
import { useAuth } from '@/features/auth/AuthContext';
import { ROUTES } from '@/shared/lib/routes';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** `/admin` 관리자 콘솔. ADMIN 권한만 접근할 수 있다. */
export default function AdminPageRoute() {
  const router = useRouter();
  const { me, loading } = useAuth();

  const isAdmin = me?.role === 'ADMIN';

  useEffect(() => {
    // 인증 확인이 끝났는데 ADMIN이 아니면 홈으로 돌려보낸다.
    if (!loading && !isAdmin) router.replace(ROUTES.home);
  }, [loading, isAdmin, router]);

  // 확인 중이거나 리다이렉트 대상이면 콘솔을 안 그린다(비관리자에게 잠깐 보이는 것 방지).
  if (loading || !isAdmin) {
    return (
      <div className="flex h-full items-center justify-center bg-cream-100">
        <p className="text-sm text-brown-soft">불러오는 중…</p>
      </div>
    );
  }

  return <AdminConsole />;
}