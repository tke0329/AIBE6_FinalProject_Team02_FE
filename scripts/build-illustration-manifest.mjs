/**
 * 기본도감 일러스트 매니페스트 생성 — `public/illustrate`에 **실제로 있는** 파일 목록을
 * `src/shared/lib/illustrationManifest.generated.ts`로 굽는다.
 *
 *   node scripts/build-illustration-manifest.mjs
 *
 * 왜 필요한가
 *
 *   일러스트를 S3 대신 `public/`에서 서빙하려면 "이 칸의 그림이 로컬에 있는가"를
 *   런타임에 알아야 한다. 브라우저는 파일 존재를 미리 못 보고, 없는 파일을 가리키면
 *   404를 물고 그림이 사라진다. 그래서 **빌드 시점에 목록을 떠 둔다.**
 *   목록에 있으면 로컬 경로, 없으면 서버(S3) URL로 떨어진다.
 *
 *   이름 규칙을 추측하지 않고 실제 파일명을 그대로 담기 때문에, 맥에서 넘어온 자모 분해
 *   (NFD) 파일명이 섞여도 조회가 깨지지 않는다. 조회 키는 NFC로 정규화해 맞춘다.
 *
 * 일러스트를 추가·교체·삭제한 뒤에는 다시 돌려야 한다.
 */
import { readdirSync, statSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'public/illustrate'
const OUT = 'src/shared/lib/illustrationManifest.generated.ts'

/** `폴더/파일.png` → 실제 디스크 파일명 그대로. 키만 NFC로 맞춘다 */
const entries = []
for (const dir of readdirSync(ROOT).sort()) {
    const dirPath = join(ROOT, dir)
    if (!statSync(dirPath).isDirectory()) continue
    for (const file of readdirSync(dirPath).sort()) {
        if (!file.toLowerCase().endsWith('.png')) continue
        // 키는 NFC(코드가 만드는 이름), 값은 실제 파일명(디스크에 있는 그대로)
        entries.push([`${dir}/${file}`.normalize('NFC'), `${dir}/${file}`])
    }
}

const sameCount = entries.filter(([k, v]) => k === v).length
const body = entries
    .map(([key, real]) =>
        key === real
            ? `    ${JSON.stringify(key)},`
            : `    ${JSON.stringify(key)}, // 디스크: ${real.normalize('NFC')} (정규화 다름)`,
    )
    .join('\n')

/**
 * 키와 실제 파일명이 다른 경우(NFD 잔재)는 URL을 따로 실어야 한다.
 * 지금은 전부 같지만, 맥에서 파일이 들어오면 갈라진다.
 */
const diverged = entries.filter(([k, v]) => k !== v)
const divergedBody = diverged.map(([key, real]) => `    ${JSON.stringify(key)}: ${JSON.stringify(real)},`).join('\n')

const out = `/**
 * 자동 생성 — 직접 고치지 말 것.
 * \`node scripts/build-illustration-manifest.mjs\`로 다시 만든다.
 *
 * \`public/illustrate\`에 실제로 있는 일러스트 목록. 여기 없는 칸은 서버(S3) URL로 떨어진다.
 * 생성 시각의 파일 ${entries.length}개.
 */

/** \`폴더/파일.png\` (NFC 정규화) */
export const ILLUSTRATION_FILES: ReadonlySet<string> = new Set([
${body}
])

/**
 * 조회 키(NFC)와 디스크 실제 파일명이 다른 것들. URL은 실제 파일명으로 만들어야 한다.
 * 맥에서 넘어온 자모 분해(NFD) 파일명이 여기 잡힌다. 비어 있으면 전부 NFC라는 뜻.
 */
export const ILLUSTRATION_REAL_PATH: Readonly<Record<string, string>> = {
${divergedBody}
}
`

// 내용이 같으면 파일을 건드리지 않는다 — 불필요한 git diff·HMR 재시작 방지
if (existsSync(OUT) && readFileSync(OUT, 'utf8') === out) {
    console.log(`변경 없음 — ${OUT} (${entries.length}개)`)
} else {
    writeFileSync(OUT, out, 'utf8')
    console.log(`생성 ${OUT} — 파일 ${entries.length}개 · 정규화 일치 ${sameCount} · 불일치 ${diverged.length}`)
}
