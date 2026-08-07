import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** shadcn 컴포넌트가 쓰는 클래스 병합기. 뒤에 온 유틸리티가 앞을 덮는다 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
