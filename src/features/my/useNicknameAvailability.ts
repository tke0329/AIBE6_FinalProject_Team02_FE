'use client'

import { useEffect, useRef, useState } from 'react'
import { checkNicknameAvailability } from './api'
import { NICKNAME_RE } from './nickname'

/** 입력 후 이만큼 조용하면 물어본다. 한 글자마다 부르면 「먹킷냥이」에 네 번 왕복한다 */
const DEBOUNCE_MS = 400

export type NicknameAvailability =
    /** 물어볼 게 없음 — 비어 있거나 형식이 아직 안 맞음 */
    | { state: 'idle' }
    | { state: 'checking' }
    | { state: 'available' }
    | { state: 'taken' }
    /** 못 물어봤음(네트워크 등). **제출을 막지 않는다** */
    | { state: 'failed' }

/**
 * 닉네임 중복을 입력 중에 판정한다. 최초 세팅·변경 두 화면이 같이 쓴다.
 *
 * ## 왜 훅으로 뺐나
 *
 * 디바운스와 「늦게 온 응답 버리기」를 화면마다 따로 쓰면 한쪽만 고쳐지기 쉽다.
 * 두 화면의 판정이 어긋나면 같은 닉네임이 한 화면에서는 되고 다른 화면에서는 안 되는 것처럼 보인다.
 *
 * ## 형식을 통과한 값만 물어본다
 *
 * 서버는 형식이 어긋나면 400을 준다. 「먹」처럼 아직 두 글자가 안 된 입력으로 부르면
 * 실패가 쌓이므로, 형식 판정은 여기서 먼저 하고 통과한 값만 보낸다.
 *
 * ## 늦게 온 응답은 버린다
 *
 * 「가」를 물어본 응답이 「가나다」를 입력한 뒤에 도착하면 화면이 옛 답으로 덮인다.
 * 요청마다 번호를 매겨 마지막 것만 반영한다.
 *
 * ## 실패는 「사용 중」이 아니다
 *
 * 못 물어본 것을 중복으로 취급하면 서버가 잠깐 불안할 때 아무 닉네임도 못 정한다.
 * `failed`는 안내만 하고 제출은 열어 둔다 — 저장할 때 서버가 다시 판정해 409를 준다
 */
export function useNicknameAvailability(nickname: string, options?: { skip?: boolean }): NicknameAvailability {
    const skip = options?.skip ?? false
    const [result, setResult] = useState<NicknameAvailability>({ state: 'idle' })
    // 요청 순번 — 늦게 온 응답을 버리는 기준
    const seq = useRef(0)

    const trimmed = nickname.trim()
    const askable = !skip && NICKNAME_RE.test(trimmed)

    useEffect(() => {
        if (!askable) {
            setResult({ state: 'idle' })
            return
        }

        setResult({ state: 'checking' })
        const mine = ++seq.current
        const timer = setTimeout(() => {
            checkNicknameAvailability(trimmed)
                .then((r) => {
                    if (mine !== seq.current) return // 그 사이 더 입력됨
                    setResult({ state: r.available ? 'available' : 'taken' })
                })
                .catch(() => {
                    if (mine !== seq.current) return
                    setResult({ state: 'failed' })
                })
        }, DEBOUNCE_MS)

        return () => clearTimeout(timer)
    }, [trimmed, askable])

    return result
}

/** 판정 결과를 한 줄 문구로. `null`이면 보여줄 것이 없음 */
export function availabilityMessage(availability: NicknameAvailability): string | null {
    switch (availability.state) {
        case 'checking':
            return '확인 중…'
        case 'available':
            return '쓸 수 있는 닉네임이에요.'
        case 'taken':
            return '이미 누가 쓰고 있어요.'
        case 'failed':
            return '중복을 확인하지 못했어요. 그대로 저장해 볼 수 있어요.'
        default:
            return null
    }
}
