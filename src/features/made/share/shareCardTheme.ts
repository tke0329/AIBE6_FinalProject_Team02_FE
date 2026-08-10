/**
 * 공유 카드의 치수·색·글꼴
 *
 * 캔버스는 CSS 변수를 읽지 못해 globals.css의 값을 복제한다.
 * 흩어 놓으면 화면과 소리 없이 어긋나므로 여기 한곳에만 둔다.
 * globals.css의 색을 바꾸면 이 파일도 같이 고칠 것
 */

/**
 * 720×1280인 이유
 * 1080×1920은 매크로블록이 프레임당 8160개라 H.264 레벨 3.1(3600) 한계를 넘는다.
 * 720×1280은 45×80=3600으로 정확히 맞아 하드웨어 인코더 호환이 가장 넓다
 */
export const CARD_WIDTH = 720
export const CARD_HEIGHT = 1280

export const PADDING = 40

/** 요약 화면의 통계 — 숫자 하나에 라벨 하나짜리 카드 3장 */
export const STAT_GAP = 12
export const STAT_HEIGHT = 104
export const STAT_RADIUS = 18

/** 칸(참여자 한 명) */
export const CELL_GAP = 12
export const CELL_RADIUS = 14
/** 한 끼니가 두 줄 이상일 때 줄 사이 */
export const ROW_GAP = 12

// --- 순차 전개 전용 치수. 한 끼니가 화면을 다 쓴다 ---

/** 날짜 + 로그잇 이름 */
export const SCENE_HEADER_HEIGHT = 170
/** 끼니 이름 밴드 */
export const SCENE_LABEL_HEIGHT = 70
/** 격자 아래 여백 */
export const SCENE_BOTTOM = 80
/**
 * 칸 아래 공간 — 선반 판(10) + 틈(2) + 닉네임(19) + 여백
 * 선반을 그리면서 28에서 늘렸다. 12명 기준 칸이 203 → 195px가 된다
 */
export const SCENE_NAME_HEIGHT = 36
/**
 * 한 끼니가 화면을 다 쓰므로 격자 버전(260)보다 크게 잡는다
 * 상한이 없으면 2명일 때 314px까지 커져 여백이 되레 어색하다
 */
export const SCENE_MAX_CELL = 300
/** 줄을 이보다 늘리지 않는다. 4행이면 12명까지 200px 안팎이 나온다 */
export const SCENE_MAX_ROWS = 4

/** 선반 판 두께. 12 + 여백 5 + 닉네임 19 = SCENE_NAME_HEIGHT */
export const SHELF_BOARD_HEIGHT = 12

// --- 민트 레트로 냉장고 ---

/** 문 바깥면 */
export const COLOR_DOOR = '#9FD4C7'
/**
 * 문 안쪽 모서리 그림자. 두께감을 만든다
 * 불투명하면 닫혔을 때 가운데에 짙은 띠가 생겨 요약 사진을 가로지른다 — 반투명으로 둔다
 */
export const COLOR_DOOR_EDGE = 'rgba(93, 150, 137, 0.55)'
/** 문의 가로 분할선 */
export const COLOR_DOOR_LINE = '#8AC6B8'
/** 손잡이 */
export const COLOR_HANDLE = '#F0EADD'
/** 냉장고 내부 바탕. 크림이 아니라 차가운 회백색 */
export const COLOR_INNER = '#E9EFEE'
/** 좌우 안쪽 벽 */
export const COLOR_INNER_WALL = '#CBD8D5'
/** 벽과 바탕 사이 그림자. 이게 없으면 벽이 그냥 색 띠로 보인다 */
export const COLOR_INNER_WALL_SHADE = 'rgba(74, 96, 90, 0.16)'
/** 선반 판 */
export const COLOR_SHELF_BOARD = '#A9BEB8'
/** 선반 판 윗면 하이라이트. 유리 선반의 두께를 드러낸다 */
export const COLOR_SHELF_EDGE = '#D8E4E1'
/** 선반 아래 그림자 */
export const COLOR_SHELF_SHADOW = 'rgba(74, 96, 90, 0.20)'
/** 문에 붙은 메모지 */
export const COLOR_MEMO = '#FBF7F0'

/**
 * 그 끼니에 담지 않은 사람의 칸. 순검정은 화면이 무거워 짙게만 깐다
 * 냉장고 내부가 차가운 회백색이라 브라운 대신 짙은 청록회색을 쓴다
 */
export const COLOR_EMPTY_CELL = '#46514E'
/** 어두운 칸 위의 글자 */
export const COLOR_EMPTY_TEXT = '#98A5A1'

export const COLOR = {
    /** cream-200 — 못 불러온 사진 자리 */
    placeholder: '#EFE3CC',
    /** white — 칸 바탕, 겹친 낱장, 통계 카드 */
    cell: '#FFFFFF',
    /** brown-900 */
    title: '#3E2D18',
    /** brown-800 */
    body: '#5C4326',
    /** brown-300 */
    muted: '#C9A87C',
    /** orange-500 */
    accent: '#D98E33',
    badgeText: '#FFFFFF',
} as const

const DISPLAY = 'Jua, Pretendard, sans-serif'
const SANS = 'Pretendard, -apple-system, system-ui, sans-serif'

/** ctx.font 문자열. 캔버스는 px 단위만 안전하다 */
export function displayFont(size: number): string {
    return `${size}px ${DISPLAY}`
}

export function sansFont(size: number, weight: 400 | 700 = 400): string {
    return `${weight} ${size}px ${SANS}`
}

/**
 * 웹폰트가 로드되기 전에 그리면 첫 프레임만 폴백 글꼴로 나온다.
 * 캔버스를 그리기 전에 반드시 기다린다
 */
export function fontsReady(): Promise<unknown> {
    // document는 있어도 fonts가 없는 웹뷰가 있다. 없으면 기다릴 것도 없다
    if (typeof document === 'undefined') return Promise.resolve()
    return document.fonts ? document.fonts.ready : Promise.resolve()
}
