import type { DexEntry, FoodCategory } from '@/shared/data/dex'
import { ILLUSTRATION_FILES, ILLUSTRATION_REAL_PATH } from '@/shared/lib/illustrationManifest.generated'

/**
 * 기본도감 일러스트를 `public/illustrate`에서 찾는다. **여기가 유일한 출처다.**
 *
 * 서버도 같은 그림을 S3 presigned URL로 내려주지만 쓰지 않는다. presigned URL은 서명이
 * 10분마다 바뀌어 URL이 매번 달라지므로 브라우저 캐시가 한 번도 안 맞는다. 도감은 한 화면에
 * 수십 칸이 깔려서 그 차이가 그대로 체감된다. 전체 3.6MB · 장당 27KB라 정적 자산으로
 * 안고 가는 편이 싸다.
 *
 * 파일이 없으면 `undefined`를 돌려준다 — 화면은 이모지로 대체되고 깨진 이미지가 뜨지 않는다.
 * **도감 칸을 늘렸으면 그림을 같이 넣어야 한다.** 넣은 뒤에는 매니페스트를 다시 구울 것.
 */

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

/**
 * 도감 칸 이름과 그림 파일명이 다른 것들.
 * 왼쪽이 서버가 주는 이름(basic_dex.name), 오른쪽이 파일 쪽 이름
 */
const ILLUSTRATION_ALIASES: Record<string, { category?: FoodCategory; name: string }> = {
    라면: { name: '라멘' },
    냉면: { name: '물냉면' },
    치킨: { name: '후라이드치킨' },
    토스트: { category: '분식·길거리', name: '토스트' },
    떡: { name: '전통디저트(약과, 떡)' },
    아이스크림: { name: '아이스크림, 젤라또' },
    순대국: { category: '국·탕·찌개', name: '순대국밥' },
    새우튀김: { category: '튀김·치킨·까스', name: '튀김' },
    // 표기만 다른 것들 — 파일 쪽이 된소리·띄어쓰기가 다름
    부리토: { name: '부리또' },
    소고기구이: { name: '소고기' },
    '전통 디저트(약과·떡)': { name: '전통디저트(약과, 떡)' },
}

/** 폴더·파일명에 쉼표와 공백이 들어 있어 세그먼트별로 인코딩해야 한다 */
function toUrl(path: string) {
    return `/illustrate/${path.split('/').map(encodeURIComponent).join('/')}`
}

/**
 * 로컬 일러스트 경로. 파일이 없으면 `undefined`(이모지로 대체됨).
 *
 * 매니페스트(`illustrationManifest.generated.ts`)는 빌드 시점에 실제 파일 목록을 떠 둔 것이라
 * 여기서 이름 규칙을 추측하지 않는다. 일러스트를 추가·교체했으면
 * `npm run build:illustrations`를 다시 돌려야 반영된다.
 */
export function getLocalDexIllustrationUrl(entry: Pick<DexEntry, 'name' | 'category'>): string | undefined {
    const alias = ILLUSTRATION_ALIASES[entry.name]
    const category = alias?.category ?? entry.category
    const name = alias?.name ?? entry.name
    const folder = CATEGORY_FOLDERS[category]
    if (!folder) return undefined

    const key = `${folder}/${name}.png`.normalize('NFC')
    if (!ILLUSTRATION_FILES.has(key)) return undefined

    // 디스크 파일명이 NFD로 들어온 경우 URL은 실제 파일명으로 만들어야 한다
    return toUrl(ILLUSTRATION_REAL_PATH[key] ?? key)
}
