'use client';

import { ChallengeCreate } from '@/features/challenge/ChallengeCreate';
import { createChallenge, fetchCreationTickets } from '@/features/challenge/api';
import { uploadImageToS3 } from '@/shared/lib/upload';
import { ROUTES } from '@/shared/lib/routes';
import { useAppState } from '@/shared/store/AppStateProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const MONTHLY_LIMIT = 3;

/** `/challenge/new` 챌린지 개설 (월 3회 제한, §6) */
export default function ChallengeCreatePage() {
  const router = useRouter();
  const { customBadge, setCustomBadge } = useAppState();

  // 이번 달 개설 횟수 = 3 - 남은 개설권 (서버 기준)
  const [createdThisMonth, setCreatedThisMonth] = useState(0);
  useEffect(() => {
    fetchCreationTickets()
      .then((t) => setCreatedThisMonth(MONTHLY_LIMIT - t.remaining))
      .catch(() => {});
  }, []);

  return (
    <ChallengeCreate
      createdThisMonth={createdThisMonth}
      customBadge={customBadge}
      onBack={() => {
        setCustomBadge(null);
        router.push(ROUTES.challenge);
      }}
      onCreate={async (challenge) => {
        try {
          // 목표별 사진을 S3에 올려 key 확보 → slots.imageKey로 전송
          const slots = await Promise.all(
            (challenge.targetRestaurants ?? []).map(async (t) => {
              const imageKey = t.file
                ? (await uploadImageToS3(t.file, t.file.name)).key
                : null;
              return { foodName: t.name, imageKey };
            }),
          );
          await createChallenge({
            name: challenge.title,
            challengeType: 'COLLECTION',   // 유형 UI 붙기 전 기본값
            periodType: 'PERMANENT',       // 기한 UI 붙기 전 기본값(상시)
            rewardBadgeId: null,           // 뱃지 시스템 연동 전
            slots,
          });
          setCustomBadge(null);
          router.push(ROUTES.challenge);   // 목록/상세는 아직 mock → 우선 목록으로
        } catch (e) {
          alert(e instanceof Error ? e.message : '챌린지 개설에 실패했어요');
        }
      }}
      onCustomBadge={() => router.push(ROUTES.challengeNewBadge)}
      onUsePreset={() => setCustomBadge(null)} />);
}