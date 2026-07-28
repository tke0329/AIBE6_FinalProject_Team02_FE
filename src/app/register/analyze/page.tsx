'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RegisterAnalyze } from '@/features/register/RegisterAnalyze';
import { useRegisterFlow } from '@/features/register/RegisterFlowContext';
import { ROUTES } from '@/shared/lib/routes';

/** `/register/analyze` 등록 2단계 — 사진이 고른 음식과 맞는지 AI가 확인 */
export default function RegisterAnalyzePage() {
  const router = useRouter();
  const { uploadedPhotoKeys, selectedSlots } = useRegisterFlow();

  // 새로고침이나 직접 접근으로 상태가 비면 검증할 대상이 없다 — 1단계로 돌려보낸다
  const ready = uploadedPhotoKeys.length > 0 && selectedSlots.length > 0;

  useEffect(() => {
    if (!ready) router.replace(ROUTES.register);
  }, [ready, router]);

  if (!ready) return null;

  return (
    <RegisterAnalyze
      onBack={() => router.push(ROUTES.register)}
      onProceed={() => router.push(ROUTES.registerRecord)} />);

}
