import { apiFetch } from '@/shared/lib/api'

/** BE MemoTemplate.MAX_COUNT와 맞춘다 — 넘겨 저장하면 서버가 막는다 */
export const TEMPLATE_MAX_COUNT = 3

export interface MemoTemplate {
    id: number
    content: string
    lastUsedAt: string
}

/** 최근 사용순 */
export async function fetchMemoTemplates(): Promise<MemoTemplate[]> {
    return apiFetch<MemoTemplate[]>('/api/v1/memo-templates')
}

/** 같은 문구가 이미 있으면 서버가 새로 만들지 않고 기존 것을 돌려준다 */
export async function saveMemoTemplate(content: string): Promise<MemoTemplate> {
    return apiFetch<MemoTemplate>('/api/v1/memo-templates', {
        method: 'POST',
        body: JSON.stringify({ content }),
    })
}

/** 불러 쓴 순간 호출한다 — 다음에 열면 맨 위로 올라온다 */
export async function markMemoTemplateUsed(id: number): Promise<void> {
    await apiFetch<void>(`/api/v1/memo-templates/${id}/usages`, {
        method: 'POST',
    })
}

export async function deleteMemoTemplate(id: number): Promise<void> {
    await apiFetch<void>(`/api/v1/memo-templates/${id}`, { method: 'DELETE' })
}
