import { AwardIcon } from 'lucide-react';
import { resolveBadgeImage } from '@/shared/data/badgeAssets';

interface Props {
  /** 시스템 뱃지 식별자. public 정적 에셋 매핑용 (챌린지 커스텀은 없음) */
  code?: string | null;
  /** 업로드 이미지 URL(챌린지 커스텀, S3). 시스템 뱃지는 null */
  imageUrl?: string | null;
  name: string;
  size?: number;
}

/**
 * 서버에서 온 뱃지(운영진/챌린지)를 렌더.
 * 이미지 소스: 업로드(S3) 우선 → code 정적 에셋 → 둘 다 없으면 아이콘.
 * (하드코딩 BadgeId 기반 EquippedBadge와 별개 — 서버 데이터 전용)
 */
export function ServerBadge({ code = null, imageUrl = null, name, size = 17 }: Props) {
  const src = resolveBadgeImage(code, imageUrl);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        title={name}
        className="inline-block shrink-0 rounded-full object-contain"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      title={name}
      aria-label={name}
      className="inline-flex shrink-0 items-center text-orange-500"
      style={{ width: size, height: size }}
    >
      <AwardIcon size={size} strokeWidth={2.4} />
    </span>
  );
}
