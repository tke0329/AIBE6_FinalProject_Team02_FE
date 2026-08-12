/**
 * PWA 아이콘 생성 — `public/icon/icon.png` 하나에서 필요한 변형을 뽑는다.
 *
 *   node scripts/build-icons.mjs
 *
 * 왜 변형이 필요한가 (플랫폼이 알파를 다르게 다룬다)
 *
 *   | 산출물                  | 배경   | 이유                                        |
 *   | ----------------------- | ------ | ------------------------------------------- |
 *   | icon-192 / icon-512     | 투명   | 안드로이드·데스크톱은 알파를 그대로 그린다  |
 *   | icon-maskable-512       | 채움   | 런처가 원·스퀴클로 자른 안쪽을 채워야 한다  |
 *   | src/app/apple-icon      | 채움   | iOS는 알파를 검정으로 렌더한다              |
 *
 * 배경을 채우는 두 장은 내용을 **줄여서 여백을 만든다.** 원본은 그림이 프레임
 * 끝까지 차 있어서(여백 좌 9 · 우 11 · 상 24 · 하 13px) 마스크에 잘린다.
 *
 * sharp는 next가 이미지 최적화용으로 끌고 오므로 따로 설치할 게 없다.
 * 없다고 나오면 `npm i -D sharp`. package.json에 넣지 않은 건 스프린트 중
 * 잠금파일 충돌을 만들지 않으려는 것뿐이다.
 */
import { existsSync, mkdirSync, statSync } from 'node:fs'
import { dirname } from 'node:path'

const SOURCE = 'public/icon/icon.png'

/** 마스크·iOS 아이콘 바탕. watermelon-100 — 흰 고양이가 묻히지 않는 가장 연한 브랜드색 */
const BACKDROP = { r: 0xff, g: 0xe0, b: 0xe7, alpha: 1 }

/**
 * 내용을 캔버스의 몇 %까지 키울지.
 *
 * maskable 안전영역은 규격상 **지름 80% 원**이다. 통용되는 80%를 그대로 쓰면
 * 이 그림은 가장자리 음식이 4.6% 잘린다. 비율을 훑어 보고 0.72로 잡았음.
 *
 *   | fit  | 원형 마스크 잘림 | 48px 런처에서 그림 폭 |
 *   | ---- | ---------------- | --------------------- |
 *   | 0.80 | 4.6%             | 38.4px                |
 *   | 0.76 | 2.4%             | 36.5px                |
 *   | 0.72 | **0.6%**         | **34.6px**            |
 *   | 0.68 | 0.0%             | 32.6px                |
 *
 * 0.68까지 내려도 0.6%밖에 더 못 줄이면서 그림만 2px 작아진다. 더 줄이면 48px
 * 런처에서 뭐가 그려졌는지 안 보이는 쪽이 손해가 크다.
 *
 * apple은 iOS 스퀴클(모서리 반지름 약 22.4%) 기준으로 0.84면 모서리에 닿지 않음
 */
const FIT = { maskable: 0.72, apple: 0.84 }

/** 셀 셰이딩 그림이라 256색 팔레트로도 띠가 안 생긴다. 512는 스플래시에도 쓰여 용량이 아깝다 */
const PNG = { compressionLevel: 9, palette: true, quality: 92, effort: 10 }

let sharp
try {
    sharp = (await import('sharp')).default
} catch {
    console.error('sharp가 없습니다. `npm i -D sharp` 후 다시 실행해 주세요.')
    process.exit(1)
}

if (!existsSync(SOURCE)) {
    console.error(`${SOURCE}가 없습니다. 원본 아이콘을 그 경로에 두고 다시 실행해 주세요.`)
    process.exit(1)
}

/** 불투명 픽셀의 경계상자. 원본 여백이 제각각이라 좌표를 직접 잰다 */
async function contentBox(path) {
    const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const { width, height, channels } = info
    let left = width
    let top = height
    let right = -1
    let bottom = -1

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            // 16 이하는 안티에일리어싱 꼬리로 보고 무시 — 안 그러면 경계상자가 프레임 전체가 된다
            if (data[(y * width + x) * channels + 3] <= 16) continue
            if (x < left) left = x
            if (x > right) right = x
            if (y < top) top = y
            if (y > bottom) bottom = y
        }
    }
    return { left, top, width: right - left + 1, height: bottom - top + 1 }
}

/** 알파 그대로. 크기만 맞춘다 */
async function plain(size, out) {
    await sharp(SOURCE)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png(PNG)
        .toFile(out)
    return out
}

/** 내용을 잘라내 fit 비율로 줄이고, 배경 위 가운데 놓는다 */
async function padded(size, fit, out, box) {
    const inner = Math.round(size * fit)
    const content = await sharp(SOURCE)
        .extract(box)
        .resize(inner, inner, { fit: 'inside' }) // 비율 유지 — 음식이 찌그러지면 안 된다
        .toBuffer()

    mkdirSync(dirname(out), { recursive: true })
    await sharp({ create: { width: size, height: size, channels: 4, background: BACKDROP } })
        .composite([{ input: content, gravity: 'centre' }])
        .png(PNG)
        .toFile(out)
    return out
}

const box = await contentBox(SOURCE)
const meta = await sharp(SOURCE).metadata()
console.log(`원본 ${meta.width}x${meta.height} · 내용 ${box.width}x${box.height} (좌 ${box.left} · 상 ${box.top})`)
if (meta.width < 512) {
    console.log(`  주의: 원본이 512보다 작아 icon-512는 확대본입니다. 더 큰 원본이 생기면 다시 돌려 주세요`)
}

const made = [
    await plain(192, 'public/icon/icon-192.png'),
    await plain(512, 'public/icon/icon-512.png'),
    await padded(512, FIT.maskable, 'public/icon/icon-maskable-512.png', box),
    await padded(180, FIT.apple, 'src/app/apple-icon.png', box),
]

for (const path of made) {
    const { width, height } = await sharp(path).metadata()
    console.log(`  ${path} — ${width}x${height} · ${(statSync(path).size / 1024).toFixed(0)}KB`)
}
