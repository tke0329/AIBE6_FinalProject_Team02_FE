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

// --- 수박 레트로 냉장고 ---
//
// 예전에는 민트(#9FD4C7)였다. 서비스 색이 수박 핑크(--watermelon-500 #FC6C85)인데
// 냉장고만 청록이라 공유 카드가 앱과 다른 서비스처럼 보였다. 같은 계열로 옮겼다.
//
// 대비를 재서 고른 값이다. 구조가 읽히려면 인접한 면끼리 1.2:1 이상이어야 한다.
//   문/내부 1.38 · 손잡이/문 1.40 · 선반판/내부 1.52 · 선반윗면/판 1.44 · 안쪽벽/내부 1.22
//   흰 칸(사진)/내부 1.08 — 사진이 바탕에서 살짝 떠 보이는 정도로만 띄운다

/** 문 바깥면 */
export const COLOR_DOOR = '#F5C9D2'
/**
 * 문 안쪽 모서리 그림자. 두께감을 만든다
 * 불투명하면 닫혔을 때 가운데에 짙은 띠가 생겨 요약 사진을 가로지른다 — 반투명으로 둔다
 */
export const COLOR_DOOR_EDGE = 'rgba(176, 105, 120, 0.55)'
/** 문의 가로 분할선 */
export const COLOR_DOOR_LINE = '#EBB3BF'
/** 손잡이 */
export const COLOR_HANDLE = '#FFF7F0'
/** 냉장고 내부 바탕. 차가운 회백색 대신 따뜻한 크림 — 음식 사진이 맛있게 보인다 */
export const COLOR_INNER = '#FDF5F1'
/** 좌우 안쪽 벽 */
export const COLOR_INNER_WALL = '#F0DCD8'
/** 벽과 바탕 사이 그림자. 이게 없으면 벽이 그냥 색 띠로 보인다 */
export const COLOR_INNER_WALL_SHADE = 'rgba(122, 78, 82, 0.16)'
/** 선반 판 */
export const COLOR_SHELF_BOARD = '#E2C3C7'
/** 선반 판 윗면 하이라이트. 유리 선반의 두께를 드러낸다 */
export const COLOR_SHELF_EDGE = '#FBEEEF'
/** 선반 아래 그림자 */
export const COLOR_SHELF_SHADOW = 'rgba(122, 78, 82, 0.20)'
/** 문에 붙은 메모지 */
export const COLOR_MEMO = '#FFFBF4'

/**
 * 그 끼니에 담지 않은 사람의 칸. 순검정은 화면이 무거워 짙게만 깐다
 * 크림 바탕과 어울리는 짙은 회갈색 (바탕과 7.67:1로 확실히 구분된다)
 */
export const COLOR_EMPTY_CELL = '#5C4A4E'
/**
 * 어두운 칸 위의 글자. **빈 칸 문구가 여기 올라간다.**
 *
 * 값을 두 번 밝혔다 — 이모지 한 글자일 때는 대비가 덜 중요했지만 이제 읽어야 하는 글이다.
 *   #C4B2B6 (4.08, AA 미달) → #D2C1C5 (4.78, AA) → **#F0E8EA (6.85, AAA에 근접)**
 *
 * 순백(#FFFFFF, 8.25)까지 가지 않은 이유 — 냉장고 내부가 따뜻한 크림색이라
 * 순백 글자만 차갑게 튄다. 크림 쪽으로 살짝 기운 흰색이 같은 화면에 속해 보인다
 */
export const COLOR_EMPTY_TEXT = '#F0E8EA'

export const COLOR = {
    /** neutral-100 — 못 불러온 사진 자리 */
    placeholder: '#F1F1F2',
    /** white — 칸 바탕, 겹친 낱장, 통계 카드 */
    cell: '#FFFFFF',
    /** neutral-900 */
    title: '#1A1A1A',
    /** neutral-800 */
    body: '#2A2A2A',
    /**
     * neutral-400. 예전 값(#B5B5BA)이 남아 있었다 — 토큰을 4.53:1로 어둡게 고칠 때
     * 이 사본을 같이 못 고쳐서 공유 카드만 옛 회색으로 그려지고 있었다
     */
    muted: '#767679',
    /** watermelon-500 */
    accent: '#FC6C85',
    /**
     * 수박색 면 위의 글자. **흰색이 아니다** — 흰 글자는 2.75:1로 AA에 한참 못 미친다.
     * --text-on-action(neutral-900)과 같은 값으로 6.32:1을 낸다 (§1.2.1)
     */
    badgeText: '#1A1A1A',
} as const

/**
 * 앱 글꼴과 같아야 한다. 예전 값(`Jua` / `Pretendard`)이 그대로 남아 있어서,
 * 딩궁딩굴로 통일한 뒤에도 **공유 카드만 시스템 기본 글꼴로 그려지고 있었다.**
 * 둘 다 이제 로드되지 않는 이름이다 (globals.css의 body와 같은 목록으로 맞춤)
 */
const DISPLAY = "'Dinggul', 'Pretendard', sans-serif"
const SANS = "'Dinggul', 'Pretendard', -apple-system, system-ui, sans-serif"

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
