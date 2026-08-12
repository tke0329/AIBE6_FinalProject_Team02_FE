# AIBE6 FinalProject Team02 — Frontend

캣칫(CatchEat) 음식 도감 서비스 프론트엔드

## 스택

| 분류          | 사용                                       | 버전     |
| ------------- | ------------------------------------------ | -------- |
| 프레임워크    | Next.js (App Router)                       | 15.5.21  |
| 런타임 / UI   | React · React DOM                          | 18.3.1   |
| 언어          | TypeScript (`strict: true`)                | 5.9.3    |
| 스타일        | Tailwind CSS + PostCSS + Autoprefixer      | 3.4.17   |
| 디자인 토큰   | CSS 변수 (`globals.css`) → Tailwind theme  | —        |
| 애니메이션    | framer-motion                              | 11.18.2  |
| 아이콘        | lucide-react                               | 0.522.0  |
| 폰트          | 온글잎 딩궁딩굴 — 자체 호스팅 (단일 서체)  | —        |
| 상태          | React Context + hooks (`AppStateProvider`) | 무의존성 |
| 린트          | ESLint + eslint-config-next                | 8.57.1   |
| 패키지 매니저 | npm                                        | Node 24  |

### 의도적으로 쓰지 않은 것

| 항목                                | 이유                                                                                               |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| Redux / Zustand / Jotai             | 화면 간 공유 상태가 한 덩어리라 Context로 충분. 규모가 커지면 교체 지점은 `AppStateProvider` 한 곳 |
| TanStack Query / SWR                | 아직 서버 통신이 없음. API 연동 시 도입 지점은 features의 훅                                       |
| MUI / shadcn 등 컴포넌트 라이브러리 | DESIGN.md의 토큰·variant 규칙을 그대로 강제하려고 자체 atoms/molecules로 구성                      |
| CSS-in-JS                           | Tailwind 토큰 단일 경로 유지                                                                       |

### 아직 없는 것 (연동 시 추가 필요)

API 클라이언트 · 인증 · 폼 검증(react-hook-form + zod 등) · 테스트(Vitest/Playwright) · 상태 영속화

## 실행

```bash
npm install
npm run dev
```

http://localhost:3000

```bash
npm run build   # 프로덕션 빌드
npm run lint    # ESLint
```

## 구조

화면마다 실제 URL을 가지는 App Router 구조.
`src/app/**/page.tsx`는 **컨테이너**(라우팅·상태 연결)만 담당하고, 실제 UI는
`src/features/**`의 **프레젠테이셔널 컴포넌트**가 그린다 (DESIGN.md §3.1).

```
src/
  app/                              # 라우트 = 페이지별 디렉터리
    layout.tsx                      # 루트 레이아웃 + AppStateProvider + 앱 셸
    globals.css                     # 디자인 토큰(§1) + 전역 베이스 + 웹폰트
    page.tsx                        # /                          기본 도감
    onboarding/page.tsx             # /onboarding
    dex/[id]/page.tsx               # /dex/16                    카드 상세
    made/page.tsx                   # /made                      제작 도감 목록
    made/join/page.tsx              # /made/join                 초대 코드 참여
    made/[dexId]/page.tsx           # /made/date                 제작 도감 홈
    made/[dexId]/participants/      # /made/date/participants    참여자 관리
    challenge/page.tsx              # /challenge
    challenge/new/page.tsx          # /challenge/new             개설
    challenge/new/badge/page.tsx    # /challenge/new/badge       보상 뱃지 만들기
    challenge/[id]/page.tsx         # /challenge/ramen           상세
    my/page.tsx                     # /my
    my/profile · badges · photo/    # /my/profile, /my/badges, /my/photo
    register/page.tsx               # /register          1단계 사진
    register/analyze/page.tsx       # /register/analyze  2단계 AI 분석
    register/record/page.tsx        # /register/record   3단계 기록
    register/tags/page.tsx          # /register/tags     4단계 태그(제작 도감 전용)
    register/unlock/page.tsx        # /register/unlock   완료 연출

  shared/                           # 2개 이상 feature가 쓰는 것만
    lib/routes.ts                   # 모든 URL을 만드는 유일한 곳
    store/AppStateProvider.tsx      # 라우트를 건너 공유되는 상태
    data/dex.ts                     # 도감 카탈로그 (dex + register 공유)
    ui/atoms/                       # Badge, HelpIcon, ProgressBar, SearchBar, StarRank, EquippedBadge
    ui/molecules/                   # BottomNav, BottomSheet, FoodCard, TabBar, DexHelpSheet

  features/                         # 기능별 컴포넌트 · 훅 · 타입을 함께
    dex/                            # DexGrid, DexDetail, CommentSheet, useDexFilter
    made/                           # MadeDexList/Home/Invite, useMadeDexSearch, types
    challenge/                      # ChallengeCountHome/Create/Detail, BadgeCustom, types, data
    register/                       # Upload → Analyze → Record → Tags, UnlockReveal, useRegistrationExit
    my/                             # MyPage, UserProfile, BadgeCollection, ProfilePhotoChange
    onboarding/                     # Onboarding
public/
  badge-spring.png
  badge-autumn.png
```

### 규칙

- **URL 문자열을 직접 쓰지 말 것.** 항상 `ROUTES` (`shared/lib/routes.ts`)를 통해 만든다.
  탭 이동은 `TAB_HREF`를 쓴다.
- **features의 컴포넌트는 라우터를 모른다.** `useRouter`는 `page.tsx`에만 있고,
  화면 컴포넌트는 `onBack` / `onNext` 같은 콜백 props만 받는다. 덕분에 화면 단위 테스트가 쉽고
  라우트 구조를 바꿔도 화면 코드는 손댈 필요가 없다.
- **라우트를 건너 공유되는 상태는 `useAppState()`** 로만 접근한다. 목업 단계라 메모리에만 있고
  새로고침하면 초기화된다. API 연동 시 `AppStateProvider`의 액션 본문만 교체하면 화면은 그대로다.
- `@/` 절대 경로로 feature 바깥을 참조하고, 같은 feature 안에서만 상대 경로를 쓴다.
- 잘못된 `[id]` / `[dexId]`는 `notFound()`로 404를 낸다.

### 공유 컴포넌트 (§3.2)

아래 UI가 필요하면 **새로 만들지 말고 variant를 추가**할 것.

| 컴포넌트      | 위치      | variant                                   |
| ------------- | --------- | ----------------------------------------- |
| `FoodCard`    | molecules | `unlocked` / `locked` / `recent`          |
| `ProgressBar` | atoms     | 기본 — 제작 도감에서는 **사용 금지** (§6) |
| `Badge`       | atoms     | `dday` / `type` / `member` / `reward`     |
| `TabBar`      | molecules | `segmented` / `pill` / `scroll`           |
| `SearchBar`   | atoms     | 단일                                      |
| `BottomSheet` | molecules | `draggable` 옵션                          |
| `HelpIcon`    | atoms     | 단일                                      |

`BottomSheet`는 포커스 트랩·Escape 닫기·트리거로 포커스 복귀를 내장(§5). 시트를 새로 만들 때
직접 오버레이를 짜지 말고 이걸 감쌀 것.

## 디자인 시스템

`DESIGN.md`가 단일 진실 공급원. 색상·간격·폰트·라운드 값을 **하드코딩하지 말 것**.

- 토큰은 `src/app/globals.css`의 `:root`에 Primitive → Semantic 2계층으로 정의
- Tailwind alpha modifier(`bg-white/70`) 지원을 위해 hex 대신 **rgb 채널 triplet**으로 저장.
  원본 hex는 각 줄 주석에 있음
- `tailwind.config.ts`가 이 변수들을 색상으로 노출. 신규 코드는 Semantic 클래스 사용:
  `bg-surface-card`, `text-content-primary`, `bg-action-primary`, `border-edge-default` 등
- `cream-*` / `brown-*` / `orange-*` 는 Primitive 직접 노출(레거시 호환). 신규 코드에서는 지양
- 새 색이 필요하면 Primitive 추가 → Semantic 노출 → 사용 순서를 지킬 것

### 레이아웃

앱 셸(`.app-shell`)이 뷰포트 전체를 채움. 데스크톱에서 모바일 폭으로 가두려면
`globals.css`의 `--layout-max` 한 줄만 바꾸면 됨 (예: `480px`).

카드 그리드는 **3열 고정**. `tailwind.config.ts`의 `screens`를 비워 두어 뷰포트
브레이크포인트(`sm:` `md:` …)는 **클래스를 써도 CSS가 생성되지 않음**. 넓은 화면에서는
좌우 여백만 늘어남.

## PWA — 홈 화면 설치

브라우저 접속은 그대로이고, 그 위에 **설치 가능한 층**만 얹혀 있음. 설치 안 한 사용자는
지금과 완전히 같음.

| 파일                  | 역할                                         |
| --------------------- | -------------------------------------------- |
| `src/app/manifest.ts` | 앱 이름·아이콘·`display: standalone`         |
| `public/sw.js`        | 서비스워커 — **캐시하지 않음** (아래 참고)   |
| `src/shared/pwa/`     | 워커 등록 (프로덕션에서만)                   |
| `public/icon/`        | 아이콘 + 생성 방법 (`public/icon/README.md`) |

### 설치형에서는 주소창이 없음 — 화면 코드에 영향 있음

`display: standalone`이라 **브라우저 뒤로가기와 새로고침이 사라짐.** 화면을 새로 만들거나
고칠 때 두 가지를 지켜야 함.

- **`history.back()` / `router.back()`을 쓰지 않는다.** 알림·공유 링크로 첫 진입이 될 수
  있는 화면에서는 돌아갈 기록이 없어 **아무 일도 일어나지 않음.** `ROUTES`의 목적지를
  직접 준다.
    - 남아 있는 곳: `/challenge` · `/users/[id]` · `/my/nickname` (직접 진입 가능 — 우선) ·
      `/challenge/[id]` · `/made/[dexId]/records/new` · `.../records/[recordId]/edit` · `/ui-check`
    - **그 화면을 손대는 사람이 함께 정리**하는 방식으로 진행 중
- **에러 표시에는 재시도 동작을 반드시 붙인다.** 새로고침으로 탈출할 수 없음.
  `EmptyState tone="error"`의 `action`을 비우지 말 것.

### 서비스워커는 지금 아무것도 캐시하지 않음

설치 가능 요건만 채우는 패스스루임. 캐싱을 켜면 개발 중 "고쳤는데 안 바뀐다"가 생기고,
낡은 워커가 낡은 HTML을 붙잡으면 **배포 후 흰 화면**이 됨. 캐싱은 "새 버전 있어요" 갱신
안내와 한 묶음으로 마무리 단계에 넣는다. `/sw.js`는 `next.config.mjs`에서 `no-cache`로
못박아 둠 — CDN이 물면 새 워커가 영원히 안 내려온다.

`viewportFit: 'cover'`(노치까지 쓰는 전체화면)도 아직 안 켬. 켜려면 오버레이 3종의
안전 영역을 같이 손봐야 해서 실기기 확인과 묶어 진행.

## 참고

Magic Patterns(Vite) 프로토타입을 Next.js로 이식한 뒤 App Router 라우트로 분리한 코드임.
화면 UI는 프로토타입 그대로이고, 디자인 토큰·접근성·구조만 DESIGN.md에 맞춰 다시 짬.

`npm run dev` 실행 중에 `npm run build`를 돌리면 `.next`가 덮어써져 dev 서버의
CSS가 404가 됨. 빌드는 dev 서버를 끄고 돌릴 것.
