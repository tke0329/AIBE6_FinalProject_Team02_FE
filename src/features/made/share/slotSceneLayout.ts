import {
    CARD_HEIGHT,
    CARD_WIDTH,
    CELL_GAP,
    PADDING,
    ROW_GAP,
    SCENE_BOTTOM,
    SCENE_HEADER_HEIGHT,
    SCENE_LABEL_HEIGHT,
    SCENE_MAX_CELL,
    SCENE_MAX_ROWS,
    SCENE_NAME_HEIGHT,
} from './shareCardTheme'
import { authorName, parseDate } from '../logitTypes'
import type { DayCardAuthor, DayCardPhoto, DayCardSlot, LogitDayCard } from '../logitTypes'

/**
 * 한 끼니가 화면을 다 쓰는 배치
 *
 * 격자를 공간이 아니라 시간에 펼치므로 끼니가 늘어도 칸이 줄지 않는다
 * 캔버스를 모르는 순수 계산이라 조합별 칸 크기를 값으로 확인할 수 있다
 */

export interface SlotCell {
    userId: number
    author: string
    /** 그 끼니의 대표. 담지 않았으면 null이고 어두운 칸이 된다 */
    photo: DayCardPhoto | null
    /** 배지 숫자. 담은 사진 총합 */
    photoCount: number
    x: number
    y: number
    size: number
}

export interface SlotScene {
    slotId: number
    name: string
    cells: SlotCell[]
    /** 대표가 있는 칸의 인덱스. 날아오는 순서다 */
    flight: number[]
}

/** 선반 판을 그리는 데 쓰는 격자 정보. 끼니가 바뀌어도 같다 */
export interface FilmGrid {
    rows: number
    columns: number
    size: number
    /** 줄마다 사진의 아래쪽 y. 여기에 선반 판을 깐다 */
    rowBottoms: number[]
    /** 선반 판의 좌우 끝 */
    left: number
    right: number
}

export interface DayCardFilmLayout {
    /** `8월 9일 (일)` */
    dateLabel: string
    title: string
    /** 기록이 있는 끼니만. 없는 끼니는 건너뛴다 */
    scenes: SlotScene[]
    stats: LogitDayCard['stats']
    /** 요약 화면 모자이크. 끼니별 대표부터 최대 6장 */
    mosaic: DayCardPhoto[]
    grid: FilmGrid
}

const DATE_LABEL = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

const AREA_WIDTH = CARD_WIDTH - PADDING * 2
const AREA_HEIGHT = CARD_HEIGHT - SCENE_HEADER_HEIGHT - SCENE_LABEL_HEIGHT - SCENE_BOTTOM

interface Grid {
    rows: number
    columns: number
    size: number
}

function measureGrid(people: number, rows: number): Grid {
    const columns = Math.ceil(people / rows)
    const byWidth = (AREA_WIDTH - CELL_GAP * (columns - 1)) / columns
    const byHeight = (AREA_HEIGHT - ROW_GAP * (rows - 1)) / rows - SCENE_NAME_HEIGHT
    return { rows, columns, size: Math.max(Math.min(byWidth, byHeight, SCENE_MAX_CELL), 0) }
}

/** 칸이 가장 커지는 행 수를 고른다. 4명은 2×2, 12명은 4×3이 나온다 */
function planGrid(people: number): Grid {
    let best = measureGrid(people, 1)
    for (let rows = 2; rows <= SCENE_MAX_ROWS; rows += 1) {
        const candidate = measureGrid(people, rows)
        if (candidate.size > best.size) best = candidate
    }
    return best
}

/** 한 사람이 같은 끼니에 여러 번 기록할 수 있다. 칸은 하나이므로 사진을 이어 붙인다 */
function photosByMember(slot: DayCardSlot): Map<number, DayCardPhoto[]> {
    const byUser = new Map<number, DayCardPhoto[]>()
    slot.items.forEach((item) => {
        byUser.set(item.author.userId, [...(byUser.get(item.author.userId) ?? []), ...item.photos])
    })
    return byUser
}

/** 격자 덩어리의 시작 y. 선반 판도 같은 값을 써야 칸과 어긋나지 않는다 */
function blockTop(grid: Grid): number {
    const blockHeight = grid.rows * (grid.size + SCENE_NAME_HEIGHT) + ROW_GAP * (grid.rows - 1)
    return SCENE_HEADER_HEIGHT + SCENE_LABEL_HEIGHT + (AREA_HEIGHT - blockHeight) / 2
}

function layoutScene(slot: DayCardSlot, members: DayCardAuthor[], grid: Grid): SlotScene {
    const photos = photosByMember(slot)
    const startY = blockTop(grid)

    // 마지막 줄은 칸이 모자랄 수 있다. 줄마다 따로 가운데로 모은다
    const rowStartX = (row: number) => {
        const count = Math.min(grid.columns, members.length - row * grid.columns)
        const width = count * grid.size + CELL_GAP * (count - 1)
        return PADDING + (AREA_WIDTH - width) / 2
    }

    const cells: SlotCell[] = members.map((member, index) => {
        const row = Math.floor(index / grid.columns)
        const column = index % grid.columns
        const mine = photos.get(member.userId) ?? []
        return {
            userId: member.userId,
            author: authorName(member),
            photo: mine[0] ?? null,
            photoCount: mine.length,
            x: rowStartX(row) + column * (grid.size + CELL_GAP),
            y: startY + row * (grid.size + SCENE_NAME_HEIGHT + ROW_GAP),
            size: grid.size,
        }
    })

    const flight = cells.flatMap((cell, index) => (cell.photo ? [index] : []))
    return { slotId: slot.slotId, name: slot.name, cells, flight }
}

/** 요약 화면 모자이크에 올리는 장수 */
const MOSAIC_MAX = 6

/**
 * 요약 화면에 올릴 대표들
 *
 * 끼니를 돌면서 **아직 안 뽑힌 사람**을 우선 고른다.
 * 끼니마다 첫 칸만 집으면 가입 순 첫 사람이 6장을 독차지한다 —
 * 12명이 하루 종일 먹은 날의 썸네일이 한 사람 사진으로만 채워진다
 */
function pickMosaic(scenes: SlotScene[]): DayCardPhoto[] {
    const picked: DayCardPhoto[] = []
    const usedUsers = new Set<number>()
    const usedPhotos = new Set<number>()

    /** 한 끼니에서 조건에 맞는 첫 장을 하나만 집는다 */
    const take = (scene: SlotScene, freshUserOnly: boolean) => {
        if (picked.length >= MOSAIC_MAX) return
        for (const index of scene.flight) {
            const cell = scene.cells[index]
            if (!cell.photo || usedPhotos.has(cell.photo.photoId)) continue
            if (freshUserOnly && usedUsers.has(cell.userId)) continue
            picked.push(cell.photo)
            usedUsers.add(cell.userId)
            usedPhotos.add(cell.photo.photoId)
            return
        }
    }

    // 끼니를 여러 바퀴 돌며 사람이 겹치지 않게 모은다
    for (let round = 0; round < MOSAIC_MAX && picked.length < MOSAIC_MAX; round += 1) {
        scenes.forEach((scene) => take(scene, true))
    }
    // 사람 수가 모자라면 같은 사람의 다른 끼니로 채운다
    while (picked.length < MOSAIC_MAX) {
        const before = picked.length
        scenes.forEach((scene) => take(scene, false))
        if (picked.length === before) break
    }

    return picked
}

export function buildFilmLayout(dayCard: LogitDayCard, title: string): DayCardFilmLayout {
    // 기록이 없는 끼니는 건너뛴다 — 빈 화면을 2초씩 보여 줄 이유가 없다
    const recorded = dayCard.slots.filter((slot) => slot.items.length > 0)
    const grid = planGrid(Math.max(dayCard.members.length, 1))
    const scenes = recorded.map((slot) => layoutScene(slot, dayCard.members, grid))

    const mosaic = pickMosaic(scenes)

    const startY = blockTop(grid)
    const filmGrid: FilmGrid = {
        rows: grid.rows,
        columns: grid.columns,
        size: grid.size,
        rowBottoms: Array.from(
            { length: grid.rows },
            (_, row) => startY + row * (grid.size + SCENE_NAME_HEIGHT + ROW_GAP) + grid.size,
        ),
        left: PADDING,
        right: CARD_WIDTH - PADDING,
    }

    return {
        dateLabel: DATE_LABEL.format(parseDate(dayCard.date)),
        title,
        scenes,
        stats: dayCard.stats,
        mosaic,
        grid: filmGrid,
    }
}
