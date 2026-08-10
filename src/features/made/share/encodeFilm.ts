import { drawFilmFrame } from './drawScenes'
import { filmFrameAt, finalFilmFrame } from './shareTimeline'
import { CARD_HEIGHT, CARD_WIDTH } from './shareCardTheme'
import type { BitmapMap } from './loadBitmaps'
import type { FilmTimeline } from './shareTimeline'
import type { DayCardFilmLayout } from './slotSceneLayout'

/**
 * 필름을 MP4로 굽는다
 *
 * 화면 재생과 **같은 `drawFilmFrame`을 쓴다.** 미리 본 것과 공유한 것이 어긋나면
 * 어디가 틀렸는지 찾을 방법이 없다
 */

/** 초당 프레임 */
const FPS = 30

/**
 * 720×1280은 45×80 = 3600 매크로블록으로 **H.264 레벨 3.1 한계에 정확히 맞는다.**
 * Baseline → Main → High 순으로 물러난다. 저가 기기의 하드웨어 인코더는 Baseline을 가장 잘 받는다
 */
const CODEC_LADDER = ['avc1.42001f', 'avc1.4d001f', 'avc1.64001f']

/** 이만큼 굽고 한 번 쉰다. 안 쉬면 굽는 동안 화면이 얼어붙는다 */
const YIELD_EVERY = 8

type Mediabunny = typeof import('mediabunny')

let modulePromise: Promise<Mediabunny> | null = null

/**
 * 인코딩 라이브러리는 gzip 45KB다. 카드를 보기만 하는 사람에게까지 받게 할 이유가 없어
 * 실제로 구울 때 받는다 — 재생이 19초라 그동안 충분히 내려온다
 */
function loadMediabunny(): Promise<Mediabunny> {
    modulePromise ??= import('mediabunny')
    return modulePromise
}

export interface EncodeOptions {
    /** 0~1 */
    onProgress?: (ratio: number) => void
    /** 화면을 떠났는지. true가 되면 중간에 버린다 */
    isAborted?: () => boolean
}

function createCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
    const canvas = document.createElement('canvas')
    canvas.width = CARD_WIDTH
    canvas.height = CARD_HEIGHT
    const ctx = canvas.getContext('2d')
    return ctx ? { canvas, ctx } : null
}

function yieldToBrowser(): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, 0)
    })
}

/** WebCodecs 자체가 없는 브라우저가 아직 많다 */
function hasWebCodecs(): boolean {
    return typeof window !== 'undefined' && 'VideoEncoder' in window
}

/** 이 기기가 실제로 받아 주는 첫 코덱. 없으면 null */
async function pickCodecString(canEncodeVideo: Mediabunny['canEncodeVideo']): Promise<string | null> {
    for (const fullCodecString of CODEC_LADDER) {
        try {
            const ok = await canEncodeVideo('avc', {
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                fullCodecString,
            })
            if (ok) return fullCodecString
        } catch {
            // 이 코덱만 건너뛴다
        }
    }
    return null
}

/**
 * 필름 전체를 MP4로 굽는다. 못 구우면 null — 부르는 쪽이 정적 PNG로 물러난다
 *
 * 실시간으로 돌리지 않는다. 타임스탬프를 직접 계산해 최대한 빨리 돌린다 —
 * `requestAnimationFrame`으로 묶으면 20초짜리를 만드는 데 20초가 걸린다
 */
export async function encodeFilm(
    layout: DayCardFilmLayout,
    timeline: FilmTimeline,
    bitmaps: BitmapMap,
    options: EncodeOptions = {},
): Promise<Blob | null> {
    if (!hasWebCodecs()) return null

    // 라이브러리를 못 받아도 화면 재생은 이미 끝났다. 정적 이미지로 물러난다
    const mb = await loadMediabunny().catch(() => null)
    if (!mb) return null

    const codec = await pickCodecString(mb.canEncodeVideo)
    if (!codec) return null

    const surface = createCanvas()
    if (!surface) return null

    const output = new mb.Output({
        // moov 아톰이 파일 앞에 와야 한다. 뒤에 있으면 일부 플레이어·SNS가 재생하지 못한다
        format: new mb.Mp4OutputFormat({ fastStart: 'in-memory' }),
        target: new mb.BufferTarget(),
    })
    const source = new mb.CanvasSource(surface.canvas, {
        codec: 'avc',
        fullCodecString: codec,
        quality: mb.QUALITY_HIGH,
        latencyMode: 'quality',
    })
    output.addVideoTrack(source, { frameRate: FPS })

    const giveUp = async () => {
        try {
            await output.cancel()
        } catch {
            // 이미 끝났거나 시작도 못 했다
        }
        return null
    }

    try {
        await output.start()

        const total = Math.ceil((timeline.totalMs / 1000) * FPS)
        for (let index = 0; index < total; index += 1) {
            if (options.isAborted?.()) return await giveUp()

            drawFilmFrame(surface.ctx, layout, bitmaps, filmFrameAt(layout, timeline, (index * 1000) / FPS))
            // await로 인코더 backpressure를 받는다. 안 기다리면 프레임이 큐에 쌓여 메모리가 터진다
            await source.add(index / FPS, 1 / FPS)

            options.onProgress?.((index + 1) / total)
            if (index % YIELD_EVERY === YIELD_EVERY - 1) await yieldToBrowser()
        }

        await output.finalize()
        const buffer = output.target.buffer
        return buffer ? new Blob([buffer], { type: 'video/mp4' }) : null
    } catch {
        // 인코더가 중간에 죽어도 화면 재생은 이미 끝났다. 정적 이미지로 물러난다
        return await giveUp()
    }
}

/** WebCodecs가 없을 때의 대체 산출물. 마지막 요약 화면 한 장 */
export function renderFinalPng(layout: DayCardFilmLayout, bitmaps: BitmapMap): Promise<Blob | null> {
    const surface = createCanvas()
    if (!surface) return Promise.resolve(null)

    drawFilmFrame(surface.ctx, layout, bitmaps, finalFilmFrame(layout))
    return new Promise((resolve) => {
        surface.canvas.toBlob((blob) => resolve(blob), 'image/png')
    })
}
