#!/usr/bin/env node
/**
 * Watermelon 리네임 코드모드
 * ---------------------------------------------------------------------------
 * 구 primitive 색상 클래스(orange/cream/brown/blue/green)를 새 이름
 * (watermelon/neutral/lime)으로 일괄 치환한다. 시맨틱 토큰(surface/content/
 * action/edge/feedback)과 red(에러)는 건드리지 않는다.
 *
 * 사용법 (FE 프로젝트 루트에서):
 *   node watermelon-rename.mjs           # src/ 치환
 *   node watermelon-rename.mjs --dry     # 미리보기 (파일 수정 안 함)
 *   node watermelon-rename.mjs src other # 대상 디렉터리 지정
 *
 * 실행 후 `git diff`로 리뷰하고, `npm run build && npm run lint` 통과를 확인한 뒤
 * 커밋한다. 확인되면 tailwind.config.ts의 @deprecated 별칭 블록을 삭제해도 된다.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const DRY = process.argv.includes('--dry')
const roots = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const TARGETS = roots.length ? roots : ['src']
const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mdx'])

/** 치환 규칙 — 순서 중요(구체적인 것 먼저). 모두 앞에 '-'가 붙은 유틸리티 토큰만 노린다. */
const RULES = [
    // brown(별칭·단계) → neutral  — bare -brown 보다 먼저
    [/-brown-soft\b/g, '-neutral-800'],
    [/-brown-muted\b/g, '-neutral-400'],
    [/-brown-900\b/g, '-neutral-900'],
    [/-brown-800\b/g, '-neutral-800'],
    [/-brown-700\b/g, '-neutral-700'],
    [/-brown-600\b/g, '-neutral-600'],
    [/-brown-500\b/g, '-neutral-500'],
    [/-brown-400\b/g, '-neutral-300'],
    [/-brown-300\b/g, '-neutral-400'],
    [/-brown\b/g, '-neutral-900'], // DEFAULT

    // orange → watermelon (동일 단계) — 단계 먼저, 그다음 DEFAULT
    [/-orange-(50|100|200|300|400|500|600|700|800|900)\b/g, '-watermelon-$1'],
    [/-orange\b/g, '-watermelon'],

    // cream → neutral / white
    [/-cream-100\b/g, '-neutral-50'],
    [/-cream-200\b/g, '-neutral-100'],
    [/-cream-300\b/g, '-neutral-200'],
    [/-cream-50\b/g, '-white'],
    [/-cream\b/g, '-white'],

    // blue(New/최근 강조) → lime accent
    [/-blue-50\b/g, '-lime-soft'],
    [/\b(bg|border)-blue-(300|400|500|600)\b/g, '$1-lime-text'], // 채운 칩: 흰 글자 대비 위해 진한 라임
    [/\btext-blue-(300|400|500|600)\b/g, 'text-lime-text'],
    [/-blue-(300|400|500|600)\b/g, '-lime-500'], // 나머지(ring 등)

    // green(성공) → lime-text
    [/-green-(500|600)\b/g, '-lime-text'],
]

let filesChanged = 0
let filesScanned = 0
const perColor = {}

function walk(dir) {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name)
        const st = statSync(p)
        if (st.isDirectory()) {
            if (name === 'node_modules' || name === '.next' || name === '.git') continue
            walk(p)
        } else if (EXT.has(extname(name))) {
            processFile(p)
        }
    }
}

function processFile(p) {
    filesScanned++
    const orig = readFileSync(p, 'utf8')
    let out = orig
    for (const [re, rep] of RULES) {
        out = out.replace(re, (m, ...g) => {
            const key = /brown/.test(re.source)
                ? 'brown→neutral'
                : /orange/.test(re.source)
                  ? 'orange→watermelon'
                  : /cream/.test(re.source)
                    ? 'cream→neutral/white'
                    : /blue/.test(re.source)
                      ? 'blue→lime'
                      : 'green→lime'
            perColor[key] = (perColor[key] || 0) + 1
            return rep.replace(/\$(\d)/g, (_, i) => g[i - 1] ?? '')
        })
    }
    if (out !== orig) {
        filesChanged++
        if (!DRY) writeFileSync(p, out)
        console.log(`${DRY ? '[dry] ' : ''}✎ ${p}`)
    }
}

for (const t of TARGETS) {
    try {
        walk(t)
    } catch (e) {
        console.error(`대상 없음/오류: ${t} — ${e.message}`)
    }
}

console.log('\n── 요약 ──')
console.log(`스캔 ${filesScanned}개 / 변경 ${filesChanged}개 파일`)
for (const [k, v] of Object.entries(perColor)) console.log(`  ${k}: ${v}건`)
if (DRY) console.log('(--dry: 실제 파일은 변경되지 않음)')
