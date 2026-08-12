/**
 * 클립보드에 글을 넣는다. 성공했는지 돌려준다.
 *
 * 성공 여부를 반드시 봐야 한다 — 클립보드 API는 **https나 localhost에서만 존재하고**,
 * 있어도 사용자가 권한을 거부할 수 있다. 결과를 보지 않으면 아무 것도 복사되지 않았는데
 * 화면은 "복사했어요"라고 말하게 된다.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    if (!navigator.clipboard) return false
    try {
        await navigator.clipboard.writeText(text)
        return true
    } catch {
        return false
    }
}
