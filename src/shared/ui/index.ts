/**
 * 공통 UI 한 곳. 화면에서는 여기서만 가져온다.
 *
 * ```ts
 * import { AppScreen, Button, PageHeader, useToast } from '@/shared/ui'
 * ```
 *
 * 개별 경로로 직접 들어가지 않는 이유는 **어떤 것이 공통인지 한눈에 보이게** 하기 위해서다.
 * 이 목록에 없으면 아직 공통이 아니라는 뜻이고, 화면에서 손으로 조립하기 전에
 * 여기에 추가할지를 먼저 따져 보게 된다.
 */

/* --- 원자 --- */
export { Avatar } from './atoms/Avatar'
export { Badge } from './atoms/Badge'
export { Button } from './atoms/Button'
export { Chip } from './atoms/Chip'
export { EquippedBadge } from './atoms/EquippedBadge'
export type { BadgeId } from './atoms/EquippedBadge'
export { HelpIcon } from './atoms/HelpIcon'
export { ProgressBar } from './atoms/ProgressBar'
export { SearchBar } from './atoms/SearchBar'
export { ServerBadge } from './atoms/ServerBadge'
export { Skeleton } from './atoms/Skeleton'
export { StarRank } from './atoms/StarRank'
export { Text } from './atoms/Text'
export type { TextVariant } from './atoms/Text'
export { TextArea, TextField } from './atoms/TextField'

/* --- 분자 --- */
export { AppScreen, PageHeader, ScreenBody, ScreenFooter } from './molecules/AppScreen'
export { BottomNav } from './molecules/BottomNav'
export type { NavTab } from './molecules/BottomNav'
export { BottomSheet } from './molecules/BottomSheet'
export { Calendar } from './molecules/Calendar'
export { Card } from './molecules/Card'
export { Dialog } from './molecules/Dialog'
export { DexHelpSheet } from './molecules/DexHelpSheet'
export { EmptyState } from './molecules/EmptyState'
export { FoodCard } from './molecules/FoodCard'
/* 사진을 끌어 옮기고 확대해 정사각으로 자르는 창.
   프로필·챌린짓 대표·로그잇 표지·커스텀 뱃지가 전부 이걸 쓴다 — 자르는 규칙이
   화면마다 달라지면 사용자가 매번 다시 배워야 한다 */
export { ImageCropper } from './molecules/ImageCropper'
export type { ImageCropperHandle } from './molecules/ImageCropper'
export { LoadingView } from './molecules/LoadingView'
export { TabBar } from './molecules/TabBar'
export type { TabItem } from './molecules/TabBar'
/* 여러 단계로 만드는 화면(로그잇 개설·챌린짓 개설)이 같은 머리글을 쓴다.
   단계 전환 상수는 배럴이 아니라 shared/lib/wizardMotion 에 있다 — 이유는 그 파일에 적었다 */
export { WizardHeader } from './molecules/WizardHeader'
export type { LoadingSceneName } from './molecules/loadingScenes'

/* --- 피드백 --- */
export { ToastProvider, useToast } from './feedback/ToastProvider'

/* --- 훅 --- */
export { useFocusTrap } from './hooks/useFocusTrap'
