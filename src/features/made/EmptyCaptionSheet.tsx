'use client'

import React, { useState } from 'react'
import { BottomSheet, Button, Text, TextField } from '@/shared/ui'
import { DEFAULT_EMPTY_CAPTION, EMPTY_CAPTION_MAX } from './useEmptyCaption'

interface Props {
    /** 지금 문구. 기본값이면 입력칸을 비워 두고 자리글로 보여 준다 */
    caption: string
    onSave: (next: string) => void
    onClose: () => void
}

/** 그날 아무도 안 적은 칸에 뭐라고 띄울지 정하는 시트 */
export function EmptyCaptionSheet({ caption, onSave, onClose }: Props) {
    // 기본 문구면 빈 칸에서 시작한다 — 지우고 쓰게 만들면 손이 한 번 더 간다
    const [draft, setDraft] = useState(caption === DEFAULT_EMPTY_CAPTION ? '' : caption)

    const submit = () => {
        onSave(draft)
        onClose()
    }

    return (
        <BottomSheet title="빈 칸에 띄울 말" onClose={onClose}>
            <div className="flex flex-col gap-4 px-5 pb-8 pt-2">
                <Text variant="secondary" tone="muted" as="p">
                    그날 아직 기록하지 않은 사람의 칸에 이 말이 뜹니다. 날짜마다 따로 정할 수 있어요.
                </Text>

                <TextField
                    label="문구"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={DEFAULT_EMPTY_CAPTION}
                    hint="비워 두면 기본 문구로 돌아가요"
                    count={{ current: draft.length, max: EMPTY_CAPTION_MAX }}
                    maxLength={EMPTY_CAPTION_MAX}
                />

                <div className="flex flex-col gap-2">
                    <Button shape="block" fullWidth onClick={submit}>
                        이 말로 하기
                    </Button>
                    {/* 이 기기에만 남는다는 걸 여기서 한 번 알려 준다 — 남에게도 보일 거라 기대하면 어긋난다 */}
                    <Text variant="caption" tone="muted" as="p" className="text-center">
                        내 기기에만 저장돼요
                    </Text>
                </div>
            </div>
        </BottomSheet>
    )
}
