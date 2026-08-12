'use client'

import { useEffect, useRef } from 'react'

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * 겹쳐 뜬 창 안에 포커스를 가둔다. 모달·바텀시트가 공유한다.
 *
 * 세 가지를 한다.
 * 1. **열릴 때 창으로 포커스 이동** — 그러지 않으면 키보드·스크린리더 사용자는 뒤쪽 화면에 남는다
 * 2. **Tab이 창 밖으로 못 나가게** 첫/끝을 이어 붙인다
 * 3. **Escape로 닫고, 닫히면 열었던 버튼으로 포커스 복귀**
 *
 * ## 다루기 까다로웠던 두 가지
 *
 * **`preventScroll: true`가 반드시 필요하다.** 바텀시트는 `translateY(100%)`로 화면 밖에서
 * 시작하는데, 그 상태로 `focus()`를 부르면 브라우저가 그 요소를 보이게 하려고 조상을
 * 스크롤한다. 애니메이션이 끝나 넘침이 사라지면 scrollTop이 0으로 되돌아가서,
 * 뒷화면이 "밀렸다 돌아오는" 덜컹거림으로 보였다.
 *
 * **effect는 마운트 1회다.** 호출부 다수가 `onClose={() => setOpen(false)}`처럼 인라인으로
 * 넘겨 매 렌더마다 함수 identity가 바뀐다. 그걸 deps에 두면 부모가 리렌더될 때마다
 * effect가 다시 돌아 `focus()`가 재실행되고, 창 안에서 글자를 입력하던 포커스를 빼앗는다.
 * 그래서 콜백은 ref로 최신값만 읽는다.
 *
 * @param onRequestClose Escape를 눌렀을 때. 닫힘 연출이 있으면 여기서 시작시킨다
 */
export function useFocusTrap<T extends HTMLElement>(onRequestClose: () => void) {
    const panelRef = useRef<T>(null)
    const closeRef = useRef(onRequestClose)

    useEffect(() => {
        closeRef.current = onRequestClose
    }, [onRequestClose])

    useEffect(() => {
        const trigger = document.activeElement as HTMLElement | null
        const panel = panelRef.current
        panel?.focus({ preventScroll: true })

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                // 창이 겹쳐 있을 때 바깥 창까지 같이 닫히지 않도록 막는다
                event.stopPropagation()
                closeRef.current()
                return
            }
            if (event.key !== 'Tab' || !panel) return

            const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
            if (!items.length) return
            const first = items[0]
            const last = items[items.length - 1]
            const active = document.activeElement

            // 창 자체(tabIndex=-1)에 포커스가 있는 상태에서 Shift+Tab이면 끝으로 감는다
            if (event.shiftKey && (active === first || active === panel)) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && active === last) {
                event.preventDefault()
                first.focus()
            }
        }

        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('keydown', onKeyDown)
            trigger?.focus?.({ preventScroll: true })
        }
        // 마운트 1회. 닫기 핸들러는 ref로 최신값을 읽는다
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return panelRef
}
