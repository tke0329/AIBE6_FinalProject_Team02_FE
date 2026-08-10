/**
 * 만들어 둔 파일을 공유 시트로 넘긴다
 *
 * 공유 시트에 어떤 앱이 뜨는지는 OS와 설치된 앱이 정한다 —
 * "인스타 스토리로 바로"는 보장할 수 없고, 사용자가 시트에서 고르는 흐름이다
 */

export type ShareOutcome = 'shared' | 'canceled' | 'downloaded'

/** `share()`를 그냥 부르면 미지원 환경에서 예외가 난다. 반드시 먼저 묻는다 */
export function canShareFile(file: File): boolean {
    return typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] }) === true
}

function downloadFile(file: File): void {
    const url = URL.createObjectURL(file)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = file.name

    // 문서에 붙지 않은 a는 파이어폭스에서 내려받기가 시작되지 않는다
    anchor.hidden = true
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()

    // 곧바로 해제하면 일부 브라우저가 내려받기를 놓친다
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/**
 * 공유 시트를 열고, 못 열면 내려받는다
 *
 * **클릭 핸들러에서 곧바로 불러야 한다.** iOS Safari는 사용자 제스처 컨텍스트 안에서만
 * `share()`를 허용해서, 앞에 `await`가 하나라도 끼면 `NotAllowedError`로 죽는다.
 * 그래서 인코딩은 버튼을 누르기 전에 끝나 있어야 한다
 */
export async function shareOrDownload(file: File): Promise<ShareOutcome> {
    if (!canShareFile(file)) {
        downloadFile(file)
        return 'downloaded'
    }

    try {
        await navigator.share({ files: [file] })
        return 'shared'
    } catch (error) {
        // 사용자가 시트를 닫은 것은 실패가 아니다. 조용히 넘어간다
        if (error instanceof DOMException && error.name === 'AbortError') return 'canceled'
        downloadFile(file)
        return 'downloaded'
    }
}
