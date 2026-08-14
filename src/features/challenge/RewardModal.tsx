import { Trophy } from 'lucide-react'
import { resolveBadgeImage } from '@/shared/data/badgeAssets'
import { RewardBadgeInfo } from './api'

interface Props {
    badge: RewardBadgeInfo
    onClose: () => void
    onGoToBadges: () => void
}

/** 챌린지 완주 축하 + 획득 보상 뱃지 공개 팝업 */
export function RewardModal({ badge, onClose, onGoToBadges }: Props) {
    const image = resolveBadgeImage(badge.code, badge.imageUrl)
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className="w-full max-w-xs rounded-3xl bg-surface-raised p-6 text-center shadow-card"
                onClick={(event) => event.stopPropagation()}
            >
                <p className="font-display text-xl text-neutral-900">챌린짓 완주!</p>
                <p className="mt-1 text-sm text-neutral-400">보상 뱃지를 획득했어요</p>
                <div className="mx-auto mt-5 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-watermelon-50 shadow-card">
                    {image ? (
                        <img src={image} alt={badge.name} className="h-full w-full object-cover" />
                    ) : (
                        <Trophy size={40} className="text-watermelon-500" strokeWidth={2} />
                    )}
                </div>
                <p className="mt-4 font-display text-lg text-neutral-900">{badge.name}</p>
                <div className="mt-6 flex flex-col gap-2">
                    <button
                        onClick={onGoToBadges}
                        className="w-full rounded-2xl bg-watermelon-500 py-3 font-display text-content-on-action shadow-card"
                    >
                        보관함에서 보기
                    </button>
                    <button onClick={onClose} className="w-full py-2 text-sm font-bold text-neutral-400">
                        닫기
                    </button>
                </div>
            </div>
        </div>
    )
}
