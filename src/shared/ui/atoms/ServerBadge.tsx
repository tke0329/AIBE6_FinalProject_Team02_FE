import { AwardIcon } from 'lucide-react';

interface Props {
  /** 뱃지 이미지 경로/URL. null이면 아이콘으로 대체 렌더 */
  imageUrl: string | null;
  name: string;
  size?: number;
}

/**
 * 서버에서 온 뱃지(운영진/챌린지)를 렌더. image_url이 있으면 이미지, 없으면 아이콘.
 * (하드코딩 BadgeId 기반 EquippedBadge와 별개 — 서버 데이터 전용)
 */
export function ServerBadge({ imageUrl, name, size = 17 }: Props) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
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
