'use client'

import { useEffect } from 'react'

/**
 * `public/sw.js`를 등록한다. 그리는 것은 없다 — layout에 한 번 놓기만 하면 된다.
 *
 * **개발에서는 등록하지 않는다.** 지금 워커는 캐시를 안 하니 붙여도 해가 없지만,
 * 한번 등록된 워커는 브랜치를 옮겨도 브라우저에 남는다. 여러 사람이 같은
 * localhost를 쓰는 동안 "내 화면만 이상하다"의 원인 후보를 하나라도 줄이는 쪽이
 * 낫다. 로컬에서 확인하려면 `npm run build && npm run start`로 켜면 된다.
 */
export function ServiceWorkerRegister() {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production') return
        if (!('serviceWorker' in navigator)) return

        // load 이후로 미룬다 — 첫 화면에 필요한 폰트·이미지와 대역폭을 다투지 않게
        const register = () => {
            navigator.serviceWorker.register('/sw.js').catch((error) => {
                // 삼키지 않는다. 설치 배너가 안 뜨는 원인이 대개 여기임
                console.warn('[pwa] 서비스워커 등록 실패', error)
            })
        }

        if (document.readyState === 'complete') {
            register()
            return
        }
        window.addEventListener('load', register, { once: true })
        return () => window.removeEventListener('load', register)
    }, [])

    return null
}
