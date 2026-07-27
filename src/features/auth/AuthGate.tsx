"use client";

import { useAuth } from "@/features/auth/AuthContext";
import { ROUTES } from "@/shared/lib/routes";
import { useAppState } from "@/shared/store/AppStateProvider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

// 인증이 필요 없는 공개 경로 (로그인 화면 · OAuth 도착지)
const PUBLIC_PATHS: string[] = [ROUTES.login, ROUTES.oauthCallback];

/**
 * 앱 전역 인증/온보딩 라우팅 가드
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  const { onboardingSeen } = useAppState();

  const isPublic = PUBLIC_PATHS.includes(pathname);
  // 판단에 필요한 두 상태가 모두 확정됐는지 (auth 확인 끝 + 온보딩 상태 수신)
  const ready = !loading && onboardingSeen !== null;

  // 온보딩으로 보내야 하는 상황 (온보딩 페이지 자체는 예외 — 다시보기 포함)
  const needsOnboarding =
    isAuthenticated &&
    onboardingSeen === false &&
    pathname !== ROUTES.onboarding;

  useEffect(() => {
    if (isPublic || !ready) return;

    if (!isAuthenticated) {
      router.replace(ROUTES.login);
      return;
    }
    if (needsOnboarding) router.replace(ROUTES.onboarding);
  }, [isPublic, ready, isAuthenticated, needsOnboarding, router]);

  // 공개 경로는 상태와 무관하게 즉시 렌더
  if (isPublic) return <>{children}</>;

  // 상태 미확정이거나 리다이렉트 대상이면 로딩 표시 (플래시 방지)
  if (!ready || !isAuthenticated || needsOnboarding) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">불러오는 중…</p>
      </div>
    );
  }

  return <>{children}</>;
}
