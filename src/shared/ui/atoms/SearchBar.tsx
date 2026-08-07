import { SearchIcon, XIcon } from 'lucide-react'

interface SearchBarProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    /** 스크린리더용 이름. 화면에 라벨이 없으므로 필수 */
    label: string
    className?: string
    onFocus?: () => void
    onBlur?: () => void
}

/**
 * 검색창. 제작 도감(태그+이름)과 AI 분석 화면(도감 검색)이 공유.
 */
export function SearchBar({ value, onChange, placeholder, label, className = '', onFocus, onBlur }: SearchBarProps) {
    return (
        <div
            className={`flex items-center gap-2 rounded-2xl border border-edge-default bg-surface-card px-3 py-3 ${className}`}
        >
            <SearchIcon size={18} aria-hidden className="shrink-0 text-content-muted" />
            <input
                type="search"
                aria-label={label}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onFocus={onFocus}
                onBlur={onBlur}
                placeholder={placeholder}
                // 브라우저 기본 지우기 버튼을 숨긴다 — 아래에서 직접 그리는 X와 두 개가 겹친다
                className="min-w-0 flex-1 bg-transparent text-sm text-content-primary outline-none placeholder:text-content-muted [&::-webkit-search-cancel-button]:appearance-none"
            />

            {value && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    aria-label="검색어 지우기"
                    className="shrink-0 text-content-muted"
                >
                    <XIcon size={16} aria-hidden />
                </button>
            )}
        </div>
    )
}
