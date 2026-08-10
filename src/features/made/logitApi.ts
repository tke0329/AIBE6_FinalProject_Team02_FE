import { apiFetch } from '@/shared/lib/api'
import type {
    DayCardCalendar,
    LogitDayCard,
    LogitFeed,
    LogitRecordCreateRequest,
    LogitRecordDetail,
    LogitRecordUpdateRequest,
    LogitSlot,
    SlotDeleteResult,
} from './logitTypes'
import type { MadeDexId } from './types'

function base(madeDexId: MadeDexId): string {
    return `/api/v1/made-dexes/${madeDexId}`
}

/** 숨긴 슬롯까지 온다. 편집 시트가 되살리기를 그려야 한다 */
export function fetchSlots(madeDexId: MadeDexId): Promise<LogitSlot[]> {
    return apiFetch<LogitSlot[]>(`${base(madeDexId)}/slots`)
}

/** 슬롯 편집은 멤버 전원이 할 수 있다 */
export function addSlot(madeDexId: MadeDexId, name: string): Promise<LogitSlot> {
    return apiFetch<LogitSlot>(`${base(madeDexId)}/slots`, {
        method: 'POST',
        body: JSON.stringify({ name }),
    })
}

/** 이름 변경은 과거 기록에도 소급된다 */
export function renameSlot(madeDexId: MadeDexId, slotId: number, name: string): Promise<LogitSlot> {
    return apiFetch<LogitSlot>(`${base(madeDexId)}/slots/${slotId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
    })
}

/** 보이는 슬롯 전체를 새 순서대로 보낸다. 일부만 보내면 서버가 막는다 */
export function reorderSlots(madeDexId: MadeDexId, slotIds: number[]): Promise<LogitSlot[]> {
    return apiFetch<LogitSlot[]>(`${base(madeDexId)}/slots/order`, {
        method: 'PUT',
        body: JSON.stringify({ slotIds }),
    })
}

/** 기록이 있으면 지워지지 않고 숨겨진다 — 응답의 hidden으로 문구를 가른다 */
export function deleteSlot(madeDexId: MadeDexId, slotId: number): Promise<SlotDeleteResult> {
    return apiFetch<SlotDeleteResult>(`${base(madeDexId)}/slots/${slotId}`, {
        method: 'DELETE',
    })
}

export function restoreSlot(madeDexId: MadeDexId, slotId: number): Promise<LogitSlot> {
    return apiFetch<LogitSlot>(`${base(madeDexId)}/slots/${slotId}/restore`, {
        method: 'PATCH',
    })
}

/** date를 비우면 서버 기준(Asia/Seoul) 오늘이 온다. 첫 조회는 비워서 기준일을 서버에서 받는다 */
export function fetchFeed(madeDexId: MadeDexId, date?: string): Promise<LogitFeed> {
    const query = date ? `?date=${date}` : ''
    return apiFetch<LogitFeed>(`${base(madeDexId)}/feed${query}`)
}

export function createRecord(madeDexId: MadeDexId, request: LogitRecordCreateRequest): Promise<{ recordId: number }> {
    return apiFetch<{ recordId: number }>(`${base(madeDexId)}/records`, {
        method: 'POST',
        body: JSON.stringify(request),
    })
}

/** 사진·음식명은 보낸 목록으로 전부 교체된다 */
export function updateRecord(madeDexId: MadeDexId, recordId: number, request: LogitRecordUpdateRequest): Promise<void> {
    return apiFetch<void>(`${base(madeDexId)}/records/${recordId}`, {
        method: 'PUT',
        body: JSON.stringify(request),
    })
}

/** 오늘의 하루 카드
 * 끼니 층 + 음식 사진 + 통계 + 담긴 사람
 * date를 비우면 서버 기준 오늘 */
export function fetchDayCard(madeDexId: MadeDexId, date?: string): Promise<LogitDayCard> {
    const query = date ? `?date=${date}` : ''
    return apiFetch<LogitDayCard>(`${base(madeDexId)}/day-card${query}`)
}

/** 냉장고에 놓일 대표 사진 지정 — 고른 사진이 첫 장이 되고 카드의 글도 그 사진의 글이 됨 */
export function setDayCardCover(madeDexId: MadeDexId, recordId: number, photoId: number): Promise<void> {
    return apiFetch<void>(`${base(madeDexId)}/day-card/records/${recordId}/cover`, {
        method: 'PATCH',
        body: JSON.stringify({ photoId }),
    })
}

/** 캘린더 마커 */
export function fetchDayCardCalendar(madeDexId: MadeDexId, year: number, month: number): Promise<DayCardCalendar> {
    return apiFetch<DayCardCalendar>(`${base(madeDexId)}/day-card/calendar?year=${year}&month=${month}`)
}

export function fetchRecord(madeDexId: MadeDexId, recordId: number): Promise<LogitRecordDetail> {
    return apiFetch<LogitRecordDetail>(`${base(madeDexId)}/records/${recordId}`)
}

/** 작성자만 지울 수 있다. 그룹장도 남의 기록은 지우지 못한다 */
export function deleteRecord(madeDexId: MadeDexId, recordId: number): Promise<void> {
    return apiFetch<void>(`${base(madeDexId)}/records/${recordId}`, {
        method: 'DELETE',
    })
}
