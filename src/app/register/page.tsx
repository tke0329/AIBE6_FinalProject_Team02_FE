'use client';

import { useRouter } from 'next/navigation';
import { RegisterUpload } from '@/features/register/RegisterUpload';
import { useRegisterFlow } from '@/features/register/RegisterFlowContext';
import { useRegistrationExitHref } from '@/features/register/useRegistrationExit';
import { useDexState } from '@/shared/store/AppStateProvider';
import { ROUTES } from '@/shared/lib/routes';

/** `/register` 등록 1단계 — 사진 올리기 + 음식 이름 고르기 */
export default function RegisterUploadPage() {
  const router = useRouter();
  const exitHref = useRegistrationExitHref();
  const { entries } = useDexState();
  const { photosReady, selectedSlots } = useRegisterFlow();

  return (
    <RegisterUpload
      entries={entries}
      canProceed={photosReady && selectedSlots.length > 0}
      onBack={() => router.push(exitHref)}
      onNext={() => router.push(ROUTES.registerAnalyze)} />);

}
