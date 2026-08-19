import { useCallback, useEffect, useRef, useState } from 'react'
import { buildFilmLayout } from './slotSceneLayout'
import { drawFilmFrame } from './drawScenes'
import { filmFrameAt, finalFilmFrame, planTimeline } from './shareTimeline'
import { closeBitmaps, filmDecodeTargets, loadBitmaps } from './loadBitmaps'
import { encodeFilm, renderFinalPng } from './encodeFilm'
import { CARD_HEIGHT, CARD_WIDTH, fontsReady } from './shareCardTheme'
import type { DayCardFilmLayout } from './slotSceneLayout'
import type { FilmTimeline } from './shareTimeline'
import type { BitmapMap } from './loadBitmaps'
import type { LogitDayCard } from '../logitTypes'

/**
 * `blocked`는 카드를 못 만든 상태
 * 대부분 사진을 한 장도 불러오지 못한 경우다 — S3 CORS가 막히면 여기로 떨어진다
 */
export type FilmStatus = 'preparing' | 'playing' | 'idle' | 'blocked'

/** 공유할 파일을 만드는 상태. 화면 재생과 별개로 굴러간다 */
export type VideoStatus = 'waiting' | 'encoding' | 'ready' | 'failed'

interface Prepared {
    layout: DayCardFilmLayout
    timeline: FilmTimeline
    bitmaps: BitmapMap
}

function noop(): void {}

/** 끼니가 차례로 전개되는 필름을 준비·재생하고, 공유할 파일까지 만든다 */
export function useDayCardFilm(dayCard: LogitDayCard | null, title: string, emptyCaption: string) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const preparedRef = useRef<Prepared | null>(null)
    const rafRef = useRef(0)
    /** 재생이 끝나기를 기다리는 쪽. 화면을 떠나면 대신 풀어 줘야 흐름이 매달리지 않는다 */
    const doneRef = useRef<(() => void) | null>(null)

    const [status, setStatus] = useState<FilmStatus>('preparing')
    const [video, setVideo] = useState<VideoStatus>('waiting')
    const [progress, setProgress] = useState(0)
    const [shareFile, setShareFile] = useState<File | null>(null)

    const play = useCallback((onDone: () => void) => {
        const prepared = preparedRef.current
        const ctx = canvasRef.current?.getContext('2d')
        if (!prepared || !ctx) {
            onDone()
            return
        }

        cancelAnimationFrame(rafRef.current)
        doneRef.current = onDone

        const finish = () => {
            drawFilmFrame(ctx, prepared.layout, prepared.bitmaps, finalFilmFrame(prepared.layout))
            setStatus('idle')
            doneRef.current = null
            onDone()
        }

        // 움직임을 줄이도록 설정한 사용자에게는 마지막 화면만 보여 준다
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
            finish()
            return
        }

        setStatus('playing')
        const startedAt = performance.now()
        const step = (now: number) => {
            const elapsed = now - startedAt
            if (elapsed >= prepared.timeline.totalMs) {
                finish()
                return
            }
            drawFilmFrame(
                ctx,
                prepared.layout,
                prepared.bitmaps,
                filmFrameAt(prepared.layout, prepared.timeline, elapsed),
            )
            rafRef.current = requestAnimationFrame(step)
        }
        rafRef.current = requestAnimationFrame(step)
    }, [])

    const replay = useCallback(() => play(noop), [play])

    useEffect(() => {
        if (!dayCard) return

        let live = true
        setStatus('preparing')
        setVideo('waiting')
        setProgress(0)
        setShareFile(null)

        /** 준비해서 한 번 보여 준다. 끝까지 갔으면 구울 재료를 돌려준다 */
        const show = async (): Promise<Prepared | null> => {
            // 폰트보다 먼저 그리면 첫 프레임만 폴백 글꼴로 나온다
            await fontsReady()

            // 배치를 먼저 잡아야 어느 사진을 디코드할지 알 수 있다
            const layout = buildFilmLayout(dayCard, title, emptyCaption)
            const targets = filmDecodeTargets(layout)
            const bitmaps = await loadBitmaps(targets)
            if (!live) {
                closeBitmaps(bitmaps)
                return null
            }

            const prepared: Prepared = { layout, timeline: planTimeline(layout), bitmaps }
            preparedRef.current = prepared

            // 담은 것이 있는데 한 장도 못 받았으면 그릴 것이 없다
            if (targets.length > 0 && bitmaps.size === 0) {
                setStatus('blocked')
                return null
            }

            // 재생이 끝난 뒤에 굽는다. 같이 돌리면 메인 스레드를 나눠 써 애니메이션이 끊긴다
            await new Promise<void>((resolve) => play(resolve))
            return live ? prepared : null
        }

        const bake = async (prepared: Prepared) => {
            setVideo('encoding')

            // 프레임마다 올리면 20초짜리에 588번 리렌더가 난다. 보이는 눈금이 바뀔 때만 올린다
            let shown = -1
            const onProgress = (ratio: number) => {
                const percent = Math.round(ratio * 100)
                if (percent === shown) return
                shown = percent
                setProgress(percent / 100)
            }

            const mp4 = await encodeFilm(prepared.layout, prepared.timeline, prepared.bitmaps, {
                onProgress,
                isAborted: () => !live,
            })
            if (!live) return

            if (mp4) {
                setShareFile(new File([mp4], `catcheat-${dayCard.date}.mp4`, { type: 'video/mp4' }))
                setVideo('ready')
                return
            }

            // WebCodecs가 없거나 인코더가 거절했다. 마지막 화면 한 장으로 물러난다
            const png = await renderFinalPng(prepared.layout, prepared.bitmaps)
            if (!live) return
            if (png) {
                setShareFile(new File([png], `catcheat-${dayCard.date}.png`, { type: 'image/png' }))
                setVideo('ready')
            } else {
                setVideo('failed')
            }
        }

        /**
         * 두 구간을 따로 받는다
         * 하나로 묶으면 재생까지 끝난 뒤 인코딩만 실패했는데도 카드가 없다고 말하게 된다
         */
        const run = async () => {
            let prepared: Prepared | null
            try {
                prepared = await show()
            } catch {
                // 어디서 깨지든 자리 표시자가 영원히 도는 화면으로 굳지 않게 한다
                if (live) setStatus('blocked')
                return
            }
            if (!prepared) return

            try {
                await bake(prepared)
            } catch {
                // 카드는 이미 화면에 있다. 영상만 포기한다
                if (live) setVideo('failed')
            }
        }

        void run()

        return () => {
            live = false
            cancelAnimationFrame(rafRef.current)
            // 재생 도중에 떠나면 기다리던 쪽을 풀어 준다
            doneRef.current?.()
            doneRef.current = null
            if (preparedRef.current) {
                closeBitmaps(preparedRef.current.bitmaps)
                preparedRef.current = null
            }
        }
        // 빈 칸 문구가 바뀌면 프레임이 달라지므로 다시 굽는다
    }, [dayCard, title, emptyCaption, play])

    return {
        canvasRef,
        status,
        video,
        /** 인코딩 진행도 0~1 */
        progress,
        shareFile,
        replay,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
    }
}
