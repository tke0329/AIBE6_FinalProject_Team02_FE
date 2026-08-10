import { AuthProvider } from '@/features/auth/AuthContext'
import { AuthGate } from '@/features/auth/AuthGate'
import { AppStateProvider } from '@/shared/store/AppStateProvider'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: '먹킷리스트 도감',
    description: '먹은 음식을 도감으로 모으는 기록 서비스',
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="ko">
            <body className="h-full">
                <AuthProvider>
                    <AppStateProvider>
                        <AuthGate>
                            <div className="app-shell">{children}</div>
                        </AuthGate>
                    </AppStateProvider>
                </AuthProvider>
            </body>
        </html>
    )
}
