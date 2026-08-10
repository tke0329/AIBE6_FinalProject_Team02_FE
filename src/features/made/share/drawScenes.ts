import { clamp, drawCountBadge, drawCover, drawStackLayer, roundRectPath, truncate } from './drawPrimitives'
import type { BitmapMap } from './loadBitmaps'
import {
    CARD_HEIGHT,
    CARD_WIDTH,
    CELL_RADIUS,
    COLOR,
    COLOR_DOOR,
    COLOR_DOOR_EDGE,
    COLOR_DOOR_LINE,
    COLOR_EMPTY_CELL,
    COLOR_EMPTY_TEXT,
    COLOR_HANDLE,
    COLOR_INNER,
    COLOR_INNER_WALL,
    COLOR_INNER_WALL_SHADE,
    COLOR_MEMO,
    COLOR_SHELF_BOARD,
    COLOR_SHELF_EDGE,
    COLOR_SHELF_SHADOW,
    PADDING,
    SCENE_HEADER_HEIGHT,
    SCENE_LABEL_HEIGHT,
    SCENE_NAME_HEIGHT,
    SHELF_BOARD_HEIGHT,
    STAT_GAP,
    STAT_HEIGHT,
    STAT_RADIUS,
    displayFont,
    sansFont,
} from './shareCardTheme'
import type { FilmFrame } from './shareTimeline'
import type { DayCardFilmLayout, FilmGrid, SlotCell, SlotScene } from './slotSceneLayout'

/** 그 끼니에 담지 않았음을 드러내는 문구 */
const EMPTY_LABEL = '🍚'

function lerp(from: number, to: number, amount: number): number {
    return from + (to - from) * amount
}

/** 착지에 무게감을 주려고 살짝 지나쳤다 돌아온다 */
function easeOutBack(t: number): number {
    const overshoot = 1.4
    return 1 + (overshoot + 1) * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2)
}

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
}

/** 냉장고 안. 크림이 아니라 차가운 회백색이라 문을 열 때 대비가 생긴다 */
function drawInterior(ctx: CanvasRenderingContext2D, door: number): void {
    ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
    ctx.fillStyle = COLOR_INNER
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

    // 좌우 안쪽 벽 — 깊이감. 색 띠로만 두면 벽으로 안 읽혀 안쪽에 그림자를 덧댄다
    const wall = 34
    ctx.fillStyle = COLOR_INNER_WALL
    ctx.fillRect(0, 0, wall, CARD_HEIGHT)
    ctx.fillRect(CARD_WIDTH - wall, 0, wall, CARD_HEIGHT)

    const left = ctx.createLinearGradient(wall, 0, wall + 20, 0)
    left.addColorStop(0, COLOR_INNER_WALL_SHADE)
    left.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = left
    ctx.fillRect(wall, 0, 20, CARD_HEIGHT)

    const right = ctx.createLinearGradient(CARD_WIDTH - wall, 0, CARD_WIDTH - wall - 20, 0)
    right.addColorStop(0, COLOR_INNER_WALL_SHADE)
    right.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = right
    ctx.fillRect(CARD_WIDTH - wall - 20, 0, 20, CARD_HEIGHT)

    // 위쪽 조명 띠 — 문이 열리는 동안 밝아진다
    ctx.save()
    ctx.globalAlpha = 0.55 * door
    const light = ctx.createLinearGradient(0, 0, 0, 140)
    light.addColorStop(0, '#FFFFFF')
    light.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = light
    ctx.fillRect(0, 0, CARD_WIDTH, 140)
    ctx.restore()
}

function drawHeader(ctx: CanvasRenderingContext2D, layout: DayCardFilmLayout): void {
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'

    ctx.font = displayFont(46)
    ctx.fillStyle = COLOR.title
    ctx.fillText(layout.dateLabel, PADDING, 44)

    ctx.font = sansFont(26, 700)
    ctx.fillStyle = COLOR.muted
    ctx.fillText(truncate(ctx, layout.title, CARD_WIDTH - PADDING * 2), PADDING, 104)
}

/**
 * 줄마다 선반 판. 칸이 선반 위에 놓인 반찬통처럼 보이게 한다
 * 끼니가 바뀌어도 선반은 그대로 있어야 하므로 장면이 아니라 냉장고 쪽에서 그린다
 */
function drawShelfBoards(ctx: CanvasRenderingContext2D, grid: FilmGrid): void {
    // 선반은 벽에서 벽까지 닿는다. 격자보다 넓게 빼야 냉장고 칸으로 읽힌다
    const left = grid.left - 16
    const width = grid.right - grid.left + 32
    grid.rowBottoms.forEach((bottom) => {
        ctx.fillStyle = COLOR_SHELF_SHADOW
        ctx.fillRect(left, bottom + SHELF_BOARD_HEIGHT, width, 7)

        ctx.fillStyle = COLOR_SHELF_BOARD
        roundRectPath(ctx, left, bottom, width, SHELF_BOARD_HEIGHT, 4)
        ctx.fill()

        // 판의 윗면. 유리 선반이 두께를 가진 것처럼 보인다
        ctx.fillStyle = COLOR_SHELF_EDGE
        ctx.fillRect(left + 4, bottom, width - 8, 3)
    })
}

/** 담지 않은 사람의 칸. 어둡게 남겨 누가 걸렀는지 드러낸다 */
function drawEmptyCell(ctx: CanvasRenderingContext2D, cell: SlotCell): void {
    ctx.fillStyle = COLOR_EMPTY_CELL
    roundRectPath(ctx, cell.x, cell.y, cell.size, cell.size, CELL_RADIUS)
    ctx.fill()

    // 이모지 한 글자라 칸 크기를 크게 먹여야 알아볼 수 있다. 글자 라벨 기준(0.11)이면 점으로 보인다
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = sansFont(clamp(cell.size * 0.34, 24, 96))
    ctx.fillStyle = COLOR_EMPTY_TEXT
    ctx.fillText(truncate(ctx, EMPTY_LABEL, cell.size - 16), cell.x + cell.size / 2, cell.y + cell.size / 2)
}

/** 착지한 칸. 대표가 위에 남고 나머지는 뒤에 겹친 카드로만 표현된다 */
function drawLandedCell(ctx: CanvasRenderingContext2D, cell: SlotCell, bitmaps: BitmapMap): void {
    // 선반에 닿은 그림자. 사진이 판 위에 놓인 것처럼 보이게 한다
    ctx.fillStyle = COLOR_SHELF_SHADOW
    roundRectPath(ctx, cell.x + 4, cell.y + cell.size - 6, cell.size - 8, 10, 5)
    ctx.fill()

    if (cell.photoCount > 2) drawStackLayer(ctx, cell.x, cell.y, cell.size, 0.05)
    if (cell.photoCount > 1) drawStackLayer(ctx, cell.x, cell.y, cell.size, -0.035)

    const bitmap = cell.photo ? bitmaps.get(cell.photo.photoId) : undefined
    ctx.save()
    roundRectPath(ctx, cell.x, cell.y, cell.size, cell.size, CELL_RADIUS)
    ctx.clip()
    if (bitmap) {
        drawCover(ctx, bitmap, cell.x, cell.y, cell.size)
    } else {
        // 못 불러온 사진은 빈 자리로 둔다. 화면 전체를 실패시키지 않는다
        ctx.fillStyle = COLOR.placeholder
        ctx.fillRect(cell.x, cell.y, cell.size, cell.size)
    }
    ctx.restore()

    if (cell.photoCount > 1) drawCountBadge(ctx, cell.x, cell.y, cell.size, cell.photoCount)
}

/** 닉네임은 담았든 아니든 늘 붙는다. 선반 판 아래에 온다 */
function drawCellName(ctx: CanvasRenderingContext2D, cell: SlotCell, hasPhoto: boolean): void {
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.font = sansFont(clamp(SCENE_NAME_HEIGHT * 0.62, 13, 19))
    ctx.fillStyle = hasPhoto ? COLOR.body : COLOR.muted
    ctx.fillText(
        truncate(ctx, cell.author, cell.size),
        cell.x + cell.size / 2,
        cell.y + cell.size + SHELF_BOARD_HEIGHT + 5,
    )
}

/**
 * 앞에서 안으로 밀어 넣는 원근 — 반찬통을 선반에 넣는 손짓
 * 크게 시작해 제 크기로 줄며 자리에 앉는다. 칸마다 흔들림 방향을 달리해 줄이 획일적으로 보이지 않게 한다
 */
function drawFlyingCell(
    ctx: CanvasRenderingContext2D,
    cell: SlotCell,
    bitmaps: BitmapMap,
    progress: number,
    index: number,
): void {
    const bitmap = cell.photo ? bitmaps.get(cell.photo.photoId) : undefined
    if (!bitmap) return

    const move = easeOutBack(progress)
    const settle = easeOutCubic(progress)
    const direction = index % 2 === 0 ? 1 : -1

    const x = lerp(CARD_WIDTH / 2 - cell.size / 2 + direction * 40, cell.x, move)
    const y = lerp(CARD_HEIGHT + 60, cell.y, move)
    const size = cell.size * lerp(1.6, 1, settle)
    const rotation = lerp((direction * 6 * Math.PI) / 180, 0, settle)

    ctx.save()
    ctx.translate(x + cell.size / 2, y + cell.size / 2)
    ctx.rotate(rotation)
    roundRectPath(ctx, -size / 2, -size / 2, size, size, CELL_RADIUS)
    ctx.clip()
    drawCover(ctx, bitmap, -size / 2, -size / 2, size)
    ctx.restore()
}

/** 한 끼니의 내용물. 냉장고 자체(내부·선반·헤더)는 바깥에서 이미 그려져 있다 */
function drawSlotScene(ctx: CanvasRenderingContext2D, scene: SlotScene, bitmaps: BitmapMap, frame: FilmFrame): void {
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.font = displayFont(34)
    ctx.fillStyle = COLOR.body
    ctx.fillText(scene.name, PADDING, SCENE_HEADER_HEIGHT + SCENE_LABEL_HEIGHT / 2)

    scene.cells.forEach((cell, index) => {
        if (frame.landed.has(index)) drawLandedCell(ctx, cell, bitmaps)
        else drawEmptyCell(ctx, cell)
        drawCellName(ctx, cell, cell.photo !== null)
    })

    // 날아오는 사진은 화면 위를 지난다 — 반드시 마지막에 그린다
    frame.flying.forEach((progress, index) => {
        drawFlyingCell(ctx, scene.cells[index], bitmaps, progress, index)
    })
}

/** 문 한 짝 */
function drawDoorPanel(
    ctx: CanvasRenderingContext2D,
    x: number,
    width: number,
    innerEdge: 'left' | 'right',
    withHandle: boolean,
): void {
    if (width <= 0) return

    ctx.fillStyle = COLOR_DOOR
    ctx.fillRect(x, 0, width, CARD_HEIGHT)

    // 가로 분할선 — 레트로 냉장고의 상하 구분
    ctx.fillStyle = COLOR_DOOR_LINE
    ctx.fillRect(x, CARD_HEIGHT * 0.34, width, 3)

    // 안쪽 모서리 그림자. 2D에 원근이 없어 이걸로 두께를 흉내 낸다
    const edgeWidth = 14
    const edgeX = innerEdge === 'left' ? x + width - edgeWidth : x
    const shade = ctx.createLinearGradient(edgeX, 0, edgeX + edgeWidth, 0)
    if (innerEdge === 'left') {
        shade.addColorStop(0, 'rgba(0,0,0,0)')
        shade.addColorStop(1, COLOR_DOOR_EDGE)
    } else {
        shade.addColorStop(0, COLOR_DOOR_EDGE)
        shade.addColorStop(1, 'rgba(0,0,0,0)')
    }
    ctx.fillStyle = shade
    ctx.fillRect(edgeX, 0, edgeWidth, CARD_HEIGHT)

    // 손잡이 — 안쪽 모서리 가까이. 문이 좁아지면 잘려 보이므로 접는다
    if (withHandle && width > 90) {
        const bar = 22
        // 메모(0.24~0.39) 아래에서 시작한다. 겹치면 손잡이 윗동강이 메모에 잘려 보인다
        const barTop = CARD_HEIGHT * 0.44
        const barHeight = 230
        const handleX = innerEdge === 'left' ? x + width - 56 : x + 34

        // 문에 붙은 브래킷 두 개. 손잡이가 떠 있는 것처럼 보이게 한다
        ctx.fillStyle = COLOR_DOOR_LINE
        ;[barTop + 18, barTop + barHeight - 30].forEach((top) => {
            roundRectPath(ctx, handleX + 4, top, bar - 8, 12, 3)
            ctx.fill()
        })

        ctx.fillStyle = COLOR_HANDLE
        roundRectPath(ctx, handleX, barTop, bar, barHeight, bar / 2)
        ctx.fill()
    }
}

/** 양쪽 문. door=0이면 닫힘, 1이면 활짝 */
function drawDoors(ctx: CanvasRenderingContext2D, door: number, withHandles: boolean): void {
    if (door >= 1) return
    const half = CARD_WIDTH / 2
    // 밀려나면서 좁아진다 — 2D 근사
    const shift = half * 0.35 * door
    const width = half * (1 - door * 0.65)
    drawDoorPanel(ctx, -shift, width, 'left', withHandles)
    drawDoorPanel(ctx, CARD_WIDTH - width + shift, width, 'right', withHandles)
}

/** 닫힌 문에 붙은 메모지. 날짜와 로그잇 이름이 여기 올라간다 */
function drawDoorMemo(ctx: CanvasRenderingContext2D, layout: DayCardFilmLayout, alpha: number): void {
    if (alpha <= 0) return

    const width = CARD_WIDTH - PADDING * 2 - 40
    const height = 190
    const x = PADDING + 20
    const y = CARD_HEIGHT * 0.24

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(x + width / 2, y + height / 2)
    ctx.rotate((-1.5 * Math.PI) / 180)

    ctx.fillStyle = COLOR_SHELF_SHADOW
    roundRectPath(ctx, -width / 2 + 4, -height / 2 + 6, width, height, 10)
    ctx.fill()

    ctx.fillStyle = COLOR_MEMO
    roundRectPath(ctx, -width / 2, -height / 2, width, height, 10)
    ctx.fill()

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = displayFont(46)
    ctx.fillStyle = COLOR.title
    ctx.fillText(layout.dateLabel, 0, -24)

    ctx.font = sansFont(26, 700)
    ctx.fillStyle = COLOR.muted
    ctx.fillText(truncate(ctx, layout.title, width - 40), 0, 30)
    ctx.restore()
}

/** 문에 자석으로 붙인 사진 한 장. 흰 테두리와 기울기가 인화지처럼 보이게 한다 */
function drawMagnetPhoto(
    ctx: CanvasRenderingContext2D,
    bitmaps: BitmapMap,
    photoId: number,
    x: number,
    y: number,
    side: number,
    index: number,
): void {
    const frameSide = side + 12
    ctx.save()
    ctx.translate(x + side / 2, y + side / 2)
    ctx.rotate((((index % 3) - 1) * 2 * Math.PI) / 180)

    ctx.fillStyle = COLOR_SHELF_SHADOW
    roundRectPath(ctx, -side / 2 - 3, -side / 2 - 1, frameSide, frameSide, CELL_RADIUS)
    ctx.fill()

    ctx.fillStyle = COLOR.cell
    roundRectPath(ctx, -side / 2 - 6, -side / 2 - 6, frameSide, frameSide, CELL_RADIUS)
    ctx.fill()

    roundRectPath(ctx, -side / 2, -side / 2, side, side, CELL_RADIUS)
    ctx.clip()
    const bitmap = bitmaps.get(photoId)
    if (bitmap) {
        drawCover(ctx, bitmap, -side / 2, -side / 2, side)
    } else {
        ctx.fillStyle = COLOR.placeholder
        ctx.fillRect(-side / 2, -side / 2, side, side)
    }
    ctx.restore()
}

/**
 * 영상의 마지막이자 썸네일. 닫힌 문 위에 사진을 자석으로 붙인 모습이다
 * 격자가 아니라 모자이크라 인원이 몇 명이든 잘리지 않는다
 */
function drawSummaryScene(
    ctx: CanvasRenderingContext2D,
    layout: DayCardFilmLayout,
    bitmaps: BitmapMap,
    frame: FilmFrame,
): void {
    drawHeader(ctx, layout)

    const columns = 3
    const gap = 16
    const side = (CARD_WIDTH - PADDING * 2 - gap * (columns - 1)) / columns
    const rows = Math.ceil(layout.mosaic.length / columns)

    // 헤더 아래 남는 자리에 모자이크·통계·워드마크를 통째로 가운데 놓는다
    // 위에서부터 쌓으면 사진이 적을 때 카드 아래 절반이 텅 빈다
    const mosaicHeight = rows > 0 ? rows * side + gap * (rows - 1) : 0
    const blockHeight = mosaicHeight + 40 + STAT_HEIGHT + 60
    const top = SCENE_HEADER_HEIGHT + Math.max((CARD_HEIGHT - SCENE_HEADER_HEIGHT - blockHeight) / 2, 20)

    // 마지막 줄은 3장이 안 될 수 있다. 줄마다 가운데로 모은다 —
    // 왼쪽에 붙이면 1장짜리 하루의 썸네일이 한쪽으로 쏠린다
    const rowStartX = (row: number) => {
        const count = Math.min(columns, layout.mosaic.length - row * columns)
        const rowWidth = count * side + gap * (count - 1)
        return PADDING + (CARD_WIDTH - PADDING * 2 - rowWidth) / 2
    }

    layout.mosaic.forEach((photo, index) => {
        const row = Math.floor(index / columns)
        const x = rowStartX(row) + (index % columns) * (side + gap)
        const y = top + row * (side + gap)
        drawMagnetPhoto(ctx, bitmaps, photo.photoId, x, y, side, index)
    })

    const statTop = top + mosaicHeight + 40

    const stats = [
        { value: layout.stats.foodCount, suffix: '', label: '담긴 음식' },
        { value: layout.stats.participantCount, suffix: '명', label: '함께 먹은 사람' },
        { value: layout.stats.recordedSlotCount, suffix: '끼', label: '기록한 끼니' },
    ]
    const width = (CARD_WIDTH - PADDING * 2 - STAT_GAP * 2) / 3
    stats.forEach((stat, index) => {
        const x = PADDING + index * (width + STAT_GAP)
        ctx.fillStyle = COLOR.cell
        roundRectPath(ctx, x, statTop, width, STAT_HEIGHT, STAT_RADIUS)
        ctx.fill()

        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = displayFont(40)
        ctx.fillStyle = COLOR.title
        ctx.fillText(`${Math.round(stat.value * frame.stats)}${stat.suffix}`, x + width / 2, statTop + 40)

        ctx.font = sansFont(19)
        ctx.fillStyle = COLOR.muted
        ctx.fillText(truncate(ctx, stat.label, width - 16), x + width / 2, statTop + 78)
    })

    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    // 민트 문 위에서는 주황 워드마크가 묻힌다. 짙은 글자로 둔다
    ctx.font = displayFont(26)
    ctx.fillStyle = COLOR.title
    ctx.fillText('캣칫', CARD_WIDTH / 2, statTop + STAT_HEIGHT + 20)
}

/** 한 프레임. 화면 재생과 MP4 인코딩이 이 함수 하나를 공유한다 */
export function drawFilmFrame(
    ctx: CanvasRenderingContext2D,
    layout: DayCardFilmLayout,
    bitmaps: BitmapMap,
    frame: FilmFrame,
): void {
    drawInterior(ctx, frame.door)

    // 문이 조금이라도 열려 있으면 안이 보인다
    if (frame.door > 0) {
        // 헤더와 선반은 냉장고에 붙어 있다. 끼니가 바뀌어도 밀려 올라가지 않는다
        drawHeader(ctx, layout)
        drawShelfBoards(ctx, layout.grid)

        const scene = layout.scenes[frame.sceneIndex]
        if (scene) {
            ctx.save()
            // 다음 끼니로 넘어갈 때만 내용물이 위로 밀려 사라진다
            if (frame.phase === 'slot' && frame.progress > 0) {
                ctx.globalAlpha = 1 - frame.progress
                ctx.translate(0, -frame.progress * 80)
            }
            drawSlotScene(ctx, scene, bitmaps, frame)
            ctx.restore()
        }
    }

    // 요약은 문 위에 붙으므로 손잡이를 접는다 — 사진·통계와 겹친다
    drawDoors(ctx, frame.door, frame.phase !== 'summary')

    if (frame.phase === 'closed' || frame.phase === 'opening') {
        drawDoorMemo(ctx, layout, 1 - frame.door)
    }

    if (frame.phase === 'summary') {
        ctx.save()
        ctx.globalAlpha = Math.min(frame.progress * 3, 1)
        drawSummaryScene(ctx, layout, bitmaps, frame)
        ctx.restore()
    }
}
