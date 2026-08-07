import { RegisterFlowProvider } from '@/features/register/RegisterFlowContext'
import React from 'react'

/**
 * 등록 플로우(/register/*) 전용 레이아웃.
 */
export default function RegisterLayout({ children }: { children: React.ReactNode }) {
    return <RegisterFlowProvider>{children}</RegisterFlowProvider>
}
