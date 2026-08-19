import { DexEntry } from '@/shared/data/dex'
import { getLocalDexIllustrationUrl } from '@/shared/lib/dexIllustrations'
import { Badge, BottomSheet, Button } from '@/shared/ui'
import { PlusIcon } from 'lucide-react'

interface Props {
    entry: DexEntry
    onClose: () => void
    onRegister: () => void
}

/**
 * 미해금 칸을 눌렀을 때 올라오는 시트 (챌린짓 미리보기와 같은 자리·같은 모양).
 *
 * ## 왜 상세로 보내지 않는가
 *
 * `/dex/[id]` 상세는 **내가 등록한 카드를 보는 화면**이다. 미해금 칸에는 그 카드가
 * 하나도 없어서, 들어가면 사진 자리에 기본 일러스트 한 장과 "위치 없음 · 수집",
 * 별 1개가 뜬다 — 없는 기록을 있는 것처럼 그리고, 위·아래 스와이프로 다른 도감을
 * 넘기는 조작도 해금된 칸끼리만 도는 것이라 여기선 아무 데도 가지 않는다.
 * **화면을 통째로 갈아 끼우고 얻는 것이 없다.**
 *
 * 미해금 칸에서 사용자가 할 수 있는 일은 하나뿐이다 — 등록. 그 하나를 시트로 꺼내면
 * 격자를 그대로 둔 채 누르고, 아니면 닫고 옆 칸을 눌러볼 수 있다.
 */
export function DexLockedSheet({ entry, onClose, onRegister }: Props) {
    const illustration = entry.illustrationUrl ?? getLocalDexIllustrationUrl(entry)

    return (
        <BottomSheet title={entry.name} onClose={onClose} maxHeightClass="max-h-[88%]">
            <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-8 pt-3">
                <div className="relative mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element -- 서버 URL과 로컬 일러스트가 섞여 remotePatterns로 못 묶음 */}
                    <img
                        src={illustration}
                        alt={`${entry.name} 미리보기`}
                        // 상세 화면의 큰 사진과 같은 담기 방식(contain + 여백). 다른 건 흑백이라는 것뿐이다
                        className="aspect-square w-full rounded-2xl bg-neutral-50 object-contain p-8 grayscale"
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/20">
                        <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white">미해금</span>
                    </div>
                </div>

                <Badge variant="type">{entry.category}</Badge>
                <p className="mt-2 text-sm text-content-secondary">
                    아직 열리지 않은 칸이에요. 이 음식을 먹고 사진을 등록하면 베이짓에 채워져요.
                </p>

                <Button
                    size="cta"
                    fullWidth
                    onClick={onRegister}
                    icon={<PlusIcon size={18} strokeWidth={2.75} aria-hidden />}
                    className="mt-4"
                >
                    등록하기
                </Button>
            </div>
        </BottomSheet>
    )
}
