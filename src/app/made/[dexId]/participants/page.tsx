'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { notFound, useParams, useRouter } from 'next/navigation'
import { MadeDexInvite } from '@/features/made/MadeDexInvite'
import {
    fetchActiveInvite,
    fetchMadeDexMembers,
    issueInvite,
    kickMadeDexMember,
    leaveMadeDex,
    transferMadeDexOwner,
} from '@/features/made/api'
import { MADE_DEX_MAX_MEMBERS, parseMadeDexId } from '@/features/made/types'
import type { MadeDexInvite as Invite, MadeDexMember, MadeDexMembers } from '@/features/made/types'
import { isNotOwner, madeErrorMessage } from '@/features/made/errors'
import { copyToClipboard } from '@/shared/lib/clipboard'
import { ROUTES } from '@/shared/lib/routes'

function messageOf(failure: unknown): string {
    return madeErrorMessage(failure, '요청을 처리하지 못했어요.')
}

/** `/made/[dexId]/participants` 초대 코드 + 참여자 관리 */
export default function MadeDexParticipantsPage() {
    const router = useRouter()
    const params = useParams<{ dexId: string }>()

    const dexId = parseMadeDexId(params.dexId)

    const [group, setGroup] = useState<MadeDexMembers | null>(null)
    const [membersLoading, setMembersLoading] = useState(true)
    const [membersFailed, setMembersFailed] = useState(false)
    const [memberBusy, setMemberBusy] = useState(false)
    const [memberError, setMemberError] = useState<string | null>(null)

    const [invite, setInvite] = useState<Invite | null>(null)
    const [loading, setLoading] = useState(true)
    const [issuing, setIssuing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    // 그룹장이 아니면 조회 자체가 403이다. 이건 실패가 아니라 "권한 없음" 화면이다
    const [canManage, setCanManage] = useState(true)
    // 조회가 깨진 것과 코드가 없는 것은 다르다. 섞으면 살아 있는 코드를 죽이는 발급을 권하게 된다
    const [loadFailed, setLoadFailed] = useState(false)

    // 위임 직후 재조회와 "다시 시도"가 겹치면 먼저 쏜 응답이 늦게 도착해 역할을 되돌린다
    const loadSeq = useRef(0)

    // 역할을 먼저 확정하고 코드를 읽는다. 순서를 반대로 하면 일반 멤버에게 매번 403이 나간다
    const load = useCallback(async (madeDexId: number) => {
        const seq = ++loadSeq.current
        const stale = () => seq !== loadSeq.current

        setMembersLoading(true)
        setLoading(true)
        setMemberError(null)
        try {
            const next = await fetchMadeDexMembers(madeDexId)
            if (stale()) return
            setGroup(next)
            setMembersFailed(false)
            setCanManage(next.myRole === 'OWNER')

            if (next.myRole !== 'OWNER') {
                setInvite(null)
                setLoadFailed(false)
                setError(null)
                return
            }

            try {
                const active = await fetchActiveInvite(madeDexId)
                if (stale()) return
                setInvite(active)
                setLoadFailed(false)
                setError(null)
            } catch (failure) {
                if (stale()) return
                // 목록을 읽은 뒤 그룹장이 바뀌었을 수도 있다
                if (isNotOwner(failure)) {
                    setCanManage(false)
                    setLoadFailed(false)
                    setError(null)
                } else {
                    setLoadFailed(true)
                    setError(messageOf(failure))
                }
            }
        } catch (failure) {
            if (stale()) return
            setMembersFailed(true)
            setMemberError(messageOf(failure))
            // 역할을 모르는 상태라 코드 영역도 "불러오지 못함"으로 둔다
            setLoadFailed(true)
        } finally {
            if (!stale()) {
                setMembersLoading(false)
                setLoading(false)
            }
        }
    }, [])

    useEffect(() => {
        if (dexId) void load(dexId)
    }, [dexId, load])

    if (!dexId) notFound()

    const issue = async () => {
        setIssuing(true)
        setError(null)
        try {
            setInvite(await issueInvite(dexId))
        } catch (failure) {
            // 조회는 됐는데 발급에서 403이면 그사이 그룹장이 위임된 것이다
            if (isNotOwner(failure)) setCanManage(false)
            else setError(messageOf(failure))
        } finally {
            setIssuing(false)
        }
    }

    // 위임처럼 여러 행이 한꺼번에 바뀌는 경우가 있어 낙관적 갱신 대신 다시 읽는다
    const runMemberAction = async (action: () => Promise<void>) => {
        setMemberBusy(true)
        setMemberError(null)
        try {
            await action()
            await load(dexId)
        } catch (failure) {
            setMemberError(messageOf(failure))
        } finally {
            setMemberBusy(false)
        }
    }

    const kick = (member: MadeDexMember) => void runMemberAction(() => kickMadeDexMember(dexId, member.userId))

    const transfer = (member: MadeDexMember) => void runMemberAction(() => transferMadeDexOwner(dexId, member.userId))

    // 나간 뒤에는 이 화면을 볼 권한이 없어 목록으로 돌려보낸다
    const leave = async () => {
        setMemberBusy(true)
        setMemberError(null)
        try {
            await leaveMadeDex(dexId)
            router.replace(ROUTES.made)
        } catch (failure) {
            setMemberError(messageOf(failure))
            setMemberBusy(false)
        }
    }

    // 링크는 지금 보고 있는 앱의 주소로 만든다 — 서버가 배포 주소를 알 필요가 없다
    const inviteLink =
        invite && typeof window !== 'undefined'
            ? `${window.location.origin}${ROUTES.madeJoinWithCode(invite.code)}`
            : null

    return (
        <MadeDexInvite
            dexTitle={group?.name ?? '제작 도감'}
            code={invite?.code ?? null}
            expiresAt={invite?.expiresAt ?? null}
            inviteLink={inviteLink}
            canManage={canManage}
            loading={loading}
            loadFailed={loadFailed}
            issuing={issuing}
            error={error}
            members={group?.members ?? []}
            maxMembers={group?.maxMembers ?? MADE_DEX_MAX_MEMBERS}
            myRole={group?.myRole ?? null}
            membersLoading={membersLoading}
            membersFailed={membersFailed}
            memberBusy={memberBusy}
            memberError={memberError}
            onBack={() => router.push(ROUTES.madeInfo(dexId))}
            onIssue={() => void issue()}
            onRetry={() => void load(dexId)}
            onCopy={copyToClipboard}
            onKick={kick}
            onTransfer={transfer}
            onLeave={() => void leave()}
        />
    )
}
