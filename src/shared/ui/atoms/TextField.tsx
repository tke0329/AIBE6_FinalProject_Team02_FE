import React, { useId } from 'react'
import { Text } from './Text'

/**
 * 입력 한 칸의 공통 껍데기 — 라벨·힌트·에러·글자수를 항상 같은 자리에 놓는다.
 *
 * 자리를 고정하는 게 핵심이다. 화면마다 에러를 위에 달거나 아래에 달거나 했더니
 * 사용자가 어디를 봐야 할지 매번 새로 찾아야 했다. 순서는 라벨 → 입력 → (에러 | 힌트) → 카운터.
 *
 * **에러와 힌트는 동시에 띄우지 않는다.** 에러가 있으면 힌트를 덮는다 — 지금 고쳐야 할 게
 * 하나뿐일 때 읽는 사람이 헷갈리지 않는다.
 */
interface FieldShellProps {
    /** 접근 가능한 이름. 시각적으로 숨기려면 `hideLabel` */
    label: string
    hideLabel?: boolean
    /** 채워지면 테두리가 붉어지고 스크린리더에 오류로 알려진다 */
    error?: string | null
    /** 평상시 안내. 에러가 있으면 가려진다 */
    hint?: string
    /** 글자수 표시. `maxLength`와 함께 넘긴다 */
    count?: { current: number; max: number }
    children: (ids: { inputId: string; describedBy: string | undefined; invalid: boolean }) => React.ReactNode
}

function FieldShell({ label, hideLabel = false, error, hint, count, children }: FieldShellProps) {
    const inputId = useId()
    const messageId = `${inputId}-message`
    const invalid = Boolean(error)
    const message = error ?? hint

    return (
        <div>
            {hideLabel ? (
                <label htmlFor={inputId} className="sr-only">
                    {label}
                </label>
            ) : (
                <Text as="label" variant="label" tone="secondary" htmlFor={inputId} className="block pb-2">
                    {label}
                </Text>
            )}

            {children({ inputId, describedBy: message ? messageId : undefined, invalid })}

            {/* 에러가 떴다 사라질 때 아래 내용이 튀지 않게, 메시지와 카운터를 한 줄에 둔다 */}
            {(message || count) && (
                <div className="flex items-start justify-between gap-3 pt-1.5">
                    {/*
                        오류 문구에 role="alert"를 달지 않는다. 글자를 칠 때마다 끼어들어
                        읽던 내용을 끊는다. aria-describedby + aria-invalid만으로
                        그 칸에 포커스가 갈 때 읽히게 한다
                    */}
                    {message ? (
                        <Text as="p" variant="caption" tone={invalid ? 'error' : 'muted'} id={messageId}>
                            {message}
                        </Text>
                    ) : (
                        <span />
                    )}
                    {/* 자릿수가 늘어도 카운터가 흔들리지 않게 numeric (tabular-nums) */}
                    {count && (
                        <Text variant="numeric" tone="muted" aria-hidden className="shrink-0 text-xs">
                            {count.current}/{count.max}
                        </Text>
                    )}
                </div>
            )}
        </div>
    )
}

/**
 * 입력 칸 본체 스타일.
 *
 * `text-base`(16px)는 취향이 아니라 필수다 — iOS Safari는 16px 미만 입력에 포커스가 가면
 * 페이지를 자동으로 확대한다. layout.tsx에서 `maximumScale`을 뺐으므로(WCAG §1.4.4)
 * 확대를 막아 주던 안전장치가 없다. 여기서 막는다.
 */
const CONTROL =
    'w-full rounded-2xl border-2 bg-surface-card px-4 text-base text-content-primary outline-none transition-colors placeholder:text-content-muted disabled:bg-action-disabled-bg disabled:text-action-disabled-text'

const borderOf = (invalid: boolean) =>
    invalid ? 'border-feedback-error' : 'border-edge-default focus:border-edge-active'

type ShellPart = Pick<FieldShellProps, 'label' | 'hideLabel' | 'error' | 'hint' | 'count'>

type TextFieldProps = ShellPart & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'>

/** 한 줄 입력 */
export function TextField({ label, hideLabel, error, hint, count, ...rest }: TextFieldProps) {
    return (
        <FieldShell label={label} hideLabel={hideLabel} error={error} hint={hint} count={count}>
            {({ inputId, describedBy, invalid }) => (
                <input
                    id={inputId}
                    aria-invalid={invalid || undefined}
                    aria-describedby={describedBy}
                    className={`${CONTROL} h-cta ${borderOf(invalid)}`}
                    {...rest}
                />
            )}
        </FieldShell>
    )
}

type TextAreaProps = ShellPart & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className'>

/** 여러 줄 입력. 손잡이로 늘리면 레이아웃이 깨져 크기 조절은 막는다 */
export function TextArea({ label, hideLabel, error, hint, count, rows = 4, ...rest }: TextAreaProps) {
    return (
        <FieldShell label={label} hideLabel={hideLabel} error={error} hint={hint} count={count}>
            {({ inputId, describedBy, invalid }) => (
                <textarea
                    id={inputId}
                    rows={rows}
                    aria-invalid={invalid || undefined}
                    aria-describedby={describedBy}
                    className={`${CONTROL} resize-none py-3 leading-6 ${borderOf(invalid)}`}
                    {...rest}
                />
            )}
        </FieldShell>
    )
}
