// 프론트 단위 테스트 러너 설정 (Next 공식 next/jest 사용).
// next/jest 가 TypeScript(SWC 변환)·tsconfig 경로별칭(@/*)·환경을 자동 처리한다.
//
// 사용 전 준비:
//   1) npm i -D jest @types/jest
//   2) package.json scripts 에 "test": "jest" 추가
//   3) npm test
const nextJest = require('next/jest')

const createJestConfig = nextJest({ dir: './' })

/** @type {import('jest').Config} */
const config = {
    testEnvironment: 'node', // fetch만 목킹하므로 DOM 불필요(jsdom 안 씀)
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1', // @/ → src/ (tsconfig paths 보강)
    },
}

module.exports = createJestConfig(config)
