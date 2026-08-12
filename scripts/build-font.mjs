/**
 * 온글잎 딩궁딩굴 TTF를 웹폰트로 자른다.
 *
 * 원본이 6.1MB라 그대로는 못 쓴다. 한글 폰트는 글자 수가 많아 라틴 폰트처럼
 * "woff2로 바꾸면 끝"이 아니고, **유니코드 구간별로 쪼개서 필요한 조각만 받게** 해야 한다.
 * Pretendard와 Jua가 쓰는 방식이 이것이고(Jua는 87조각), 여기서도 같게 간다.
 *
 * ## 자르는 기준
 *
 * - **0번 조각(핵심)** — 라틴·숫자·문장부호·자모 + **앱 소스에 실제로 등장하는 한글**.
 *   화면에 박혀 있는 문구는 전부 여기 들어가므로, 첫 화면은 이 조각 하나로 그려진다.
 * - **1번 이후** — 나머지 한글 음절을 코드포인트 순서로 쪼갠다.
 *   음식 이름·닉네임처럼 서버에서 오는 글자가 여기서 걸린다. 보통 한두 조각만 더 받는다.
 *
 * ## 바뀐 게 없으면 다시 만들지 않는다
 *
 * woff2 인코딩이 **결정적이지 않다.** 같은 입력으로 다시 돌리면 바이트가 달라져서
 * 아무 것도 안 바뀌었는데 **67개 파일이 변경으로 잡힌다.** 두 사람이 각자 돌리면
 * 매번 바이너리 충돌이 난다.
 *
 * 그래서 입력(원본 폰트 + 조각 크기 + 0번 조각에 넣을 글자)의 지문을 `fonts.css` 머리에
 * 적어 두고, 같으면 건너뛴다. 강제로 다시 만들려면 `npm run build:font -- --force`.
 *
 * 실행: `npm run build:font`
 * 결과: `public/fonts/dinggul-*.woff2` + `src/app/fonts.css`
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, extname } from 'node:path'
import subsetFont from 'subset-font'

const args = process.argv.slice(2)
/** 지문이 같아도 강제로 다시 만든다 */
const FORCE = args.includes('--force')
const SOURCE = args.find((arg) => !arg.startsWith('--')) ?? 'assets/fonts/온글잎 딩궁딩굴.ttf'
const OUT_DIR = 'public/fonts'
const CSS_PATH = 'src/app/fonts.css'
const FAMILY = 'Dinggul'
/** 조각 하나에 담을 한글 음절 수. 작을수록 조각이 많아지고 낭비가 준다 */
const CHUNK = 150

const HANGUL_START = 0xac00
const HANGUL_END = 0xd7a3

/**
 * 폰트가 실제로 가진 코드포인트를 cmap(format 4)에서 읽는다.
 *
 * 이걸 안 하면 `unicode-range`에 없는 글자(이모지 등)까지 적히고, 브라우저가
 * "이 조각에 있겠지" 하고 받아온 뒤에야 없는 걸 알게 된다. 결과는 나오지만 헛걸음이다.
 */
function readCoverage(buffer) {
    const u16 = (o) => buffer.readUInt16BE(o)
    const u32 = (o) => buffer.readUInt32BE(o)
    const tables = {}
    for (let i = 0; i < u16(4); i++) {
        const o = 12 + i * 16
        tables[buffer.toString('ascii', o, o + 4)] = u32(o + 8)
    }
    const cmap = tables.cmap
    let format4
    for (let i = 0; i < u16(cmap + 2); i++) {
        const rec = cmap + 4 + i * 8
        const offset = cmap + u32(rec + 4)
        if (u16(offset) === 4 && u16(rec) === 3) format4 = offset
    }
    const covered = new Set()
    if (!format4) return covered
    const segX2 = u16(format4 + 6)
    for (let s = 0; s < segX2 / 2; s++) {
        const end = u16(format4 + 14 + s * 2)
        const start = u16(format4 + 16 + segX2 + s * 2)
        for (let cp = start; cp <= end && cp !== 0xffff; cp++) covered.add(cp)
    }
    return covered
}

/** 앱 소스에 박혀 있는 글자를 모은다 — 이 글자들은 첫 화면에 바로 필요하다 */
function collectSourceChars(dir, acc = new Set()) {
    for (const name of readdirSync(dir)) {
        const path = join(dir, name)
        if (statSync(path).isDirectory()) {
            collectSourceChars(path, acc)
            continue
        }
        if (!['.ts', '.tsx', '.css'].includes(extname(name))) continue
        for (const ch of readFileSync(path, 'utf8')) acc.add(ch)
    }
    return acc
}

/**
 * 원본이 없으면 여기서 멈춘다.
 *
 * 원본은 git에 없다(5.86MB). 그래서 클론만 한 사람은 이 파일이 없는 게 **정상**이고,
 * 앱을 돌리는 데 필요하지도 않다 — 런타임에 쓰는 건 커밋된 `public/fonts/*.woff2`뿐이다.
 * ENOENT 스택만 뜨면 "내 환경이 깨졌나" 싶으므로 무엇이 필요한지 알려 준다.
 */
if (!existsSync(SOURCE)) {
    console.error(`원본 폰트가 없습니다: ${SOURCE}\n`)
    console.error('이 스크립트는 폰트를 **다시 자를 때만** 필요합니다.')
    console.error('앱 실행·빌드에는 필요하지 않습니다 — 잘라 둔 웹폰트가 이미 커밋돼 있습니다.\n')
    console.error('다시 자르려면 https://www.ownglyph.com 에서 받아 아래 경로에 두세요.')
    console.error(`  ${SOURCE}`)
    console.error('자세한 내용: assets/fonts/README.md')
    process.exit(1)
}

const original = readFileSync(SOURCE)
const coverage = readCoverage(original)
const sourceChars = collectSourceChars('src')

/** 0번 조각: 한글 음절이 아닌 문자 전부 + 소스에 등장하는 한글 */
const coreChars = new Set()
// 라틴·숫자·문장부호는 무조건 넣는다. 소스에 없어도 서버 데이터에 섞여 온다
for (let cp = 0x20; cp <= 0x7e; cp++) coreChars.add(String.fromCodePoint(cp))
// 한글 자모(초성 검색 UI), 한중일 문장부호, 전각
for (let cp = 0x3131; cp <= 0x318e; cp++) coreChars.add(String.fromCodePoint(cp))
for (let cp = 0x3000; cp <= 0x303f; cp++) coreChars.add(String.fromCodePoint(cp))
for (let cp = 0xff01; cp <= 0xff5e; cp++) coreChars.add(String.fromCodePoint(cp))
for (const ch of sourceChars) coreChars.add(ch)

// 폰트에 없는 글자는 뺀다. 이모지·일부 기호가 여기서 걸러진다 (Pretendard 폴백으로 넘어감)
for (const ch of [...coreChars]) {
    if (!coverage.has(ch.codePointAt(0))) coreChars.delete(ch)
}

/** 나머지 한글 음절을 코드포인트 순서로 쪼갠다 */
const restSyllables = []
for (let cp = HANGUL_START; cp <= HANGUL_END; cp++) {
    const ch = String.fromCodePoint(cp)
    if (!coreChars.has(ch)) restSyllables.push(ch)
}

const chunks = [[...coreChars].join('')]
for (let i = 0; i < restSyllables.length; i += CHUNK) {
    chunks.push(restSyllables.slice(i, i + CHUNK).join(''))
}

/** 코드포인트 목록을 `U+ac00-ac03, U+ac05` 형태로 압축 */
function toUnicodeRange(text) {
    const cps = [...new Set([...text].map((c) => c.codePointAt(0)))].sort((a, b) => a - b)
    const parts = []
    let start = cps[0]
    let prev = cps[0]
    for (const cp of cps.slice(1)) {
        if (cp === prev + 1) {
            prev = cp
            continue
        }
        parts.push(start === prev ? `U+${start.toString(16)}` : `U+${start.toString(16)}-${prev.toString(16)}`)
        start = prev = cp
    }
    parts.push(start === prev ? `U+${start.toString(16)}` : `U+${start.toString(16)}-${prev.toString(16)}`)
    return parts.join(', ')
}

/**
 * 입력 지문. 이게 같으면 결과도 같아야 하는데 woff2 인코딩이 결정적이지 않아
 * 바이트가 달라진다. 그래서 **결과를 비교하는 대신 입력을 비교**한다.
 */
const FINGERPRINT = createHash('sha256')
    .update(original)
    .update(String(CHUNK))
    .update(chunks[0]) // 0번 조각 = 소스에 등장하는 글자. 화면 문구가 늘면 이게 바뀐다
    .digest('hex')
    .slice(0, 16)

const STAMP = `/* fingerprint: ${FINGERPRINT} */`

/**
 * **`--force` 없이는 절대 다시 만들지 않는다.**
 *
 * 재빌드는 71개 바이너리를 모두 갈아 치운다. 여럿이 작업하는 동안 누군가 무심코 돌리면
 * 병합으로 풀 수 없는 충돌이 생긴다(바이너리라 diff가 없다).
 *
 * 그래서 지문이 달라도 **알리기만 하고 끝낸다.** 안 만들어도 글자는 정상으로 보인다 —
 * 한글 11,172자가 71조각에 전부 들어 있어서, 0번 조각에 없는 글자는 다른 조각에서 온다.
 * 낡아서 잃는 건 **조각 하나(약 40KB)를 더 받는 것**뿐이다.
 *
 * 다시 만들 때는 **한 사람이 · 다른 작업과 섞지 않은 별도 커밋으로** 한다.
 */
if (!FORCE) {
    const stamped = existsSync(CSS_PATH) && readFileSync(CSS_PATH, 'utf8').includes(STAMP)
    if (stamped) {
        console.log(`입력이 그대로입니다 — 할 일이 없습니다. (지문 ${FINGERPRINT}, 조각 ${chunks.length}개)`)
    } else {
        console.log('0번 조각이 낡았습니다 — 화면 문구가 늘었거나 폰트 원본이 바뀌었습니다.')
        console.log(`  새 지문 ${FINGERPRINT} · 조각 ${chunks.length}개\n`)
        console.log('**지금 다시 만들 필요는 없습니다.** 글자는 정상으로 보이고,')
        console.log('0번 조각에 없는 글자를 담은 조각(약 40KB)을 더 받을 뿐입니다.\n')
        console.log('다시 만들면 71개 바이너리가 전부 바뀌어 다른 사람과 충돌합니다.')
        console.log('여럿이 작업하는 중이면 미루고, 정리할 때 한 사람이 한 번만 돌리세요:')
        console.log('  npm run build:font -- --force')
    }
    process.exit(0)
}

rmSync(OUT_DIR, { recursive: true, force: true })
mkdirSync(OUT_DIR, { recursive: true })

const faces = []
let total = 0

for (const [index, text] of chunks.entries()) {
    const buffer = await subsetFont(original, text, { targetFormat: 'woff2' })
    const file = `dinggul-${index}.woff2`
    writeFileSync(join(OUT_DIR, file), buffer)
    total += buffer.length
    faces.push(
        [
            '@font-face {',
            `    font-family: '${FAMILY}';`,
            '    font-style: normal;',
            '    font-weight: 400;',
            // swap — 폰트를 기다리며 글자를 숨기지 않는다. 늦게 오면 폴백에서 바꿔 끼운다
            '    font-display: swap;',
            `    src: url('/fonts/${file}') format('woff2');`,
            `    unicode-range: ${toUnicodeRange(text)};`,
            '}',
        ].join('\n'),
    )
    process.stdout.write(`  ${file}  ${(buffer.length / 1024).toFixed(1)}KB\n`)
}

writeFileSync(
    CSS_PATH,
    [
        '/* 자동 생성 — 직접 고치지 않는다. `npm run build:font`로 다시 만든다 */',
        `/* 원본: ${SOURCE} */`,
        // 다음 실행 때 "다시 만들 필요가 있나"를 판단하는 근거. 지우면 매번 다시 만든다
        STAMP,
        '',
        ...faces,
        '',
    ].join('\n'),
)

console.log(`\n조각 ${chunks.length}개 · 합계 ${(total / 1024 / 1024).toFixed(2)}MB`)
console.log(`0번(첫 화면에 필요한 전부): ${(statSync(join(OUT_DIR, 'dinggul-0.woff2')).size / 1024).toFixed(1)}KB`)
console.log(`원본 TTF: ${(original.length / 1024 / 1024).toFixed(2)}MB`)
