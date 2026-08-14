'use client'

import { useState } from 'react'
import { BottomSheet, Button, TextField } from '@/shared/ui'

/**
 * 탈퇴 후 계정을 되살릴 수 있는 기간(일).
 *
 * **서버의 `User.WITHDRAWAL_GRACE_DAYS`와 같은 값이어야 한다.** 서버가 이 값을
 * 내려 주지 않아 여기 적어 두는데, 어긋나면 사용자에게 거짓말이 된다.
 * 서버에서 바꾸면 여기도 바꿀 것 (BE `domain/auth/entity/User.java`)
 */
const GRACE_DAYS = 30

interface Props {
    /** 확인 절차에 쓸 내 닉네임. 이걸 그대로 입력해야 탈퇴 버튼이 열린다 */
    nickname: string
    pending: boolean
    error: string | null
    onConfirm: () => void
    onClose: () => void
}

/**
 * 회원 탈퇴 확인 시트.
 *
 * **닉네임을 직접 입력해야 진행된다.** 예전에는 빨간 버튼 한 번이면 끝이었는데,
 * 이 시트는 「로그아웃」 바로 아래 메뉴에서 열려서 잘못 눌러 들어오기 쉽다.
 * 자기 닉네임을 옮겨 적는 동안 "무엇을 지우는지"를 한 번 더 읽게 된다
 * (GitHub·Vercel의 저장소 삭제와 같은 방식).
 */
export function WithdrawConfirmSheet({ nickname, pending, error, onConfirm, onClose }: Props) {
    const [typed, setTyped] = useState('')
    // 앞뒤 공백만 털어 낸다 — 대소문자·자모까지 봐주면 확인 절차의 뜻이 없어진다
    const matched = typed.trim() === nickname.trim() && nickname.trim().length > 0

    return (
        // 탈퇴 요청 중에는 딤·Escape·드래그로도 닫히지 않는다.
        // 되돌릴 수 없는 동작이라 결과(성공/오류)를 반드시 이 시트에서 보여줘야 한다
        <BottomSheet title="회원 탈퇴" onClose={onClose} dismissible={!pending}>
            <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-8 pt-3">
                <p className="text-sm leading-6 text-content-secondary">
                    탈퇴하면 프로필·닉네임이 지워지고 도감과 기록을 볼 수 없게 돼요.
                </p>

                {/* 되돌릴 수 있는 기간이 있다는 것은 겁을 덜어 주는 정보다 — 경고보다 먼저 읽히게 둔다 */}
                <ul className="mt-3 space-y-1.5 rounded-2xl bg-surface-accent p-3 text-xs leading-5 text-content-secondary">
                    <li>
                        <strong className="text-content-link">{GRACE_DAYS}일</strong> 안에 같은 소셜 계정으로 다시
                        로그인하면 계정이 그대로 되살아나요.
                    </li>
                    <li>
                        <strong className="text-content-link">{GRACE_DAYS}일</strong>이 지나면 계정이 완전히 삭제되고,
                        다시 로그인할 수 없어요.
                    </li>
                </ul>

                <p className="mt-5 text-sm font-medium text-content-primary">
                    확인을 위해 <strong className="text-content-link">{nickname}</strong> 을(를) 입력해 주세요
                </p>
                <div className="mt-2">
                    <TextField
                        // 보이는 안내는 위 문장이 하고, 스크린리더용 이름만 여기서 준다
                        label={`탈퇴 확인 — 닉네임 ${nickname} 입력`}
                        hideLabel
                        value={typed}
                        onChange={(event) => setTyped(event.target.value)}
                        disabled={pending}
                        placeholder={nickname}
                        autoComplete="off"
                        hint={typed.trim() && !matched ? '닉네임이 달라요' : undefined}
                    />
                </div>

                {error && <p className="mt-3 text-sm text-feedback-error">{error}</p>}

                <div className="mt-6 grid grid-cols-2 gap-3">
                    <Button variant="secondary" size="cta" onClick={onClose} disabled={pending} fullWidth>
                        취소
                    </Button>
                    <Button
                        variant="danger"
                        size="cta"
                        onClick={onConfirm}
                        // 닉네임이 맞아야 열린다 — 잠긴 이유는 위 라벨이 말하고 있다
                        disabled={!matched}
                        loading={pending}
                        fullWidth
                    >
                        탈퇴하기
                    </Button>
                </div>
            </div>
        </BottomSheet>
    )
}
