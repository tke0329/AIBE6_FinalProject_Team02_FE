import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MAX_PHOTOS, putToS3, requestUploadTargets, validatePhotoFile } from '@/shared/lib/upload'
import { createRecord, fetchFeed, fetchRecord, fetchSlots, setDayCardCover, updateRecord } from './logitApi'
import { isPastDate, isSlotTaken, madeErrorMessage } from './errors'
import { RECORD_MAX_PHOTOS, timeLabel } from './logitTypes'
import { hasFailure, newPhotoId, newPhotosOf, readyCount, updatePayloadOf } from './recordPhotos'
import type { LogitFeed, LogitSlot } from './logitTypes'
import type { RecordPhoto } from './recordPhotos'
import type { MadeDexId } from './types'

interface Options {
    madeDexId: MadeDexId
    /** 수정이면 기록 id. 신규면 null */
    recordId: number | null
    /** 하단 CTA로 들어오면 비어 있고, 슬롯 카드로 들어오면 정해져 있다 */
    initialSlotId: number | null
    initialDate: string
}

export function useRecordForm({ madeDexId, recordId, initialSlotId, initialDate }: Options) {
    const [slots, setSlots] = useState<LogitSlot[]>([])
    const [slotId, setSlotId] = useState<number | null>(initialSlotId)
    const [loggedOn, setLoggedOn] = useState(initialDate)
    /** 서버가 준 기준일. 이게 정해지기 전에는 지난 기록인지 판단하지 않는다 */
    const [today, setToday] = useState('')
    /** 그날 내가 이미 채운 끼니. 하루에 한 끼니는 한 번이다 */
    const [taken, setTaken] = useState<number[]>([])
    const [photos, setPhotos] = useState<RecordPhoto[]>([])
    // `HH:mm`. 비어 있으면 시각을 남기지 않는다
    const [loggedTime, setLoggedTime] = useState('')

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    /**
     * 사진 목록의 최신값. 두 가지를 위해 상태와 함께 들고 있다.
     * - 언마운트 정리에서 blob URL을 훑어야 하는데 그때는 setState가 실행되지 않는다
     * - 업로드 시작 같은 부수효과를 state updater 밖으로 빼야 한다 (StrictMode에서 두 번 실행된다)
     */
    const photosRef = useRef<RecordPhoto[]>([])

    const applyPhotos = useCallback((update: (current: RecordPhoto[]) => RecordPhoto[]) => {
        const next = update(photosRef.current)
        photosRef.current = next
        setPhotos(next)
    }, [])

    // 숨긴 슬롯에는 새로 쓸 수 없다. 고를 수 있는 것만 보여 준다
    const selectable = useMemo(() => slots.filter((slot) => !slot.hidden), [slots])

    /**
     * 지난 기록은 사진에 붙인 글만 고칠 수 있다. 사진 구성·끼니·시각은 잠긴다.
     * 기준일을 받기 전에는 false로 둔다 — 잠깐 잠겼다 풀리면 화면이 튄다.
     */
    const past = recordId !== null && today !== '' && loggedOn !== today

    useEffect(() => {
        let live = true
        setLoading(true)

        const load = async () => {
            const [allSlots, record, feed] = await Promise.all([
                fetchSlots(madeDexId),
                recordId === null ? Promise.resolve(null) : fetchRecord(madeDexId, recordId),
                fetchFeed(madeDexId, initialDate || undefined),
            ])
            if (!live) return

            setSlots(allSlots)
            setToday(feed.today)
            setTaken(takenSlotIds(feed, recordId))
            if (record) {
                setSlotId(record.slotId)
                setLoggedOn(record.loggedOn)
                setLoggedTime(record.loggedAt ? timeLabel(record.loggedAt) : '')
                applyPhotos(() =>
                    record.photos.map((photo) => ({
                        id: newPhotoId(),
                        kind: 'kept' as const,
                        photoId: photo.photoId,
                        url: photo.url,
                        caption: photo.caption ?? '',
                        cropX: photo.cropX,
                        cropY: photo.cropY,
                    })),
                )
            }
        }

        load()
            .catch((failure) => {
                if (live) setError(madeErrorMessage(failure, '기록을 불러오지 못했어요.'))
            })
            .finally(() => {
                if (live) setLoading(false)
            })

        return () => {
            live = false
        }
    }, [madeDexId, recordId, initialDate, applyPhotos])

    // 미리보기 blob URL은 두면 페이지를 떠나도 메모리에 남는다
    useEffect(() => {
        return () => {
            photosRef.current.forEach((photo) => {
                if (photo.kind === 'new') URL.revokeObjectURL(photo.previewUrl)
            })
        }
    }, [])

    const upload = useCallback(
        async (items: Array<{ id: string; file: File }>) => {
            try {
                const targets = await requestUploadTargets(
                    items.map((item) => item.file),
                    'logit-record',
                )
                await Promise.all(
                    items.map(async (item, index) => {
                        const target = targets[index]
                        try {
                            await putToS3(item.file, item.file.type, target)
                            applyPhotos((current) =>
                                current.map((photo) =>
                                    photo.id === item.id && photo.kind === 'new'
                                        ? { ...photo, status: 'done', key: target.key }
                                        : photo,
                                ),
                            )
                        } catch {
                            applyPhotos((current) =>
                                current.map((photo) =>
                                    photo.id === item.id && photo.kind === 'new'
                                        ? { ...photo, status: 'failed' }
                                        : photo,
                                ),
                            )
                        }
                    }),
                )
            } catch (failure) {
                // presign 자체가 실패하면 이 묶음 전부가 실패다
                const ids = new Set(items.map((item) => item.id))
                applyPhotos((current) =>
                    current.map((photo) =>
                        ids.has(photo.id) && photo.kind === 'new' ? { ...photo, status: 'failed' } : photo,
                    ),
                )
                setError(madeErrorMessage(failure, '사진을 올리지 못했어요.'))
            }
        },
        [applyPhotos],
    )

    const addFiles = useCallback(
        (files: File[]) => {
            setError(null)

            const invalid = files.map(validatePhotoFile).find(Boolean)
            if (invalid) {
                setError(invalid)
                return
            }

            // 한 번에 보낼 수 있는 장수도 서버가 막으므로 둘 중 작은 쪽을 따른다
            const room = Math.min(RECORD_MAX_PHOTOS, MAX_PHOTOS['logit-record']) - photosRef.current.length
            if (room <= 0) return

            const accepted: RecordPhoto[] = files.slice(0, room).map((file) => ({
                id: newPhotoId(),
                kind: 'new',
                status: 'uploading',
                file,
                previewUrl: URL.createObjectURL(file),
                caption: '',
                cropX: 50,
                cropY: 50,
            }))

            applyPhotos((current) => [...current, ...accepted])
            void upload(accepted.flatMap((photo) => (photo.kind === 'new' ? [{ id: photo.id, file: photo.file }] : [])))
        },
        [applyPhotos, upload],
    )

    const writeCaption = (id: string, caption: string) => {
        applyPhotos((current) => current.map((photo) => (photo.id === id ? { ...photo, caption } : photo)))
    }

    const writeCrop = (id: string, cropX: number, cropY: number) => {
        applyPhotos((current) => current.map((photo) => (photo.id === id ? { ...photo, cropX, cropY } : photo)))
    }

    const removePhoto = (id: string) => {
        const target = photosRef.current.find((photo) => photo.id === id)
        if (target?.kind === 'new') URL.revokeObjectURL(target.previewUrl)
        applyPhotos((current) => current.filter((photo) => photo.id !== id))
    }

    /** 맨 앞 사진이 대표다 — 고른 것을 앞으로 옮긴다 */
    const makeCover = (id: string) => {
        applyPhotos((current) => {
            const target = current.find((photo) => photo.id === id)
            if (!target) return current
            return [target, ...current.filter((photo) => photo.id !== id)]
        })
    }

    const movePhoto = (fromIndex: number, toIndex: number) => {
        applyPhotos((current) => {
            if (fromIndex === toIndex) return current
            // 드래그 도중 실패한 사진이 빠지면 잡아 둔 인덱스가 어긋난다.
            // 범위 밖이면 splice가 빈 배열을 돌려주고 undefined가 목록에 꽂힌다
            const inRange = (index: number) => index >= 0 && index < current.length
            if (!inRange(fromIndex) || !inRange(toIndex)) return current

            const next = [...current]
            const [moved] = next.splice(fromIndex, 1)
            next.splice(toIndex, 0, moved)
            return next
        })
    }

    const retryPhoto = (id: string) => {
        const target = photosRef.current.find((photo) => photo.id === id)
        if (target?.kind !== 'new') return

        applyPhotos((current) =>
            current.map((photo) =>
                photo.id === id && photo.kind === 'new' ? { ...photo, status: 'uploading' } : photo,
            ),
        )
        void upload([{ id, file: target.file }])
    }

    const failed = hasFailure(photos)

    /**
     * 수정 API는 사진을 `기존 전부 → 새로 올린 것 전부` 순으로 다시 붙인다.
     * 그래서 새로 올린 사진을 대표로 골라도 기존 사진 뒤로 밀린다.
     * 저장 뒤 그 자리(=기존 장수 번째)의 사진을 다시 앞으로 옮겨야 하므로, 그 index를 알려 준다.
     * 옮길 필요가 없으면 null.
     */
    const coverFixIndex = (): number | null => {
        // 올리지 못한 사진은 payload에서 빠지므로 자리 계산에서도 뺀다
        const sent = photos.filter((photo) => photo.kind === 'kept' || Boolean(photo.key))
        const cover = sent[0]
        if (!cover || cover.kind === 'kept') return null

        const keptCount = sent.filter((photo) => photo.kind === 'kept').length
        return keptCount === 0 ? null : keptCount
    }

    /** 저장은 이미 끝났다. 대표를 못 옮겨도 기록을 실패로 돌리지 않는다 */
    const fixCover = async (savedId: number) => {
        const index = coverFixIndex()
        if (index === null) return
        try {
            const saved = await fetchRecord(madeDexId, savedId)
            const cover = saved.photos[index]
            if (cover) await setDayCardCover(madeDexId, savedId, cover.photoId)
        } catch {
            return
        }
    }

    const submit = async (): Promise<boolean> => {
        // 실패한 사진은 key가 없어 payload에서 빠진다. 그대로 보내면 말없이 사라진다
        if (failed) {
            setError('올리지 못한 사진이 있어요. 다시 시도하거나 빼 주세요.')
            return false
        }

        setSubmitting(true)
        setError(null)
        try {
            const common = {
                slotId: slotId as number,
                loggedOn,
                // 서버는 LocalTime을 받는다. 비었으면 시각을 남기지 않는다
                loggedTime: loggedTime || null,
            }
            if (recordId === null) {
                // 새 기록은 보낸 순서가 그대로 저장된다 — 대표가 이미 맨 앞이다
                await createRecord(madeDexId, { ...common, loggedOn, photos: newPhotosOf(photos) })
            } else {
                await updateRecord(madeDexId, recordId, { ...common, ...updatePayloadOf(photos) })
                // 지난 기록은 서버가 대표 변경을 막는다. 부를 이유가 없다
                if (!past) await fixCover(recordId)
            }
            return true
        } catch (failure) {
            if (isPastDate(failure)) {
                await moveToToday(failure)
                return false
            }
            if (isSlotTaken(failure)) {
                await rereadTaken(failure)
                return false
            }
            setError(madeErrorMessage(failure, '기록을 남기지 못했어요.'))
            return false
        } finally {
            setSubmitting(false)
        }
    }

    /**
     * 선점 목록을 갈아 끼운다.
     * 이미 찬 끼니가 골라진 채로 남으면 칩이 잠기지 않아(잠금 조건이 !selected다)
     * 사용자가 그대로 다시 눌러 또 거절당한다. 그래서 선택을 놓아 준다.
     */
    const applyTaken = (next: number[]) => {
        setTaken(next)
        setSlotId((current) => (current !== null && next.includes(current) ? null : current))
    }

    /**
     * 폼을 채우는 사이 자정을 넘겼다. 올린 사진은 멀쩡하니 버리지 않고,
     * 날짜만 새 기준일로 되잡아 한 번 더 누르면 되게 한다.
     * 새 날의 그 끼니가 이미 차 있을 수도 있어 선점 목록도 다시 읽는다.
     */
    const moveToToday = async (failure: unknown) => {
        try {
            const feed = await fetchFeed(madeDexId)
            setToday(feed.today)
            setLoggedOn(feed.today)
            applyTaken(takenSlotIds(feed, recordId))
        } catch {
            // 기준일을 못 받아도 아래 문구는 띄운다. 사용자가 상황은 알아야 한다
        }
        setError(madeErrorMessage(failure, '날짜가 바뀌었어요. 오늘 기록으로 다시 올려 주세요.'))
    }

    /**
     * 그 끼니는 이미 찼다. 유니크 키에 author_id가 들어가므로 남이 채운 게 아니라
     * 내가 다른 기기·탭에서 먼저 올린 경우다. 화면의 선점 목록이 낡았다는 뜻이라 다시 읽는다.
     */
    const rereadTaken = async (failure: unknown) => {
        try {
            const feed = await fetchFeed(madeDexId, loggedOn || undefined)
            setToday(feed.today)
            applyTaken(takenSlotIds(feed, recordId))
        } catch {
            // 목록을 못 받아도 아래 문구는 띄운다
        }
        setError(madeErrorMessage(failure, '이미 기록한 끼니예요.'))
    }

    // 올리는 중인 사진을 세면 상한을 넘긴 채로 제출된다
    const ready = slotId !== null && readyCount(photos) > 0 && !failed

    return {
        slots: selectable,
        slotId,
        setSlotId,
        /** 신규 등록에서 이미 찬 끼니. 고르지 못하게 막는다 */
        taken,
        /** 지난 기록이라 글만 고칠 수 있는 상태 */
        past,
        loggedOn,
        loggedTime,
        setLoggedTime,
        photos,
        loading,
        submitting,
        error,
        ready,
        failed,
        addFiles,
        writeCaption,
        writeCrop,
        makeCover,
        movePhoto,
        removePhoto,
        retryPhoto,
        submit,
    }
}

/**
 * 그 날짜에 내가 이미 채운 끼니를 모은다.
 * 고치는 중인 기록이 놓인 끼니는 뺀다 — 자기 자리를 자기가 막으면 안 된다.
 */
function takenSlotIds(feed: LogitFeed, editingRecordId: number | null): number[] {
    return feed.slots
        .filter((slot) =>
            slot.cards.some(
                (card) =>
                    card.me &&
                    card.recordCount > 0 &&
                    !(editingRecordId !== null && card.recordIds.includes(editingRecordId)),
            ),
        )
        .map((slot) => slot.slotId)
}
