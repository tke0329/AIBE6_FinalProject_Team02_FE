/**
 * 여러 단계로 만드는 화면(로그잇 개설·챌린짓 개설)의 단계 전환.
 *
 * ## 왜 `shared/ui` 배럴이 아니라 여기 있나
 *
 * `next.config.mjs`의 `optimizePackageImports: ['@/shared/ui']`가 배럴을 실제 파일
 * import로 바꿔 주는데, **컴포넌트가 아닌 값**을 그 배럴로 내보내면 최적화기가
 * 찾지 못하는 일이 있었다. 실제로 이렇게 났다.
 *
 *   Attempted import error: 'wizardStepVariants' is not exported from
 *   '__barrel_optimize__?names=…!=!@/shared/ui'
 *
 * 같은 배럴의 `Button`·`Text`는 정상이었고 새로 넣은 값 3개만 실패했다. 그래서
 * **배럴에는 컴포넌트(`WizardHeader`)만 남기고 상수는 이 파일로 옮겼다.**
 * `shared/lib`은 최적화 대상이 아니라 이런 문제가 생기지 않는다.
 *
 * 두 화면이 이 값을 함께 써야 전환이 같은 속도·같은 거리로 움직인다.
 */

/** `custom`에 방향을 넘긴다 — 1이면 다음 단계, -1이면 이전 단계 */
export const wizardStepVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
}

export const WIZARD_STEP_TRANSITION = { type: 'spring', stiffness: 320, damping: 32 } as const
