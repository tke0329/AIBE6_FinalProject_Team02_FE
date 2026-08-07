## 📌 관련 이슈

Jira: CATCHEAT-50 (EPIC B — 챌린지 도감 개편)

## ✨ 작업 내용

챌린지를 **위치 인증·수집형 전용**으로 정리하고, 개설 화면을 **토스식 5단계 애니메이션 위저드**로 다시 만들었습니다.

- **인증 방식·유형 제거** — verifyType/challengeType 제거(항상 위치·수집형), 태그 `수집형` 고정, 해금 시 항상 현재 위치 취득
- **목표 음식 확장** — 가게명·설명 필드 추가
- **개설 위저드** — 한 화면에 한 단계씩, framer-motion 전환, 오렌지/화이트

## 커밋

| 커밋 | 내용 |
|---|---|
| `52b6bc7` feat | 사진 인증 제거, 선착순 제거 |
| `c464413` feat | 개설 UI 수정 |
| `a7711d5` feat | 개설 UI 플로우 수정(위저드) |

## 주요 변경

**1. verifyType/challengeType 제거**
- `api.ts`: `ChallengeType`·`VerifyType` 타입, payload·summary·detail의 두 필드 제거
- `types.ts`: `ChallengeData.verifyType` 제거
- `page.tsx`·`[id]/page`: 태그 `수집형` 고정, `verifyType` 매핑 제거
- `ChallengeDetail`: 해금 시 항상 위치 취득
- `AppStateProvider`: `challengeDraft.verifyType` 제거

**2. 목표 음식 가게명·설명**
- `api.ts` `CreateSlotInput`·`ChallengeSlotDetail`, `types.ts` `ChallengeTarget`에 `storeName`·`description`
- `new/page` slots payload에 전송

**3. 개설 5단계 위저드 (`ChallengeCreate` 전면 재작성)**
- 단계: **제목 → 기한 → 음식 추가 → 보상 뱃지 → 완료**
- 상단 진행 바(스프링), 좌우 슬라이드 전환(`AnimatePresence`), 기간 한정 시 종료일 슬라이드, 음식 추가 리스트 팝 인, 완료 체크 스프링
- 음식 단계: 가게명·음식명·주소(검색/지오코딩)·사진·설명 → "이 음식 추가", 5개 이상이면 "다음" 활성(상한 없음)
- 커스텀 뱃지 편집 후 돌아오면 뱃지 단계로 복귀(개설 입력값은 draft로 유지)
- `new/page` onCreate: 성공 후 navigate/reset 제거 → 위저드가 완료 화면 표시, "확인"에서 초기화·목록 이동

## 🖥️ 화면 흐름

`/challenge/new` — 제목 → 기한 → 음식 추가(반복) → 보상 뱃지 → 완료

## 🔍 리뷰 포인트

- 위치 인증만 남아 개설 시 목표마다 좌표가 필수예요(검색 결과 선택 또는 주소 지오코딩).
- 애니메이션은 `framer-motion`(이미 의존성 있음) 사용. 전환 속도/문구는 조정 가능.
