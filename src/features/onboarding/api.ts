import { apiFetch } from "@/shared/lib/api";

export type OnboardingStatus = { onboardingCompleted: boolean };

// GET /api/v1/onboarding/status — 최초 진입 시 자동 노출 판단용
export function fetchOnboardingStatus(): Promise<OnboardingStatus> {
  return apiFetch<OnboardingStatus>("/api/v1/onboarding/status");
}

// POST /api/v1/onboarding/complete — 완료 처리 후 갱신된 상태 반환
export function postOnboardingComplete(): Promise<OnboardingStatus> {
  return apiFetch<OnboardingStatus>("/api/v1/onboarding/complete", {
    method: "POST",
  });
}
