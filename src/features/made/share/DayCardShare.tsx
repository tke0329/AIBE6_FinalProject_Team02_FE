import { useDayCardFilm } from './useDayCardFilm'
import { shareOrDownload } from './shareFilm'
import type { LogitDayCard } from '../logitTypes'

interface Props {
    dayCard: LogitDayCard
    /** 로그잇 이름. 카드 헤더에 날짜와 함께 올라간다 */
    title: string
}

/**
 * 공유용 하루 필름 (9:16)
 * 끼니가 차례로 전개되고, 재생이 끝나면 같은 그림을 MP4로 굽는다
 */
export function DayCardShare({ dayCard, title }: Props) {
    const { canvasRef, status, video, progress, shareFile, replay, width, height } = useDayCardFilm(dayCard, title)

    // 굽는 동안 눌리면 안 된다. iOS는 제스처 컨텍스트가 끊기면 공유를 거절하므로
    // 여기서 인코딩을 기다릴 수 없다 — 준비된 파일만 곧바로 넘긴다
    const handleShare = () => {
        if (shareFile) void shareOrDownload(shareFile)
    }

    const isVideo = shareFile?.type === 'video/mp4'

    return (
        <section aria-label="공유 카드" className="pt-2">
            <div className="relative overflow-hidden rounded-2xl shadow-card">
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    aria-label={`${dayCard.date} 하루 카드`}
                    className="block w-full"
                />
                {status === 'preparing' && <div className="absolute inset-0 animate-pulse bg-cream-200" aria-hidden />}
            </div>

            {status === 'idle' && (
                <div className="flex items-center gap-2 pt-2">
                    <button
                        type="button"
                        onClick={replay}
                        className="min-h-touch rounded-full bg-cream-200 px-4 text-sm font-bold text-content-secondary"
                    >
                        다시 보기
                    </button>

                    {video === 'encoding' && (
                        <span
                            aria-live="polite"
                            className="min-h-touch flex items-center px-1 text-sm font-bold text-content-tertiary"
                        >
                            영상 만드는 중 {Math.round(progress * 100)}%
                        </span>
                    )}

                    {video === 'ready' && (
                        <button
                            type="button"
                            onClick={handleShare}
                            className="min-h-touch rounded-full bg-orange-500 px-5 text-sm font-bold text-white"
                        >
                            {isVideo ? '영상 공유하기' : '사진 공유하기'}
                        </button>
                    )}
                </div>
            )}

            {video === 'failed' && (
                <p className="break-keep pt-2 text-sm font-bold text-content-primary">
                    영상을 만들지 못했어요. 잠시 뒤 다시 시도해 주세요.
                </p>
            )}

            {status === 'blocked' && (
                <p className="break-keep pt-2 text-sm font-bold text-content-primary">
                    사진을 불러오지 못해 카드를 만들 수 없어요.
                </p>
            )}
        </section>
    )
}
