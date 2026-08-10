import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

const COLORS = ['#F97316', '#FB923C', '#FBBF24', '#34D399', '#60A5FA', '#F472B6']

/** 해금 성공 시 한 번 터지는 컨페티. 화면 상단 중앙에서 쏟아진다. */
export function Confetti({ count = 28 }: { count?: number }) {
    const pieces = useMemo(
        () =>
            Array.from({ length: count }, (_, i) => ({
                id: i,
                x: (Math.random() - 0.5) * 320, // 좌우 퍼짐(px)
                rotate: Math.random() * 360,
                delay: Math.random() * 0.15,
                duration: 1.1 + Math.random() * 0.7,
                color: COLORS[i % COLORS.length],
                size: 7 + Math.random() * 7,
            })),
        [count],
    )

    return (
        <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
            {pieces.map((p) => (
                <motion.span
                    key={p.id}
                    initial={{ x: 0, y: -20, opacity: 1, rotate: 0 }}
                    animate={{ x: p.x, y: 420, opacity: 0, rotate: p.rotate }}
                    transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: 40,
                        width: p.size,
                        height: p.size * 0.6,
                        borderRadius: 2,
                        backgroundColor: p.color,
                    }}
                />
            ))}
        </div>
    )
}
