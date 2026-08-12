'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MadeDexCodeEntry } from '@/features/made/MadeDexInvite'
import { fetchInvitePreview, joinMadeDex } from '@/features/made/api'
import { INVITE_CODE_LENGTH, normalizeInviteCode } from '@/features/made/types'
import type { MadeDexId } from '@/features/made/types'
import { useAuth } from '@/features/auth/AuthContext'
import { madeErrorMessage } from '@/features/made/errors'
import { ApiError } from '@/shared/lib/api'
import { ROUTES } from '@/shared/lib/routes'
import { Handshake } from 'lucide-react'

function messageOf(failure: unknown): string {
    return madeErrorMessage(failure, '참여하지 못했어요. 잠시 후 다시 시도해 주세요.')
}

function JoinContent() {
    const router = useRouter()
    const linkedCode = useSearchParams().get('code')
    const { me, loading: authLoading } = useAuth()

    const [code, setCode] = useState('')
    const [groupName, setGroupName] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [alreadyJoined, setAlreadyJoined] = useState(false)
    // 미리보기 응답이 늦게 도착했을 때 "지금 입력된 코드"와 대조하려고 들고 있는다
    const codeRef = useRef('')
    // 이미 참여 중이라고 알릴 때 어디로 보낼지. 미리보기를 못 읽었으면 목록으로 보낸다
    const previewDexId = useRef<MadeDexId | null>(null)

    const changeCode = useCallback((value: string) => {
        const next = normalizeInviteCode(value)
        codeRef.current = next
        previewDexId.current = null
        setCode(next)
        setGroupName(null)
        setError(null)
        setAlreadyJoined(false)
    }, [])

    // 미리보기는 링크로 들어온 경우에만 부른다.
    // 입력할 때마다 부르면 코드를 넣어보며 남의 그룹 이름을 캐낼 수 있다.
    useEffect(() => {
        if (!linkedCode || !me) return
        const prefilled = normalizeInviteCode(linkedCode)
        codeRef.current = prefilled
        // 링크가 바뀌었는데 이전 미리보기가 남으면 "도감 열기"가 옛 도감으로 간다
        previewDexId.current = null
        setCode(prefilled)
        setGroupName(null)
        setError(null)
        setAlreadyJoined(false)
        if (prefilled.length !== INVITE_CODE_LENGTH) return

        let alive = true
        // 응답이 도는 사이 사용자가 다른 코드를 입력했다면 그 결과는 버린다.
        // 그러지 않으면 입력창의 코드와 화면의 그룹 이름이 어긋난다
        const isStale = () => !alive || codeRef.current !== prefilled

        fetchInvitePreview(prefilled)
            .then((preview) => {
                if (isStale()) return
                previewDexId.current = preview.madeDexId
                setGroupName(preview.name)
                setAlreadyJoined(preview.alreadyMember)
            })
            .catch((failure) => {
                if (!isStale()) setError(messageOf(failure))
            })
        return () => {
            alive = false
        }
    }, [linkedCode, me, router])

    const submit = useCallback(async () => {
        setSubmitting(true)
        setError(null)
        try {
            router.replace(ROUTES.madeDex(await joinMadeDex(code)))
        } catch (failure) {
            // 미리보기 이후 참여했을 수도 있어 여기서도 같은 안내를 띄운다
            if (failure instanceof ApiError && failure.code === 'MADE_DEX_ALREADY_JOINED') {
                setAlreadyJoined(true)
            } else {
                setError(messageOf(failure))
            }
            setSubmitting(false)
        }
    }, [code, router])

    const goToJoinedDex = () => {
        const dexId = previewDexId.current
        router.replace(dexId ? ROUTES.madeDex(dexId) : ROUTES.made)
    }

    // 초대 링크 자체는 로그인 없이 열리지만, 참여는 내가 누구인지 알아야 가능하다.
    // 로그인 후 원래 링크로 되돌리는 처리는 OAuth 콜백이 홈 고정이라 아직 없다.
    if (!authLoading && !me) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-4 bg-surface-app px-8 text-center">
                <Handshake size={44} strokeWidth={1.5} className="text-watermelon-500" aria-hidden />
                <p className="text-sm leading-5 text-neutral-800">
                    로그인하면 초대받은 도감에 참여할 수 있어요.
                    <br />
                    로그인한 뒤 초대 링크를 다시 눌러 주세요.
                </p>
                <button
                    onClick={() => router.push(ROUTES.login)}
                    className="rounded-2xl bg-watermelon-500 px-6 py-3 font-display text-white shadow-card"
                >
                    로그인하러 가기
                </button>
            </div>
        )
    }

    return (
        <MadeDexCodeEntry
            code={code}
            onCodeChange={changeCode}
            groupName={groupName}
            alreadyJoined={alreadyJoined}
            submitting={submitting}
            error={error}
            onBack={() => router.push(ROUTES.made)}
            onSubmit={() => (alreadyJoined ? goToJoinedDex() : void submit())}
        />
    )
}

/** `/made/join` 초대 코드로 제작 도감 참여 (useSearchParams는 Suspense로 감싼다) */
export default function MadeDexJoinPage() {
    return (
        <Suspense fallback={null}>
            <JoinContent />
        </Suspense>
    )
}
