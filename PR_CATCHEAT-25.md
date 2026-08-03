## 📌 관련 이슈

Jira: CATCHEAT-25 (EPIC B — 챌린지 도감)

## ✨ 작업 내용

챌린지 도감 프론트를 BE(CATCHEAT-25)에 연결했습니다. **개설 · 탐색 · 상세보기 · 슬롯 인증(해금)**을 실제 API로 붙이고, 개설 시 등록한 **목표 음식 사진**이 상세 도감에서 흑백으로 보이다가 인증하면 컬러로 바뀌도록 구현했습니다.

- **개설** — 목표 음식마다 이름 + 사진 등록, S3 업로드 후 개설
- **탐색** — 진행중 목록 + 참여자 순 정렬/단상
- **상세보기** — 목표 도감(흑백/컬러), 진행률, 참여/인증 버튼
- **슬롯 인증(해금)** — 사진 촬영/선택 → S3 업로드 → 해금 → 진행도 갱신
- **가독성 정리** — 한 줄로 길게 짜였던 챌린지/로그인 화면 코드를 정리

## 커밋

| 커밋 | 내용 |
|---|---|
| `8dafac5` feat | 챌린지 api 클라이언트 추가 |
| `c0259da` feat | 상세보기 · 개설 UI 작성 및 수정 |
| `60e04b8` feat | 기본 이미지 추가 및 기능 구현 |
| `3a7dd5f` chore | 코드 정리 |

## 화면 · 연결

| 경로 | 화면 | 연결 API |
|---|---|---|
| `/challenge` | 챌린지 탐색/목록 | `GET /challenges`, `GET /creation-tickets` |
| `/challenge/new` | 챌린지 개설 | `POST /uploads/presigned` → S3, `POST /challenges` |
| `/challenge/[id]` | 챌린지 상세 | `GET /challenges/{id}`, `POST /{id}/participants`, `POST /{id}/unlocks` |

## 주요 구현

**1. 개설 — 목표 음식마다 이름 + 사진**
개설 화면에서 목표 음식을 추가할 때 이름과 사진을 함께 등록합니다. 개설 시 각 사진을 `uploadImageToS3`로 올려 얻은 key를 `slots[].imageKey`로 전송합니다. 사진을 안 고르면 기본 이미지(`/images/default_food.png`)로 대체됩니다.

**2. 목표 도감 흑백 → 컬러**
상세의 목표 도감은 개설자가 등록한 사진(`slot.imageUrl`)을 보여주는데, 미해금 슬롯은 `FoodCard`가 자동으로 `grayscale`(흑백)로, 인증(해금)하면 컬러로 표시합니다. 잠긴 칸도 음식 **이름은 그대로** 노출합니다.

**3. 슬롯 인증(해금) 플로우**
참여한 챌린지에서 잠긴 슬롯을 누르면 사진 선택 → `uploadImageToS3` → `unlockSlot(id, slotId, key)` → 상세 재조회로 진행도가 갱신됩니다.

**4. 개설 버튼 — 최소 5개 검증(alert 제거)**
목표 음식이 5개 미만이면 개설 버튼을 비활성화하고(`목표 음식 3/5`), 버튼 위에 "몇 개 더 필요"를 안내합니다. alert 방식은 제거했습니다.

**5. 가독성 정리**
한 줄로 길게 뭉쳐 있던 `ChallengeCreate` · `ChallengeDetail` · `ChallengeCountHome` · `BadgeCustom` · `LoginPage`를 Prettier(printWidth 100)로 여러 줄로 정리했습니다. 로직 변경 없이 형식만 바뀌었습니다.

## 🖼️ 에셋

- `public/images/default_food.png` — 사진 미등록 슬롯의 기본 이미지.

## 🔍 리뷰 포인트

- 만료되는 S3 프리사인 URL이라 `next/image` 대신 `<img>`로 표시합니다(흑백은 `grayscale` 클래스).
- 유형(수집형)·기한(상시)은 아직 UI가 없어 개설 시 기본값으로 보냅니다(`COLLECTION`/`PERMANENT`).
- "내 챌린지" 탭의 개설/참여 목록은 별도 BE 엔드포인트가 필요해 후속 작업으로 남겨뒀습니다.
