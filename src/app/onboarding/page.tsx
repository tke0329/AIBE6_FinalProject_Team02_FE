"use client";

import { Onboarding } from "@/features/onboarding/Onboarding";
import { ROUTES } from "@/shared/lib/routes";
import { useAppState } from "@/shared/store/AppStateProvider";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * `/onboarding` 첫 실행 튜토리얼. 마이페이지에서 다시 볼 수 있음
 * `?from=my` 재관람 모드: 완료 처리(서버 재-POST) 없이 마이페이지로 복귀
 * 그 외(최초 진입): 완료 처리 후 홈으로
 */
export default function OnboardingPage() {
  const router = useRouter();
  const fromMy = useSearchParams().get("from") === "my";
  const { completeOnboarding } = useAppState();

  return (
    <Onboarding
      onDone={() => {
        if (fromMy) {
          router.replace(ROUTES.my);
          return;
        }
        completeOnboarding();
        router.replace(ROUTES.home);
      }}
    />
  );
}
