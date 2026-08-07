import type { DexEntry, FoodCategory } from '@/shared/data/dex'

const CATEGORY_FOLDERS: Record<FoodCategory, string> = {
    '밥·죽·한 그릇': '밥,죽, 한그릇',
    면: '면',
    '국·탕·찌개': '국-탕-찌개',
    '고기 구이·볶음': '고기 구이 및 볶음',
    '튀김·치킨·까스': '튀김, 치킨, 까스',
    '해산물·회': '해산물',
    '분식·길거리': '분식, 길거리',
    '빵·버거·피자·브런치': '빵, 버거, 피자, 브런치',
    '디저트·음료': '디저트',
}

const ILLUSTRATION_ALIASES: Record<string, { category?: FoodCategory; name: string }> = {
    라면: { name: '라멘' },
    냉면: { name: '물냉면' },
    치킨: { name: '후라이드치킨' },
    토스트: { category: '분식·길거리', name: '토스트' },
    떡: { name: '전통디저트(약과, 떡)' },
    아이스크림: { name: '아이스크림, 젤라또' },
    순대국: { category: '국·탕·찌개', name: '순대국밥' },
    새우튀김: { category: '튀김·치킨·까스', name: '튀김' },
}

function encodePathSegment(value: string) {
    return encodeURIComponent(value.normalize('NFD'))
}

export function getLocalDexIllustrationUrl(entry: Pick<DexEntry, 'name' | 'category'>) {
    const alias = ILLUSTRATION_ALIASES[entry.name]
    const category = alias?.category ?? entry.category
    const name = alias?.name ?? entry.name
    const folder = CATEGORY_FOLDERS[category]

    return `/illustrate/${encodePathSegment(folder)}/${encodePathSegment(name)}.png`
}
