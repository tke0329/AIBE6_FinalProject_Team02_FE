import type { DayCardFilmLayout } from './slotSceneLayout'

/**
 * 문 열림 → 끼니들 → 문 닫힘 → 요약을 잇는 구간 계산
 *
 * 캔버스를 모르는 순수 계산이다. 화면 재생(rAF)과 MP4 인코딩(고정 프레임)이
 * 같은 함수로 같은 그림을 얻어야 미리 본 것과 공유한 것이 어긋나지 않는다
 */

/** 문이 닫힌 채 날짜·이름을 보여 주는 구간 */
export const DOOR_HOLD_MS = 1200
/** 문이 열리는 구간 */
export const DOOR_OPEN_MS = 800
/** 문이 닫히는 구간 */
export const DOOR_CLOSE_MS = 800
/** 낱장이 날아오는 데 걸리는 시간 */
export const FLIGHT_MS = 450
/** 격자가 완성된 뒤 머무는 시간. 대표들이 보이는 구간 */
export const SLOT_HOLD_MS = 600
/** 다음 끼니로 밀어 올리는 시간 */
export const TRANSITION_MS = 350
export const SUMMARY_MS = 2500

/** 여유 있을 때의 발사 간격 */
const IDEAL_GAP_MS = 90
/** 이보다 촘촘하면 눈이 낱장을 구분하지 못한다 */
const MIN_GAP_MS = 45
/** 한 끼니의 전개가 이보다 길어지지 않는다 */
const SLOT_FLIGHT_CAP_MS = 1400

export interface SlotTiming {
    /** 필름 전체 기준 시작 시각 */
    startAt: number
    /** 전개 + 유지. 전환은 뒤에 따로 붙는다 */
    duration: number
    /** flight 순번 → 그 끼니 안에서의 출발 시각 */
    launchAt: number[]
}

export interface FilmTimeline {
    totalMs: number
    slots: SlotTiming[]
    /** 문이 닫히기 시작하는 시각 */
    closingAt: number
    summaryAt: number
}

function planLaunches(count: number): { launchAt: number[]; flightMs: number } {
    if (count <= 0) return { launchAt: [], flightMs: 0 }
    if (count === 1) return { launchAt: [0], flightMs: FLIGHT_MS }

    const ideal = Math.min(IDEAL_GAP_MS, SLOT_FLIGHT_CAP_MS / (count - 1))
    const gap = Math.max(ideal, MIN_GAP_MS)
    return {
        launchAt: Array.from({ length: count }, (_, index) => index * gap),
        flightMs: (count - 1) * gap + FLIGHT_MS,
    }
}

export function planTimeline(layout: DayCardFilmLayout): FilmTimeline {
    let cursor = DOOR_HOLD_MS + DOOR_OPEN_MS
    const slots: SlotTiming[] = layout.scenes.map((scene) => {
        const { launchAt, flightMs } = planLaunches(scene.flight.length)
        const duration = flightMs + SLOT_HOLD_MS
        const timing: SlotTiming = { startAt: cursor, duration, launchAt }
        cursor += duration + TRANSITION_MS
        return timing
    })

    // 마지막 끼니가 끝나면 문이 닫히고, 닫힌 문 위에 요약이 붙는다
    const closingAt = cursor
    const summaryAt = closingAt + DOOR_CLOSE_MS
    return { totalMs: summaryAt + SUMMARY_MS, slots, closingAt, summaryAt }
}

export type ScenePhase = 'closed' | 'opening' | 'slot' | 'closing' | 'summary'

export interface FilmFrame {
    phase: ScenePhase
    /** phase가 'slot'일 때 몇 번째 끼니인지 */
    sceneIndex: number
    /** 문 구간·요약은 진행도, slot은 전환 진행도 (0~1) */
    progress: number
    /** 0=닫힘, 1=활짝. 문과 조명이 이 값을 따른다 */
    door: number
    /** 착지한 칸 인덱스 */
    landed: Set<number>
    /** 칸 인덱스 → 0~1 비행 진행도 */
    flying: Map<number, number>
    /** 0~1. 요약 화면의 통계 카운트업 */
    stats: number
}

function clamp01(value: number): number {
    return Math.max(0, Math.min(value, 1))
}

/** t 시점의 그림 상태 */
export function filmFrameAt(layout: DayCardFilmLayout, timeline: FilmTimeline, t: number): FilmFrame {
    const lastIndex = Math.max(layout.scenes.length - 1, 0)

    if (t < DOOR_HOLD_MS) {
        return {
            phase: 'closed',
            sceneIndex: 0,
            progress: clamp01(t / DOOR_HOLD_MS),
            door: 0,
            landed: new Set(),
            flying: new Map(),
            stats: 0,
        }
    }

    if (t < DOOR_HOLD_MS + DOOR_OPEN_MS) {
        const progress = clamp01((t - DOOR_HOLD_MS) / DOOR_OPEN_MS)
        return {
            phase: 'opening',
            sceneIndex: 0,
            progress,
            door: progress,
            landed: new Set(),
            flying: new Map(),
            stats: 0,
        }
    }

    if (t >= timeline.summaryAt) {
        return {
            phase: 'summary',
            sceneIndex: lastIndex,
            progress: clamp01((t - timeline.summaryAt) / SUMMARY_MS),
            door: 0,
            landed: new Set(),
            flying: new Map(),
            stats: clamp01((t - timeline.summaryAt) / (SUMMARY_MS * 0.6)),
        }
    }

    if (t >= timeline.closingAt) {
        const progress = clamp01((t - timeline.closingAt) / DOOR_CLOSE_MS)
        return {
            phase: 'closing',
            sceneIndex: lastIndex,
            progress,
            door: 1 - progress,
            // 마지막 끼니가 채워진 채로 닫혀야 한다. 비워 두면 애써 채운 선반이 사라진다
            landed: new Set(layout.scenes[lastIndex]?.flight ?? []),
            flying: new Map(),
            stats: 0,
        }
    }

    // 지금이 몇 번째 끼니인지 — 각 구간은 duration + 전환까지 차지한다
    let sceneIndex = timeline.slots.length - 1
    for (let index = 0; index < timeline.slots.length; index += 1) {
        const timing = timeline.slots[index]
        if (t < timing.startAt + timing.duration + TRANSITION_MS) {
            sceneIndex = index
            break
        }
    }

    const timing = timeline.slots[sceneIndex]
    const scene = layout.scenes[sceneIndex]
    const local = t - timing.startAt

    const landed = new Set<number>()
    const flying = new Map<number, number>()
    scene.flight.forEach((cellIndex, order) => {
        const start = timing.launchAt[order] ?? 0
        if (local < start) return
        const progress = clamp01((local - start) / FLIGHT_MS)
        if (progress >= 1) landed.add(cellIndex)
        else flying.set(cellIndex, progress)
    })

    // 유지 구간이 끝나면 전환이 시작된다
    const afterHold = local - timing.duration
    return {
        phase: 'slot',
        sceneIndex,
        progress: afterHold <= 0 ? 0 : clamp01(afterHold / TRANSITION_MS),
        door: 1,
        landed,
        flying,
        stats: 0,
    }
}

/** 모든 것이 제자리에 있는 마지막 그림. 정적 PNG가 곧 이 프레임이다 */
export function finalFilmFrame(layout: DayCardFilmLayout): FilmFrame {
    return {
        phase: 'summary',
        sceneIndex: Math.max(layout.scenes.length - 1, 0),
        progress: 1,
        door: 0,
        landed: new Set(),
        flying: new Map(),
        stats: 1,
    }
}
