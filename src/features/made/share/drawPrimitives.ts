import { CELL_RADIUS, COLOR, sansFont } from './shareCardTheme'

export function clamp(value: number, low: number, high: number): number {
    return Math.max(low, Math.min(value, high))
}

/** object-cover — 짧은 변으로 정사각을 잘라 채운다 */
export function drawCover(
    ctx: CanvasRenderingContext2D,
    bitmap: ImageBitmap,
    x: number,
    y: number,
    size: number,
): void {
    const side = Math.min(bitmap.width, bitmap.height)
    const sx = (bitmap.width - side) / 2
    const sy = (bitmap.height - side) / 2
    ctx.drawImage(bitmap, sx, sy, side, side, x, y, size, size)
}

/**
 * `ctx.roundRect`는 비교적 최근에 들어온 API다.
 * 공유 카드는 구형 기기에서도 최소한 이미지로는 나와야 하므로 arcTo로 직접 그린다
 */
export function roundRectPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
): void {
    const r = Math.min(radius, width / 2, height / 2)
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + width, y, x + width, y + height, r)
    ctx.arcTo(x + width, y + height, x, y + height, r)
    ctx.arcTo(x, y + height, x, y, r)
    ctx.arcTo(x, y, x + width, y, r)
    ctx.closePath()
}

/**
 * 넘치는 글자는 말줄임으로 자른다. 캔버스에는 자동 줄바꿈이 없다
 *
 * 코드 포인트 단위로 자른다 — `slice(0, -1)`은 UTF-16 단위라
 * 닉네임 끝의 이모지에서 서로게이트 페어의 반쪽만 남아 `�`가 된다
 */
export function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    // 들어가면 자를 것도 없다. 프레임마다 도는 경로라 여기서 끝나야 한다
    if (ctx.measureText(text).width <= maxWidth) return text

    const chars = Array.from(text)
    while (chars.length > 1 && ctx.measureText(`${chars.join('')}…`).width > maxWidth) {
        chars.pop()
    }
    return `${chars.join('')}…`
}

/**
 * 여러 줄로 접는다. 칸 안에 짧은 한국어 문구를 넣을 때 쓴다.
 *
 * **띄어쓰기를 먼저 찾는다.** 글자 단위로 끊으면 "든든해 / 요"처럼 낱말이 갈리는데,
 * 그게 globals.css에서 `word-break: keep-all`로 막은 것과 같은 문제다. 캔버스에는
 * 그런 속성이 없어 직접 해야 한다.
 *
 * 띄어쓰기 없는 한 낱말이 한 줄보다 길면 그때만 글자로 끊는다.
 * `maxLines`를 넘치는 부분은 마지막 줄에 …로 접는다
 */
export function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
    const words = text.split(/\s+/).filter(Boolean)
    if (words.length === 0) return []

    const lines: string[] = []
    let line = ''

    for (const word of words) {
        const candidate = line ? `${line} ${word}` : word
        if (ctx.measureText(candidate).width <= maxWidth) {
            line = candidate
            continue
        }
        if (line) lines.push(line)
        // 낱말 하나가 한 줄보다 길다. 여기서만 글자로 끊는다
        if (ctx.measureText(word).width <= maxWidth) {
            line = word
        } else {
            const chars = Array.from(word)
            let piece = ''
            for (const char of chars) {
                if (ctx.measureText(piece + char).width > maxWidth && piece) {
                    lines.push(piece)
                    piece = char
                } else {
                    piece += char
                }
            }
            line = piece
        }
    }
    if (line) lines.push(line)

    if (lines.length <= maxLines) return lines

    /*
     * 넘쳤다. 마지막에 보이는 줄 끝에 …를 붙여 "뒤에 더 있다"를 알린다.
     * `truncate`를 그냥 쓰면 안 된다 — 그 줄은 이미 폭에 맞게 만들어져서
     * 자를 것이 없다고 판단해 …가 붙지 않는다
     */
    const kept = lines.slice(0, maxLines)
    const chars = Array.from(kept[maxLines - 1])
    while (chars.length > 1 && ctx.measureText(`${chars.join('')}…`).width > maxWidth) {
        chars.pop()
    }
    kept[maxLines - 1] = `${chars.join('')}…`
    return kept
}

/** 대표 뒤에 비스듬히 깔리는 장 */
export function drawStackLayer(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    radians: number,
): void {
    const center = { x: x + size / 2, y: y + size / 2 }
    ctx.save()
    ctx.translate(center.x, center.y)
    ctx.rotate(radians)
    ctx.fillStyle = COLOR.cell
    roundRectPath(ctx, -size / 2, -size / 2, size, size, CELL_RADIUS)
    ctx.fill()
    ctx.restore()
}

/**
 * 알림 배지처럼 숫자만. `N장`은 작은 칸에서 글자가 뭉개진다
 * 칸 크기에 비례하되 위아래로 묶는다 — 아래는 숫자가 읽히는 한계, 위는 배지가 사진을 가리지 않는 한계
 */
export function drawCountBadge(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, count: number): void {
    const diameter = clamp(size * 0.2, 20, 34)
    const radius = diameter / 2
    const center = { x: x + size - radius - 6, y: y + radius + 6 }

    ctx.beginPath()
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2)
    ctx.fillStyle = COLOR.accent
    ctx.fill()

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = sansFont(diameter * 0.56, 700)
    ctx.fillStyle = COLOR.badgeText
    ctx.fillText(String(count), center.x, center.y)
}
