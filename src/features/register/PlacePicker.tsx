'use client'

import { MapPinIcon, PencilIcon, SearchIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { LocationInput } from './confirmApi'
import { PlaceSummary, displayAddress, searchPlaces } from './placeApi'
import { useNearbyCoords } from './useNearbyCoords'

const DEBOUNCE_MS = 300

/** catcheat.place.min-query-length와 맞춘다 — 미만이면 서버도 빈 결과를 준다 */
const MIN_QUERY = 2

const LISTBOX_ID = 'place-listbox'
const optionId = (index: number) => `place-option-${index}`

interface Props {
    value: LocationInput | null
    onChange: (value: LocationInput | null) => void
}

/**
 * 식당 검색·선택. 지도는 그리지 않고 고른 상호명만 남기며 좌표는 뒤에서 따라붙는다.
 *
 * 검색이 실패하거나 후보에 없어도 적은 이름 그대로 저장할 수 있어야 한다.
 */
export function PlacePicker({ value, onChange }: Props) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<PlaceSummary[]>([])
    const [searching, setSearching] = useState(false)
    const [failed, setFailed] = useState(false)
    const [active, setActive] = useState(-1)

    // 늦게 도착한 이전 요청이 최신 결과를 덮어쓰지 않게 한다
    const latest = useRef(0)

    const nearbyCoords = useNearbyCoords()
    const [nearby, setNearby] = useState(false)
    // 좌표가 실제로 손에 있을 때만 켜진 것으로 친다 (권한 요청 중·거부는 꺼진 상태)
    const nearbyOn = nearby && Boolean(nearbyCoords.coords)
    const coords = nearbyOn ? (nearbyCoords.coords ?? undefined) : undefined

    const keyword = query.trim()
    const canDirect = keyword.length > 0
    const total = results.length + (canDirect ? 1 : 0)
    const open = !value && total > 0

    useEffect(() => {
        if (keyword.length < MIN_QUERY) {
            setResults([])
            setSearching(false)
            setFailed(false)
            return
        }

        setSearching(true)
        const seq = ++latest.current
        const timer = setTimeout(() => {
            searchPlaces(keyword, coords)
                .then((found) => {
                    if (seq !== latest.current) return
                    setResults(found)
                    setFailed(false)
                })
                .catch(() => {
                    if (seq !== latest.current) return
                    // 검색이 실패해도 직접 입력으로 넘어갈 수 있어야 한다
                    setResults([])
                    setFailed(true)
                })
                .finally(() => {
                    if (seq === latest.current) setSearching(false)
                })
        }, DEBOUNCE_MS)

        // coords가 바뀌면(=토글하면) 같은 검색어로 다시 조회한다
        return () => clearTimeout(timer)
    }, [keyword, coords])

    useEffect(() => setActive(-1), [results, keyword])

    const pick = (location: LocationInput) => {
        onChange(location)
        setQuery('')
        setResults([])
        setActive(-1)
    }

    const select = (index: number) => {
        const place = results[index]
        if (place) {
            pick({ name: place.name, lat: place.lat, lng: place.lng })
            return
        }
        // 마지막 줄은 "직접 입력" — 좌표 없이 이름만 남긴다
        pick({ name: keyword, lat: null, lng: null })
    }

    const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open) return
        if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActive((current) => (current + 1) % total)
        } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActive((current) => (current <= 0 ? total - 1 : current - 1))
        } else if (event.key === 'Enter') {
            event.preventDefault()
            select(active < 0 ? 0 : active)
        } else if (event.key === 'Escape') {
            setResults([])
            setActive(-1)
        }
    }

    const toggleNearby = () => {
        if (nearbyCoords.coords) {
            setNearby((current) => !current)
            return
        }
        // 좌표가 도착하면 바로 켜지도록 의사를 먼저 세워 둔다. 거부되면 nearbyOn이 false로 남는다
        setNearby(true)
        nearbyCoords.request()
    }

    // 고른 뒤에는 상호명만 남는다
    if (value) {
        return (
            <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-edge-active bg-surface-card px-4 py-3">
                <MapPinIcon size={18} aria-hidden className="shrink-0 text-content-link" />
                <span className="min-w-0 flex-1 truncate text-sm text-content-primary">{value.name}</span>
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    className="shrink-0 text-xs text-content-secondary"
                >
                    지우기
                </button>
            </div>
        )
    }

    return (
        <div className="mt-1.5">
            <div className="flex items-center gap-2 rounded-2xl border border-edge-default bg-surface-card px-4 py-3 focus-within:border-edge-active">
                <SearchIcon size={18} aria-hidden className="shrink-0 text-content-muted" />
                <input
                    id="location"
                    aria-label="수집 위치 — 식당 검색"
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={LISTBOX_ID}
                    aria-autocomplete="list"
                    aria-activedescendant={active >= 0 ? optionId(active) : undefined}
                    autoComplete="off"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="식당 이름을 검색해 주세요"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => setQuery('')}
                        className="shrink-0 text-xs text-content-secondary"
                    >
                        지우기
                    </button>
                )}
            </div>

            {nearbyCoords.supported && (
                <div className="mt-1.5 flex items-center gap-2 px-1">
                    <button
                        type="button"
                        onClick={toggleNearby}
                        disabled={nearbyCoords.status === 'asking' || nearbyCoords.status === 'denied'}
                        aria-label={nearbyCoords.status === 'unavailable' ? '내 주변 — 다시 시도' : undefined}
                        aria-pressed={nearbyOn}
                        className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs disabled:opacity-40 ${
                            nearbyOn
                                ? 'border-edge-active bg-watermelon-50 text-content-link'
                                : 'border-edge-default text-content-secondary'
                        }`}
                    >
                        <MapPinIcon size={12} aria-hidden />내 주변
                    </button>
                    <span aria-live="polite" className="min-w-0 flex-1 text-xs text-content-secondary">
                        {nearbyCoords.status === 'asking' && '위치 확인 중…'}
                        {nearbyCoords.status === 'denied' && '위치 권한이 막혀 있어 전국에서 찾고 있어요'}
                        {nearbyCoords.status === 'unavailable' && '위치를 못 찾았어요. 다시 눌러 보세요!'}
                        {nearbyOn && '내 주변에서 가까운 곳부터 보여 줘요'}
                    </span>
                </div>
            )}

            {searching && <p className="mt-1.5 px-1 text-xs text-content-secondary">찾는 중…</p>}

            {failed && !searching && (
                <p className="mt-1.5 px-1 text-xs text-content-secondary">
                    검색이 안 되고 있어요. 적은 이름 그대로 저장할 수 있어요.
                </p>
            )}

            {open && (
                <>
                    <ul
                        id={LISTBOX_ID}
                        role="listbox"
                        aria-label="식당 검색 결과"
                        className="mt-1.5 overflow-hidden rounded-2xl border border-edge-default bg-surface-card"
                    >
                        {/* option 안에는 포커스 가능한 요소를 두지 않는다 — 포커스는 입력창에 남고
                지금 가리키는 항목은 aria-activedescendant로 알린다 */}
                        {results.map((place, index) => (
                            <li
                                key={place.placeId}
                                id={optionId(index)}
                                role="option"
                                aria-selected={active === index}
                                onClick={() => select(index)}
                                onMouseEnter={() => setActive(index)}
                                className={`flex cursor-pointer flex-col items-start gap-0.5 px-4 py-2.5 ${
                                    active === index ? 'bg-surface-accent' : ''
                                }`}
                            >
                                <span className="text-sm text-content-primary">{place.name}</span>
                                <span className="text-xs text-content-secondary">
                                    {[place.category, displayAddress(place)].filter(Boolean).join(' · ')}
                                </span>
                            </li>
                        ))}

                        {canDirect && (
                            <li
                                id={optionId(results.length)}
                                role="option"
                                aria-selected={active === results.length}
                                onClick={() => select(results.length)}
                                onMouseEnter={() => setActive(results.length)}
                                className={`flex cursor-pointer items-center gap-2 border-t border-edge-default px-4 py-2.5 ${
                                    active === results.length ? 'bg-surface-accent' : ''
                                }`}
                            >
                                <PencilIcon size={14} aria-hidden className="shrink-0 text-content-muted" />
                                <span className="min-w-0 flex-1 truncate text-sm text-content-secondary">
                                    “{keyword}” 직접 입력
                                </span>
                            </li>
                        )}
                    </ul>

                    {results.length > 0 && (
                        <p className="mt-1 px-1 text-right text-xs text-content-muted">장소 정보 © Kakao</p>
                    )}
                </>
            )}
        </div>
    )
}
