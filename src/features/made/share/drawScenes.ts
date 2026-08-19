import { clamp, drawCountBadge, drawCover, drawStackLayer, roundRectPath, truncate, wrapLines } from './drawPrimitives'
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

/** 빈 칸 문구가 비어 있을 때의 마지막 대비. 화면에서는 useEmptyCaption이 기본값을 보장한다 */
const EMPTY_LABEL = '🍚'

/**
 * 빈 칸 문구 — 칸 크기에 대한 글자 크기, 좌우 여백, 접는 줄 수.
 *
 * 0.09에서 **0.13으로 키웠다.** 칸이 195~300px이라 예전 값이면 18~27px이었는데,
 * 720px 카드를 폰 화면으로 줄여 보면 그 크기가 뭉개져 안 읽혔다. 이제 25~39px이다.
 *
 * 20자가 들어와도 넘치지 않는다 — 25px에서 한 줄에 11자쯤 들어가고 세 줄까지 접는다
 */
const EMPTY_TEXT_RATIO = 0.13
const EMPTY_TEXT_PADDING = 14
const EMPTY_TEXT_MAX_LINES = 3

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

/** 냉장고 안. 따뜻한 크림색 — 문(연한 수박색)보다 밝아서 열릴 때 대비가 생긴다 */
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

    ctx.font = displayFont(52)
    ctx.fillStyle = COLOR.title
    ctx.fillText(layout.dateLabel, PADDING, 44)

    ctx.font = sansFont(30, 700)
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

/**
 * 담지 않은 사람의 칸. 어둡게 남겨 누가 걸렀는지 드러낸다.
 *
 * 예전에는 밥 이모지(🍚) 하나였다. 이제 그 자리에 **하루마다 정할 수 있는 문구**가
 * 온다 (`useEmptyCaption`). 글이 되었으니 크기와 줄바꿈을 다시 잡아야 한다.
 *
 *   - 이모지는 칸의 0.34배로 크게 먹여야 알아봤지만, 글은 그 크기로는 두 글자도 안 들어간다
 *   - 20자까지 오므로 세 줄까지 접는다. 칸이 195~300px이라 이 안에서 읽힌다
 *   - **굵게 그린다.** 어두운 칸 위에서 얇은 획은 뭉개진다. 이 글꼴은 굵기가 하나라
 *     700은 합성 볼드인데, 25px 이상에서는 획이 두꺼워지는 쪽으로만 작용한다
 */
function drawEmptyCell(ctx: CanvasRenderingContext2D, cell: SlotCell, caption: string): void {
    ctx.fillStyle = COLOR_EMPTY_CELL
    roundRectPath(ctx, cell.x, cell.y, cell.size, cell.size, CELL_RADIUS)
    ctx.fill()

    const inner = cell.size - EMPTY_TEXT_PADDING * 2
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = sansFont(clamp(cell.size * EMPTY_TEXT_RATIO, 22, 40), 700)
    ctx.fillStyle = COLOR_EMPTY_TEXT

    const lines = wrapLines(ctx, caption || EMPTY_LABEL, inner, EMPTY_TEXT_MAX_LINES)
    // 글자 크기와 같은 비율로 늘려야 두 줄이 붙어 보이지 않는다
    const step = clamp(cell.size * EMPTY_TEXT_RATIO * 1.35, 28, 54)
    // 줄 묶음을 칸 가운데에 맞춘다. 위에서부터 쌓으면 한 줄일 때 위로 붙는다
    const top = cell.y + cell.size / 2 - ((lines.length - 1) * step) / 2
    lines.forEach((line, row) => {
        ctx.fillText(line, cell.x + cell.size / 2, top + row * step)
    })
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
    ctx.font = sansFont(clamp(SCENE_NAME_HEIGHT * 0.72, 16, 24), 700)
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
function drawSlotScene(
    ctx: CanvasRenderingContext2D,
    scene: SlotScene,
    bitmaps: BitmapMap,
    frame: FilmFrame,
    emptyCaption: string,
): void {
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.font = displayFont(42)
    ctx.fillStyle = COLOR.body
    ctx.fillText(scene.name, PADDING, SCENE_HEADER_HEIGHT + SCENE_LABEL_HEIGHT / 2)

    scene.cells.forEach((cell, index) => {
        if (frame.landed.has(index)) drawLandedCell(ctx, cell, bitmaps)
        else drawEmptyCell(ctx, cell, emptyCaption)
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

/**
 * 문이 열릴 때 안쪽에 드리우는 그림자. 문짝이 그냥 사라지는 것처럼 보이지 않게 한다.
 *
 * 반쯤 열렸을 때 가장 진하다 — 닫혀 있으면 안이 안 보이고, 활짝 열리면 문짝이
 * 빛을 가리지 않는다. `sin(π·door)`가 그 모양이다
 */
function drawDoorCastShadow(ctx: CanvasRenderingContext2D, door: number): void {
    if (door <= 0 || door >= 1) return

    const reach = 120
    const alpha = 0.26 * Math.sin(door * Math.PI)

    ctx.save()
    ctx.globalAlpha = alpha
    for (const side of ['left', 'right'] as const) {
        const from = side === 'left' ? 0 : CARD_WIDTH
        const to = side === 'left' ? reach : CARD_WIDTH - reach
        const shade = ctx.createLinearGradient(from, 0, to, 0)
        shade.addColorStop(0, COLOR_DOOR_EDGE)
        shade.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = shade
        ctx.fillRect(Math.min(from, to), 0, reach, CARD_HEIGHT)
    }
    ctx.restore()
}

/**
 * 돌아가는 문짝의 자유 모서리. 판의 두께가 빛을 받는 자리다.
 * 이 한 줄이 있어야 문이 "면"이 아니라 "판"으로 보인다
 */
function drawDoorLip(ctx: CanvasRenderingContext2D, edgeX: number, door: number): void {
    if (door <= 0.04 || door >= 0.98) return
    ctx.save()
    // 많이 젖혀질수록 두께가 정면으로 보여 두꺼워진다
    ctx.globalAlpha = 0.85
    ctx.fillStyle = COLOR_HANDLE
    ctx.fillRect(edgeX - 2, 0, clamp(door * 9, 2, 8), CARD_HEIGHT)
    ctx.restore()
}

/**
 * 양쪽 문. door=0이면 닫힘, 1이면 활짝.
 *
 * ## 엘리베이터처럼 보였던 이유
 *
 * 예전에는 두 짝이 **바깥으로 밀려나면서**(shift) 폭이 **직선으로** 줄었다.
 * 그 둘이 미끄럼문의 신호다 — 미끄러지는 문은 옆으로 이동하고, 여닫이문은
 * 제자리에서 돌아간다.
 *
 * ## 바꾼 것
 *
 *   1. **경첩(바깥 모서리)을 고정한다.** 옆으로 밀지 않는다. 자유 모서리만 쓸려 나간다
 *   2. **폭을 `cos`으로 줄인다.** 축을 중심으로 돌아가는 면의 투영 폭이 `cos θ`다.
 *      직선이면 등속으로 미끄러지고, `cos`이면 처음엔 더디게 열리다 확 젖혀진다 —
 *      손잡이를 당겼을 때 나는 그 느낌이다
 *   3. 자유 모서리에 **판 두께**(`drawDoorLip`)와 안쪽 **그림자**를 얹는다
 *
 * 진짜 원근(사다리꼴)은 캔버스 2D로 한 번에 못 그린다. 스캔라인마다 나눠 그리면
 * 되지만 프레임마다 도는 경로라 비용이 크다. 위 셋으로 충분히 여닫이로 읽힌다
 */
function drawDoors(ctx: CanvasRenderingContext2D, door: number, withHandles: boolean): void {
    if (door >= 1) return

    const half = CARD_WIDTH / 2
    const width = half * Math.cos(door * (Math.PI / 2))

    drawDoorPanel(ctx, 0, width, 'left', withHandles)
    drawDoorPanel(ctx, CARD_WIDTH - width, width, 'right', withHandles)

    drawDoorLip(ctx, width, door)
    drawDoorLip(ctx, CARD_WIDTH - width, door)
    drawDoorCastShadow(ctx, door)
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
    ctx.font = displayFont(52)
    ctx.fillStyle = COLOR.title
    ctx.fillText(layout.dateLabel, 0, -24)

    ctx.font = sansFont(30, 700)
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
        ctx.font = displayFont(46)
        ctx.fillStyle = COLOR.title
        ctx.fillText(`${Math.round(stat.value * frame.stats)}${stat.suffix}`, x + width / 2, statTop + 38)

        /*
         * 라벨을 19 → 24로 키우고 굵게 바꿨다. 딩궁딩굴은 x-height가 Pretendard의 74%라
         * 예전 값이면 720px 카드를 폰에서 볼 때 뭉개져 읽히지 않았다.
         * 이 글꼴은 굵기가 하나라 700은 합성 볼드지만, 이 크기에서는 또렷해지는 쪽이다
         */
        ctx.font = sansFont(24, 700)
        ctx.fillStyle = COLOR.body
        ctx.fillText(truncate(ctx, stat.label, width - 12), x + width / 2, statTop + 79)
    })

    /*
     * `캣칫` 워드마크를 두지 않는다.
     *
     * 헤더에 이미 날짜와 로그잇 이름이 있어서 서비스 이름까지 넣으면 글자가 세 줄이 된다.
     * 공유되는 자리라 이름을 남기고 싶었지만, 지금은 통계 아래 여백이 더 필요하다
     */
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
            drawSlotScene(ctx, scene, bitmaps, frame, layout.emptyCaption)
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
