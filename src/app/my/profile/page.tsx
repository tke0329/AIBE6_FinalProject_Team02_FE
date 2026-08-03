'use client';

import { useRouter } from 'next/navigation';
import { UserProfile } from '@/features/my/UserProfile';
import { getTabHref, ROUTES } from '@/shared/lib/routes';

/** `/my/profile` 다른 유저 프로필 */
export default function UserProfilePage() {
  const router = useRouter();

  return (
    <UserProfile
      onBack={() => router.push(ROUTES.my)}
      onTab={(tab) => router.push(getTabHref(tab))} />);

}
