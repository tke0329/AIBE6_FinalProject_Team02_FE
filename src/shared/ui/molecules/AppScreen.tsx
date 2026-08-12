import React from 'react'
import { ArrowLeftIcon } from 'lucide-react'

interface PageHeaderProps {
    /** 화면 이름. 생략하면 가운데가 비고 `children`이 그 자리를 쓴다 (진행 바 등) */
    title?: string
    /** 뒤로가기. 없으면 화살표를 그리지 않는다 — 탭 최상단 화면이 그렇다 */
    onBack?: () => void
    /** 오른쪽 끝에 붙는 것 (설정 아이콘, "선택" 표시 등) */
    trailing?: React.ReactNode
    /** 제목 자리에 넣을 것. 진행 바처럼 글자가 아닌 경우 */
    children?: React.ReactNode
}

/**
 * 화면 맨 위 줄. 뒤로가기 + 제목 + 오른쪽 동작.
 *
 * 화면마다 손으로 짜던 것을 모았다. 그때는 아이콘이 21px/22px로 갈리고
 * `min-h-touch`가 빠진 곳이 절반이라 **뒤로가기가 화면마다 다른 크기로 눌렸다.**
 * 여기서 한 번만 정한다.
 */
export function PageHeader({ title, onBack, trailing, children }: PageHeaderProps) {
    return (
        <header className="flex shrink-0 items-center gap-3 px-5 py-4">
            {onBack && (
                <button type="button" onClick={onBack} aria-label="뒤로가기" className="min-h-touch shrink-0">
                    <ArrowLeftIcon size={22} aria-hidden className="text-content-primary" />
                </button>
            )}

            {/* 제목이 길면 줄바꿈 대신 잘라 낸다 — 머리글이 두 줄이 되면 아래 내용이 밀린다 */}
            {title && <h1 className="min-w-0 flex-1 truncate font-display text-lg text-content-primary">{title}</h1>}
            {children}

            {trailing && <div className="ml-auto flex shrink-0 items-center gap-1">{trailing}</div>}
        </header>
    )
}

/**
 * 스크롤되는 본문.
 *
 * `min-h-0`이 빠지면 안 된다 — flex 자식의 기본 `min-height`는 `auto`라
 * 내용이 길어지면 스크롤되지 않고 부모를 밀어 늘린다.
 */
export function ScreenBody({ className = '', children }: { className?: string; children: React.ReactNode }) {
    return <main className={`no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 ${className}`}>{children}</main>
}

/**
 * 아래에 붙어 있는 주 동작 자리.
 *
 * 홈 인디케이터(아이폰 아래 막대)에 가리지 않도록 안전 영역을 더한다.
 * 안전 영역이 없는 기기에서는 24px만 남는다.
 */
export function ScreenFooter({ className = '', children }: { className?: string; children: React.ReactNode }) {
    return (
        <div className={`shrink-0 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 ${className}`}>
            {children}
        </div>
    )
}

interface AppScreenProps {
    /** 보통 `<PageHeader />` */
    header?: React.ReactNode
    /** 아래 고정 동작. 보통 `<Button fullWidth />` 하나 */
    footer?: React.ReactNode
    /**
     * 본문을 `ScreenBody`로 감쌀지. 기본 true.
     *
     * 도감 그리드처럼 **안쪽에서 따로 스크롤을 관리하는 화면**은 false로 두고
     * 직접 짠다. 이중 스크롤이 되면 안쪽이 끝난 뒤 바깥이 이어 움직여서
     * 손가락을 뗐다 다시 밀어야 한다.
     */
    scroll?: boolean
    className?: string
    children: React.ReactNode
}

/**
 * 화면 한 장의 바깥 틀.
 *
 * `h-full`이 핵심이다 — 셸(`.app-shell-content`)이 준 높이를 그대로 받아
 * 머리글·본문·바닥을 세로로 나눈다. 이게 없으면 본문이 화면을 넘겨 셸 밖으로 흐른다.
 *
 * ```tsx
 * <AppScreen
 *     header={<PageHeader title="닉네임 수정" onBack={onBack} />}
 *     footer={<Button fullWidth onClick={save}>저장</Button>}
 * >
 *     <TextField label="닉네임" … />
 * </AppScreen>
 * ```
 */
export function AppScreen({ header, footer, scroll = true, className = '', children }: AppScreenProps) {
    return (
        // relative — 이 화면 위에 뜨는 시트·확인 창이 화면 안에 갇히도록
        <div className={`relative flex h-full flex-col bg-surface-app ${className}`}>
            {header}
            {scroll ? <ScreenBody>{children}</ScreenBody> : children}
            {footer && <ScreenFooter>{footer}</ScreenFooter>}
        </div>
    )
}
