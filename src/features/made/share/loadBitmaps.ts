import type { DayCardFilmLayout } from './slotSceneLayout'
import type { DayCardPhoto } from '../logitTypes'

/** photoId → 디코드된 비트맵. 실패했거나 아예 그리지 않는 사진은 들어오지 않는다 */
export type BitmapMap = Map<number, ImageBitmap>

/** 날아오는 동안 칸 크기의 1.6배까지 커진다. 그보다 조금만 넉넉하게 */
const FLIGHT_SCALE = 1.65

/**
 * 칸에 그려질 만큼만 디코드한다. 원본이 4000px여도 그대로 들고 있을 이유가 없다
 *
 * 격자에 맞춰 잡는 것이 중요하다 — 상수로 고정하면 12명일 때(칸 195px) 필요 없이 크게 들고 있고,
 * 4명일 때(칸 300px)는 되레 모자라 날아오는 순간 뿌옇게 늘어난다
 */
function coverWidth(cellSize: number): number {
    return Math.ceil(cellSize * FLIGHT_SCALE)
}

export interface DecodeTarget {
    photo: DayCardPhoto
    width: number
}

/**
 * 공유 카드에 그릴 사진을 미리 디코드한다.
 *
 * 두 가지를 여기서 해결한다.
 * - **오염(taint)**: `fetch` → `Blob` → `createImageBitmap`으로 가져오면 캔버스가 오염되지 않는다.
 *   CORS가 막혀 있으면 캔버스가 막히는 게 아니라 **fetch 단계에서 실패**한다
 * - **만료**: presigned URL은 10분이면 죽는다. 한 번 비트맵으로 만들어 두면 그 뒤로는 URL과 무관하다
 *
 * 한 장이 실패해도 전체를 실패시키지 않는다 — 그 칸만 빈 자리로 그린다
 */
export async function loadBitmaps(targets: DecodeTarget[]): Promise<BitmapMap> {
    const bitmaps: BitmapMap = new Map()

    await Promise.all(
        targets.map(async ({ photo, width }) => {
            if (!photo.imageUrl) return
            try {
                const response = await fetch(photo.imageUrl, { mode: 'cors' })
                if (!response.ok) return
                const blob = await response.blob()
                bitmaps.set(photo.photoId, await createImageBitmap(blob, { resizeWidth: width, resizeQuality: 'high' }))
            } catch {
                // 이 사진만 포기한다
            }
        }),
    )

    return bitmaps
}

/** 비트맵은 GC를 기다리지 않는다. 화면을 떠날 때 직접 닫는다 */
export function closeBitmaps(bitmaps: BitmapMap): void {
    bitmaps.forEach((bitmap) => bitmap.close())
    bitmaps.clear()
}

/**
 * 순차 전개에서 실제로 그려지는 사진 — **사람당 대표 1장**과 요약 모자이크뿐이다
 * 나머지는 뒤에 겹친 단색 카드와 배지 숫자로 표현되므로 디코드할 이유가 없다
 * 12명 × 6끼니에서 240장 → 최대 72장으로 준다
 */
export function filmDecodeTargets(layout: DayCardFilmLayout): DecodeTarget[] {
    const seen = new Set<number>()
    const targets: DecodeTarget[] = []
    const width = coverWidth(layout.grid.size)

    layout.scenes.forEach((scene) => {
        scene.flight.forEach((index) => {
            const photo = scene.cells[index].photo
            if (!photo || seen.has(photo.photoId)) return
            seen.add(photo.photoId)
            targets.push({ photo, width })
        })
    })

    layout.mosaic.forEach((photo) => {
        if (seen.has(photo.photoId)) return
        seen.add(photo.photoId)
        targets.push({ photo, width })
    })

    return targets
}
