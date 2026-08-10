import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MAX_PHOTOS, putToS3, requestUploadTargets, validatePhotoFile } from '@/shared/lib/upload'
import { createRecord, fetchRecord, fetchSlots, setDayCardCover, updateRecord } from './logitApi'
import { madeErrorMessage } from './errors'
import { RECORD_MAX_PHOTOS, timeLabel } from './logitTypes'
import { hasFailure, newPhotoId, newPhotosOf, readyCount, updatePayloadOf } from './recordPhotos'
import type { LogitSlot } from './logitTypes'
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

    useEffect(() => {
        let live = true
        setLoading(true)

        const load = async () => {
            const [allSlots, record] = await Promise.all([
                fetchSlots(madeDexId),
                recordId === null ? Promise.resolve(null) : fetchRecord(madeDexId, recordId),
            ])
            if (!live) return

            setSlots(allSlots)
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
    }, [madeDexId, recordId, applyPhotos])

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
            }))

            applyPhotos((current) => [...current, ...accepted])
            void upload(accepted.flatMap((photo) => (photo.kind === 'new' ? [{ id: photo.id, file: photo.file }] : [])))
        },
        [applyPhotos, upload],
    )

    const writeCaption = (id: string, caption: string) => {
        applyPhotos((current) => current.map((photo) => (photo.id === id ? { ...photo, caption } : photo)))
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
                foodNames: [],
                locationName: null,
                lat: null,
                lng: null,
            }
            if (recordId === null) {
                // 새 기록은 보낸 순서가 그대로 저장된다 — 대표가 이미 맨 앞이다
                await createRecord(madeDexId, { ...common, photos: newPhotosOf(photos) })
            } else {
                await updateRecord(madeDexId, recordId, { ...common, ...updatePayloadOf(photos) })
                await fixCover(recordId)
            }
            return true
        } catch (failure) {
            setError(madeErrorMessage(failure, '기록을 남기지 못했어요.'))
            return false
        } finally {
            setSubmitting(false)
        }
    }

    // 올리는 중인 사진을 세면 상한을 넘긴 채로 제출된다
    const ready = slotId !== null && readyCount(photos) > 0 && !failed

    return {
        slots: selectable,
        slotId,
        setSlotId,
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
        makeCover,
        removePhoto,
        retryPhoto,
        submit,
    }
}
