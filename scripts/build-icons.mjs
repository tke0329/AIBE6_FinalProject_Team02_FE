/**
 * PWA 아이콘 생성 — `public/icon/icon.png` 하나에서 필요한 변형을 뽑는다.
 *
 *   node scripts/build-icons.mjs
 *
 * ## 담는 방식 — 꽉 채우고 남는 곳만 색으로 메운다
 *
 * 그림을 줄여 사방에 여백을 두는 대신, **불투명 픽셀의 경계상자를 잘라 캔버스에 꽉 맞춘다.**
 * 고양이가 정사각형이 아니라서 짧은 축에만 띠가 남는데, 그 부분만 브랜드색으로 채운다.
 * 고양이 실루엣 바깥의 투명한 자리도 같은 색이 받쳐 준다.
 *
 *   | 산출물                  | 배경 | 비고                                       |
 *   | ----------------------- | ---- | ------------------------------------------ |
 *   | icon-192 / icon-512     | 채움 | 안드로이드·데스크톱                        |
 *   | icon-maskable-512       | 채움 | 런처가 원·스퀴클로 자른다 (아래 주의)      |
 *   | src/app/apple-icon      | 채움 | iOS는 알파를 검정으로 렌더해 배경이 필수    |
 *   | src/app/icon            | 채움 | **브라우저 탭 파비콘.** Next 파일 규약으로 link 태그가 자동 생성됨 |
 *
 * ⚠️ **maskable 주의.** 규격상 안전영역은 지름 80% 원이다. 꽉 채우면 원형 런처에서
 * 귀·셰프모자·꼬리 끝이 잘린다. 배경색이 깔려 있어 "잘린 티"는 안 나지만, 잘리는 게
 * 싫으면 `MASKABLE_INSET`을 0.1~0.2쯤 주면 그만큼 안쪽으로 들어온다.
 *
 * sharp는 next가 이미지 최적화용으로 끌고 오므로 따로 설치할 게 없다.
 * 없다고 나오면 `npm i -D sharp`.
 */
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const SOURCE = 'public/icon/icon.png'

/** 빈자리를 메우는 색. watermelon-100 — 흰 고양이가 묻히지 않는 가장 연한 브랜드색 */
const BACKDROP = { r: 0xff, g: 0xe0, b: 0xe7, alpha: 1 }

/**
 * maskable만 안쪽으로 얼마나 들일지 (0 = 꽉 채움).
 * 0.12면 내용이 캔버스의 88%가 되어 원형 마스크에 거의 안 잘린다.
 */
const MASKABLE_INSET = 0

/**
 * 탭 파비콘은 **얼굴만 잘라 쓴다.**
 *
 * 전신을 32px로 줄이면 얼굴이 8px도 안 돼서 눈·입이 뭉개진다. 파비콘은 인식이 전부라
 * 앱 아이콘과 그림이 달라도 알아볼 수 있는 쪽이 낫다.
 *
 * 경계상자에 대한 **비율**이라 원본 크기가 달라져도 따라간다. 다만 고양이의 구도(얼굴이
 * 어디쯤 있는지)가 바뀌면 다시 잡아야 한다 — `_favpreview` 식으로 32px로 줄여 보고 맞춘다.
 */
const FACE_CROP = { x: 0.18, y: 0.19, w: 0.66, h: 0.6 }

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

/**
 * 불투명 픽셀의 경계상자. 원본 여백이 제각각이라 좌표를 직접 잰다.
 *
 * 투명 픽셀이 하나도 없으면 배경이 안 지워진 원본이다 — 배경 제거 서비스의 *미리보기*
 * (회색 격자가 실제 픽셀로 그려진 이미지)를 받으면 이렇게 된다. 그대로 쓰면 격자가
 * 아이콘에 그대로 박히므로 여기서 멈춘다.
 */
async function contentBox(path) {
    const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const { width, height, channels } = info
    let left = width
    let top = height
    let right = -1
    let bottom = -1
    let transparent = 0

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            // 16 이하는 안티에일리어싱 꼬리로 보고 무시 — 안 그러면 경계상자가 프레임 전체가 된다
            if (data[(y * width + x) * channels + 3] <= 16) {
                transparent += 1
                continue
            }
            if (x < left) left = x
            if (x > right) right = x
            if (y < top) top = y
            if (y > bottom) bottom = y
        }
    }
    if (transparent === 0) {
        console.error('원본에 투명한 픽셀이 하나도 없습니다 — 배경이 안 지워진 이미지입니다.')
        console.error('배경 제거 사이트의 "미리보기"가 아니라 실제 투명 PNG를 내려받아 주세요.')
        process.exit(1)
    }
    return { left, top, width: right - left + 1, height: bottom - top + 1 }
}

/**
 * 경계상자를 잘라 캔버스에 꽉 맞추고, 남는 띠를 배경색으로 채운다.
 * `inside`라 비율은 유지된다 — 음식이 찌그러지지 않는다.
 */
async function fill(size, out, box, inset = 0) {
    const inner = Math.round(size * (1 - inset))
    const content = await sharp(SOURCE).extract(box).resize(inner, inner, { fit: 'inside' }).toBuffer()

    mkdirSync(dirname(out), { recursive: true })
    await sharp({ create: { width: size, height: size, channels: 4, background: BACKDROP } })
        .composite([{ input: content, gravity: 'centre' }])
        .png(PNG)
        .toFile(out)
    return out
}

/**
 * PNG 여러 장을 `.ico` 컨테이너로 묶는다.
 *
 * sharp는 ico를 못 쓰지만 포맷 자체가 단순하다 — 6바이트 헤더 + 16바이트짜리 목록 +
 * 이미지 데이터. 데이터를 BMP 대신 **PNG 그대로** 넣는 방식은 Windows Vista 이후와
 * 모든 현대 브라우저가 읽는다. 이거 하나 때문에 의존성을 늘릴 이유가 없다.
 */
function buildIco(images) {
    const header = Buffer.alloc(6)
    header.writeUInt16LE(0, 0) // reserved
    header.writeUInt16LE(1, 2) // 1 = 아이콘
    header.writeUInt16LE(images.length, 4)

    const entries = Buffer.alloc(16 * images.length)
    let offset = 6 + 16 * images.length
    images.forEach(({ size, data }, i) => {
        const at = 16 * i
        // 256은 0으로 적는 게 규격이다
        entries.writeUInt8(size >= 256 ? 0 : size, at)
        entries.writeUInt8(size >= 256 ? 0 : size, at + 1)
        entries.writeUInt8(0, at + 2) // 팔레트 색 수 (트루컬러라 0)
        entries.writeUInt8(0, at + 3) // reserved
        entries.writeUInt16LE(1, at + 4) // 플레인
        entries.writeUInt16LE(32, at + 6) // 비트 깊이
        entries.writeUInt32LE(data.length, at + 8)
        entries.writeUInt32LE(offset, at + 12)
        offset += data.length
    })
    return Buffer.concat([header, entries, ...images.map((i) => i.data)])
}

/** 잘라낸 영역을 배경색 위에 얹어 지정 크기 PNG 버퍼로 */
async function fillBuffer(size, crop) {
    const content = await sharp(SOURCE).extract(crop).resize(size, size, { fit: 'inside' }).toBuffer()
    return sharp({ create: { width: size, height: size, channels: 4, background: BACKDROP } })
        .composite([{ input: content, gravity: 'centre' }])
        .png({ compressionLevel: 9 })
        .toBuffer()
}

const box = await contentBox(SOURCE)
const meta = await sharp(SOURCE).metadata()
const ratio = (box.width / box.height).toFixed(3)
console.log(
    `원본 ${meta.width}x${meta.height} · 내용 ${box.width}x${box.height} (좌 ${box.left} · 상 ${box.top}) · 가로세로비 ${ratio}`,
)
if (meta.width < 512) {
    console.log(`  주의: 원본이 512보다 작아 icon-512는 확대본입니다. 더 큰 원본이 생기면 다시 돌려 주세요`)
}

/** 얼굴 크롭 — 원본 밖으로 나가지 않게 가둔다 */
const face = (() => {
    const left = Math.max(0, Math.round(box.left + box.width * FACE_CROP.x))
    const top = Math.max(0, Math.round(box.top + box.height * FACE_CROP.y))
    return {
        left,
        top,
        width: Math.min(meta.width - left, Math.round(box.width * FACE_CROP.w)),
        height: Math.min(meta.height - top, Math.round(box.height * FACE_CROP.h)),
    }
})()
console.log(`  파비콘 얼굴 크롭 ${face.width}x${face.height} (좌 ${face.left} · 상 ${face.top})`)

const made = [
    await fill(192, 'public/icon/icon-192.png', box),
    await fill(512, 'public/icon/icon-512.png', box),
    await fill(512, 'public/icon/icon-maskable-512.png', box, MASKABLE_INSET),
    await fill(180, 'src/app/apple-icon.png', box),
    // 탭 파비콘. 브라우저가 16~32px로 줄여 그리므로 원본을 크게 둘 이유가 없다.
    // 96이면 레티나 탭(32@2x)까지 덮으면서 용량이 붙지 않는다
    await fill(96, 'src/app/icon.png', face),
]

/**
 * `/favicon.ico` — 루트로 직접 찾아오는 옛 클라이언트·크롤러·RSS 리더용.
 * 탭에는 위의 `icon.png`가 쓰이지만, 이 파일이 없으면 404 요청이 계속 남는다.
 * 16·32·48 세 벌을 담는다 (탭 / 북마크·작업표시줄 / 고해상도)
 */
const ICO = 'src/app/favicon.ico'
const icoSizes = [16, 32, 48]
writeFileSync(
    ICO,
    buildIco(await Promise.all(icoSizes.map(async (size) => ({ size, data: await fillBuffer(size, face) })))),
)
made.push(ICO)

for (const path of made) {
    const kb = `${(statSync(path).size / 1024).toFixed(0)}KB`
    if (path.endsWith('.ico')) {
        // sharp가 ico를 못 읽어 크기는 우리가 아는 값을 적는다
        console.log(`  ${path} — ${icoSizes.join('/')}px 3장 · ${kb}`)
        continue
    }
    const { width, height } = await sharp(path).metadata()
    console.log(`  ${path} — ${width}x${height} · ${kb}`)
}
