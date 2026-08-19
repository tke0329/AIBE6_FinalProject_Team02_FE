/**
 * 뒤로가기를 자연스럽게 만드는 히스토리 도우미.
 *
 * ## 문제 1 — `router.back()`을 부를 수 있는지 알 수 없다
 *
 * 화면의 ← 버튼은 "왔던 자리"로 가야 한다. 그런데 그 자리가 없을 수도 있다 —
 * 공유 링크·PWA 딥링크로 그 화면이 **첫 항목**으로 열린 경우다. 그때 `back()`을
 * 부르면 앱을 벗어난다. 그래서 예전 코드는 `router.push(목록)`으로 도망갔는데,
 * 그건 앞 항목이 있을 때 히스토리를 계속 늘려 브라우저 뒤로가기를 망가뜨린다.
 *
 * Next App Router는 "앞 항목이 있나"를 알려주지 않는다. 그래서 우리가 앱 안에서
 * push를 한 사실을 탭 단위로 남겨 대신 쓴다.
 *
 * **한 번 켜면 지우지 않는다.** 예전 `challenge:fromList`는 뒤로가기 한 번에
 * 지웠다. 목록 → 상세 → 프로필 → (뒤로) 상세 로 돌아온 다음의 ←가 `push`로
 * 떨어져, 브라우저 뒤로가기가 다시 상세로 들어가는 고리가 생겼다.
 *
 * ## 문제 2 — 시트를 열고 닫으면 히스토리에 쓰레기가 남는다
 *
 * 모바일에서 시트는 뒤로가기로 닫혀야 한다(= 열 때 `push`). 그런데 X로 닫을 때
 * `replace`를 하면 **항목 자체는 남는다.** 음식 상세를 3개 보면 같은 페이지를
 * 가리키는 항목이 3개 쌓여, 화면을 벗어나려면 뒤로가기를 4번 눌러야 했다.
 *
 * 그래서 닫을 때는 `router.back()`으로 **내가 넣은 항목을 되돌린다.** 단, 시트가
 * URL로 바로 열린 경우(딥링크)에는 앞 항목이 내 것이 아니므로 `replace`로 지워야
 * 한다.
 *
 * ### 그 구분을 **URL에 남긴다** (세션 저장소가 아니라)
 *
 * 처음에는 `sessionStorage`에 "내가 push했다" 표시를 뒀는데 어긋났다. 표시는 앱에
 * 하나뿐인데 히스토리 항목은 여러 개라, 둘이 따로 놀면 맞출 방법이 없다. 특히
 * `router.push`는 즉시 반영되지 않아서, 표시를 켠 뒤 URL이 바뀌기 전에 한 번 더
 * 렌더되면 "시트가 안 열렸네"라고 판단한 정리 코드가 표시를 지워 버린다. 그러면
 * X가 `back` 대신 `replace`로 떨어져 **항목이 남고, 뒤로가기를 한 번 더 눌러야 했다.**
 *
 * 표식을 쿼리(`ov=1`)에 넣으면 그 항목에 **붙어서 같이 움직인다.** 뒤로·앞으로 어떻게
 * 오가든 지금 보고 있는 항목이 내가 넣은 것인지가 URL만 보면 늘 맞다. 저장소도,
 * 정리 코드도, 경합도 없다.
 */

const NAV_KEY = 'catcheat:in-app-nav'

/**
 * "이 히스토리 항목은 오버레이를 열려고 내가 넣은 것"이라는 표식.
 *
 * 사용자에게 보이는 주소에 남지만, 공유된 링크에 섞여 들어와도 해가 없다 —
 * 그때는 뒤 항목이 없어 `back()`이 안 불릴 뿐이고 시트는 정상적으로 열린다
 */
export const OVERLAY_PARAM = 'ov'

function read(key: string): string | null {
    if (typeof window === 'undefined') return null
    try {
        return sessionStorage.getItem(key)
    } catch {
        return null // 사파리 비공개 모드
    }
}

function write(key: string) {
    try {
        sessionStorage.setItem(key, '1')
    } catch {
        // 저장 못 해도 기능은 굴러가야 함 — push 대체 경로로 떨어짐
    }
}

/** 앱 안에서 `router.push`로 이동하기 직전에 부른다 */
export function markInAppNav() {
    write(NAV_KEY)
}

/** `router.back()`이 앱 안에 머무를 수 있는지 */
export function hasInAppHistory(): boolean {
    return read(NAV_KEY) === '1'
}

/** `useRouter()`가 주는 것 중 여기서 쓰는 것만 */
interface NavRouter {
    back(): void
    push(href: string): void
}

/**
 * 앱 안에서 다른 화면을 연다. **`router.push` 대신 항상 이걸 쓴다.**
 *
 * `markInAppNav()`를 손으로 붙이는 방식이었는데, 붙이는 걸 잊은 자리가 실제로 있었다
 * (리뷰의 프로필 아바타). 잊으면 그 화면의 ←가 `back` 대신 `push`로 떨어져 히스토리가 는다.
 * 표시와 이동을 한 함수로 묶어 두면 잊을 자리가 없다
 */
export function pushInApp(router: NavRouter, href: string) {
    markInAppNav()
    router.push(href)
}

/**
 * 화면의 ← 가 할 일. **`router.push(부모)`로 돌아가지 않는다.**
 *
 * 앱 화면 대부분의 ←가 부모 경로를 `push`하고 있었다. 그러면 마이 → 뱃지 → ← 를
 * 거칠 때마다 항목이 **하나씩 늘어난다.** 사용자가 그 뒤에 브라우저·제스처 뒤로가기를
 * 누르면 방금 나온 뱃지 화면으로 도로 들어간다 — "뒤로가기가 이상하다"의 대부분이 이것이다.
 *
 * 왔던 자리가 있으면 그리로 되돌아가고(`back`), 공유 링크·PWA 딥링크로 이 화면이 첫
 * 항목이라 되돌아갈 자리가 없을 때만 `fallback`으로 밀어 넣는다
 */
export function goBackOr(router: NavRouter, fallback: string) {
    if (hasInAppHistory()) router.back()
    else router.push(fallback)
}

/**
 * 지금 보고 있는 항목을 **오버레이를 열려고 내가 넣었는지.**
 * true면 닫을 때 `router.back()`으로 그 항목을 되돌린다 — 히스토리에 흔적이 안 남는다.
 * false면(딥링크로 바로 열린 경우) `replace`로 파라미터만 지운다.
 *
 * `useSearchParams()`가 주는 것도, 손으로 만든 `URLSearchParams`도 그대로 받는다
 */
export function isOverlayEntry(params: { get(name: string): string | null }): boolean {
    return params.get(OVERLAY_PARAM) === '1'
}
