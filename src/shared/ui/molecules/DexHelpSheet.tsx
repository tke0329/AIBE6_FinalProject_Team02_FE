import React from 'react'
import { SparklesIcon, UsersIcon } from 'lucide-react'
import { BottomSheet } from './BottomSheet'

type HelpKind = 'basic' | 'made' | 'challenge'

interface Props {
    kind: HelpKind
    onClose: () => void
}

const helpCopy: Record<HelpKind, { title: string; items: Array<{ icon: React.ReactNode; text: string }> }> = {
    basic: {
        title: '기본 도감 사용법',
        items: [
            {
                icon: <SparklesIcon size={17} aria-hidden />,
                text: '음식 사진을 찍으면 AI가 도감 음식을 찾아줘요.',
            },
            {
                icon: <span aria-hidden>🗂️</span>,
                text: '등록하면 음식 칸이 해금되고 기록 카드가 쌓여요.',
            },
            {
                icon: <span aria-hidden>🏷️</span>,
                text: '카테고리 태그로 원하는 음식만 빠르게 볼 수 있어요.',
            },
        ],
    },
    made: {
        title: '제작 도감 사용법',
        items: [
            {
                icon: <UsersIcon size={17} aria-hidden />,
                text: '함께 만드는 사람과 음식 기록 카드를 공유하는 도감이에요.',
            },
            {
                icon: <SparklesIcon size={17} aria-hidden />,
                text: '등록하기로 새 카드를 추가하고, 태그를 함께 남겨 보세요.',
            },
            {
                icon: <span aria-hidden>🔎</span>,
                text: '카드명·장소·#태그로 기록을 검색할 수 있어요.',
            },
        ],
    },
    challenge: {
        title: '챌린지 도감 사용법',
        items: [
            {
                icon: <UsersIcon size={17} aria-hidden />,
                text: '다른 유저와 함께 음식 목표를 채우는 공간이에요.',
            },
            {
                icon: <SparklesIcon size={17} aria-hidden />,
                text: '내 챌린지에서 진행 상황을, 탐색에서 새 챌린지를 확인해요.',
            },
            {
                icon: <span aria-hidden>🏆</span>,
                text: '챌린지 상세에서 내 기록과 참가자 랭킹을 볼 수 있어요.',
            },
        ],
    },
}

/** §3.2 HelpIcon이 여는 도움말 시트. 도감 3종이 공유 */
export function DexHelpSheet({ kind, onClose }: Props) {
    const content = helpCopy[kind]

    return (
        <BottomSheet title={content.title} onClose={onClose} maxHeightClass="max-h-[70%]">
            <div className="no-scrollbar space-y-3 overflow-y-auto px-5 pb-8 pt-4">
                {content.items.map((item, index) => (
                    <div
                        key={index}
                        className="flex items-start gap-3 rounded-2xl bg-surface-card p-3 text-sm text-content-secondary shadow-card"
                    >
                        <span className="mt-1 shrink-0 text-action-primary">{item.icon}</span>
                        <p>{item.text}</p>
                    </div>
                ))}
            </div>
        </BottomSheet>
    )
}
