/** 챌린지 도감 (§6) — 개설자가 지정한 목표 리스트를 기본 도감형으로 해금 */

export interface RewardBadge {
  emoji: string;
  name: string;
  /** 뱃지 배경 톤 (Tailwind 클래스) */
  tone: string;
  customImage?: string;
  /** 프리셋 code */
  code?: string;
}

export interface ChallengeTarget {
  id: string;
  name: string;
  emoji?: string;
  /** 상세 도감 표시용 목표 음식 사진 (미해금이면 흑백) */
  imageUrl?: string;
  /** 개설 화면에서만 사용 — 업로드 전 로컬 파일 */
  file?: File | null;
}

export interface ChallengeData {
  id: string;
  title: string;
  emoji: string;
  tag: string;
  dday: string;
  participants: number;
  mine?: string;
  progress?: number;
  owner: string;
  joined?: boolean;
  completed?: boolean;
  isCreator?: boolean;
  target?: number;
  targetRestaurants?: ChallengeTarget[];
  completedTargetIds?: string[];
  rewardBadge?: RewardBadge;
}
