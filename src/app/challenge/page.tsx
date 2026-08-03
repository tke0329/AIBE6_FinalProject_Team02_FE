'use client';

import { ChallengeCountHome } from '@/features/challenge/ChallengeCountHome';
import { useAppState } from '@/shared/store/AppStateProvider';
import { getTabHref, ROUTES } from '@/shared/lib/routes';
import { ChallengeSummary, fetchChallenges, fetchCreationTickets } from '@/features/challenge/api';
import { ChallengeData } from '@/features/challenge/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const MONTHLY_LIMIT = 3;

/** 서버 요약 → 화면 카드 형태로 변환 */
function toChallengeData(c: ChallengeSummary): ChallengeData {
  return {
    id: String(c.id),
    title: c.name,
    emoji: '🏆',
    tag: c.challengeType === 'FIRST_COME' ? '선착순' : '수집형',
    dday: c.periodType === 'PERMANENT' ? '상시' : (c.endsAt ? ddayLabel(c.endsAt) : '기간한정'),
    participants: c.participantCount,
    owner: '',
  };
}

function ddayLabel(endsAt: string): string {
  const days = Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86_400_000);
  return days >= 0 ? \D-\\ : '종료';
}

/** \/challenge\ 챌린지 도감 홈 */
export default function ChallengeHomePage() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<ChallengeData[]>([]);
  const [createdThisMonth, setCreatedThisMonth] = useState(0);

  useEffect(() => {
    fetchChallenges('ONGOING')
      .then((list) => setChallenges(list.map(toChallengeData)))
      .catch(() => {});
    fetchCreationTickets()
      .then((t) => setCreatedThisMonth(MONTHLY_LIMIT - t.remaining))
      .catch(() => {});
  }, []);

  return (
    <ChallengeCountHome
      challenges={challenges}
      createdThisMonth={createdThisMonth}
      onOpenChallenge={(challenge) => router.push(ROUTES.challengeDetail(challenge.id))}
      onCreateChallenge={() => router.push(ROUTES.challengeNew)}
      onTab={(tab) => router.push(getTabHref(tab))} />);
}
