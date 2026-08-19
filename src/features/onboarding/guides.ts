import type { TourStep } from '@/shared/ui'

/**
 * 도메인별 코치마크 온보딩.
 *
 * 키는 BE `OnboardingService.GUIDE_KEYS`와 **글자까지 같아야 한다** — 화이트리스트라
 * 어긋나면 400이 나고 "본 것"으로 저장되지 않아 투어가 매번 다시 뜬다.
 *
 * 로그잇·베이짓이 2개씩인 이유: 관문 화면과 실제 사용 화면이 갈린다.
 * `/made`는 신규 유저에게 빈 목록이고 끼니·기록·냉장고는 도감 안에 있다.
 * `/basicDex`도 첫 착지는 카테고리 목록이고 실루엣 카드·검색·필터는 그리드에 있다.
 */
export type GuideKey =
    'logit-list' | 'logit-home' | 'basit-category' | 'basit-grid' | 'challengit' | 'challengit-detail'

export const GUIDES: Record<GuideKey, { label: string; steps: TourStep[] }> = {
    'logit-list': {
        label: '로그잇 사용법',
        steps: [
            {
                title: '로그잇',
                body: '함께 먹은 하루를 모아 두는 도감이에요. 사진 한 장이면 한 칸이 채워져요.',
            },
            {
                anchor: 'logit-create',
                title: '새로 만들기',
                body: '도감을 열고 초대 코드로 친구를 부를 수 있어요. 최대 12명까지 모여요.',
            },
            {
                anchor: 'logit-join',
                title: '초대 코드',
                body: '받은 코드가 있다면 여기로 참여해요.',
            },
            {
                // 신규 유저에겐 카드가 없어 자동으로 건너뛴다
                anchor: 'logit-card',
                title: '내 로그잇',
                body: '눌러서 오늘의 식탁으로 들어가요.',
            },
        ],
    },

    'logit-home': {
        label: '오늘의 식탁 사용법',
        steps: [
            {
                anchor: 'logit-date',
                title: '날짜',
                body: '넘기면 그날의 식탁을 볼 수 있어요. 기록은 오늘만 남길 수 있어요.',
            },
            {
                anchor: 'logit-slot',
                title: '끼니',
                body: '끼니마다 기록 카드가 쌓여요. `+ 기록하기`로 사진과 메모를 남겨 보세요.',
            },
            {
                anchor: 'logit-edit',
                title: '구성 편집',
                body: '끼니 이름과 순서를 바꾸거나 새 끼니를 더할 수 있어요.',
            },
            {
                anchor: 'logit-daycard',
                title: '냉장고 만들기',
                body: '하루치 기록을 영상으로 만들어 밖으로 공유해요.',
            },
        ],
    },

    'basit-category': {
        label: '베이짓 사용법',
        steps: [
            {
                anchor: 'basit-progress',
                title: '수집률',
                body: '한식 200칸 중 몇 칸을 열었는지 보여줘요.',
            },
            {
                anchor: 'basit-category-row',
                title: '카테고리',
                body: '골라서 원하는 음식만 모아 볼 수 있어요.',
            },
            {
                anchor: 'basit-register',
                title: '등록하기',
                body: '먹은 음식 사진을 올리면 AI가 어떤 음식인지 찾아 칸을 열어 줘요.',
            },
        ],
    },

    'basit-grid': {
        label: '음식 도감 사용법',
        steps: [
            {
                anchor: 'basit-card',
                title: '음식 칸',
                body: '회색 칸은 아직 안 연 음식이에요. 누르면 바로 등록하러 갈 수 있어요.',
            },
            {
                anchor: 'basit-search',
                title: '검색',
                body: '찾는 음식이 있으면 이름으로 바로 찾아요.',
            },
            {
                anchor: 'basit-filter',
                title: '해금 상태',
                body: '안 연 음식만 모아 보면 오늘 뭘 먹을지 고르기 쉬워요.',
            },
        ],
    },

    challengit: {
        label: '챌린짓 사용법',
        steps: [
            {
                title: '챌린짓',
                body: '다른 사람과 같은 목표를 채우는 시즌 도감이에요.',
            },
            {
                anchor: 'challengit-tabs',
                title: '내 챌린짓 · 탐색',
                body: '참여 중인 것과 새로 열린 것을 나눠서 봐요.',
            },
            {
                anchor: 'challengit-create',
                title: '개설',
                body: '한 달에 3번까지 열 수 있어요. 완주자에게 줄 보상 뱃지를 직접 그려요.',
            },
            {
                // 탐색 탭에서만 있다 — 내 챌린짓 탭이면 자동으로 건너뛴다
                anchor: 'challengit-search',
                title: '검색',
                body: '이름으로 챌린짓을 찾아요.',
            },
        ],
    },

    /**
     * 챌린짓 상세.
     *
     * 이 화면은 상태에 따라 요소가 크게 달라진다 — 진행률은 참여 중일 때만, 보상 뱃지는
     * 걸려 있을 때만, 목표 격자는 목표가 있을 때만 그려진다.
     * **앵커가 없으면 그 단계가 자동으로 빠지므로** 단계를 상태별로 쪼개지 않는다
     */
    'challengit-detail': {
        label: '챌린짓 상세 사용법',
        steps: [
            {
                anchor: 'challengit-detail-progress',
                title: '내 진행',
                body: '목표를 몇 개 인증했는지 보여줘요. 전부 채우면 완주예요.',
            },
            {
                anchor: 'challengit-detail-badge',
                title: '완주 보상 뱃지',
                body: '완주하면 받는 뱃지예요. 눌러서 크게 볼 수 있고, 마이에서 장착해요.',
            },
            {
                anchor: 'challengit-detail-tabs',
                title: '해금 목록 · 리뷰',
                body: '목표를 보거나, 완주한 사람들의 리뷰를 읽을 수 있어요.',
            },
            {
                anchor: 'challengit-detail-target',
                title: '목표 음식',
                body: '회색 칸은 아직 인증 안 한 목표예요. 누르면 사진으로 인증할 수 있어요.',
            },
            {
                anchor: 'challengit-detail-cta',
                title: '참여하기',
                body: '아래에서 참여하고, 참여한 뒤에는 목표 음식을 눌러 하나씩 인증해요.',
            },
        ],
    },
}
