import React, { useMemo, useState } from 'react'
import { ArrowLeftIcon, HashIcon, PlusIcon, XIcon } from 'lucide-react'

interface Props {
    foodName: string
    foodEmoji: string
    onBack: () => void
    onNext: (tags: string[]) => void
}
const SUGGESTIONS = ['데이트', '혼밥', '기념일', '회식', '점심', '저녁', '재방문', '맛집']

export function RegisterTags({ foodName, foodEmoji, onBack, onNext }: Props) {
    const [draft, setDraft] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const suggestions = useMemo(
        () => SUGGESTIONS.filter((tag) => !tags.includes(tag) && tag.includes(draft.replace('#', ''))),
        [draft, tags],
    )
    const addTag = (value: string) => {
        const tag = value.trim().replace(/^#/, '')
        if (!tag || tags.includes(tag) || tags.length >= 8) return
        setTags((current) => [...current, tag])
        setDraft('')
    }
    return (
        <div className="flex h-full flex-col bg-cream-100">
            <header className="flex items-center gap-3 px-5 py-4">
                <button onClick={onBack} aria-label="뒤로가기">
                    <ArrowLeftIcon size={22} />
                </button>
                <span className="font-display text-lg text-brown">태그 추가</span>
                <span className="ml-auto text-xs text-brown-muted">선택</span>
            </header>
            <main className="no-scrollbar flex-1 overflow-y-auto px-5">
                <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-3xl">
                        {foodEmoji}
                    </span>
                    <span>
                        <strong className="block text-brown">{foodName}</strong>
                        <small className="text-brown-muted">기록을 설명하는 태그를 남겨 보세요</small>
                    </span>
                </div>
                <section className="mt-6">
                    <label className="mb-2 block text-sm font-bold text-brown">태그</label>
                    <div className="flex items-center gap-2 rounded-2xl border border-cream-300 bg-white px-3 py-2.5 focus-within:border-orange-400">
                        <HashIcon size={18} className="text-orange-500" />
                        <input
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault()
                                    addTag(draft)
                                }
                            }}
                            placeholder="예: 데이트, 혼밥, 기념일"
                            className="min-w-0 flex-1 text-sm outline-none"
                        />
                        <button onClick={() => addTag(draft)} aria-label="태그 추가" className="text-orange-600">
                            <PlusIcon size={18} />
                        </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <button
                                key={tag}
                                onClick={() => setTags((current) => current.filter((item) => item !== tag))}
                                className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1.5 text-xs font-bold text-orange-600"
                            >
                                #{tag}
                                <XIcon size={13} />
                            </button>
                        ))}
                    </div>
                </section>
                <section className="mt-6">
                    <p className="text-sm font-bold text-brown">추천 태그</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {suggestions.map((tag) => (
                            <button
                                key={tag}
                                onClick={() => addTag(tag)}
                                className="rounded-full border border-cream-300 bg-white px-3 py-1.5 text-xs text-brown-soft"
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                </section>
            </main>
            <div className="px-5 pb-8 pt-4">
                <button
                    onClick={() => onNext(tags)}
                    className="w-full rounded-2xl bg-orange-500 py-4 font-display text-lg text-white shadow-card"
                >
                    등록 완료
                </button>
            </div>
        </div>
    )
}
