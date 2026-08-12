/**
 * 화면에서는 기존 사진과 새로 올린 사진이 한 줄로 섞여 보이지만,
 * 서버는 유지할 id와 새 key를 나눠 받는다. 그 둘을 한 배열로 다루기 위한 형태다.
 */
export type RecordPhoto =
    | { id: string; kind: 'kept'; photoId: number; url: string; caption: string; cropX: number; cropY: number }
    | {
          id: string
          kind: 'new'
          status: 'uploading' | 'done' | 'failed'
          file: File
          previewUrl: string
          caption: string
          cropX: number
          cropY: number
          key?: string
          error?: string
      }

let sequence = 0

export function newPhotoId(): string {
    sequence += 1
    return `photo-${sequence}`
}

export function isUploading(photos: RecordPhoto[]): boolean {
    return photos.some((photo) => photo.kind === 'new' && photo.status === 'uploading')
}

export function hasFailure(photos: RecordPhoto[]): boolean {
    return photos.some((photo) => photo.kind === 'new' && photo.status === 'failed')
}

/** 올리기가 끝난 것만 센다. 진행 중인 것을 세면 상한을 넘겨 제출하게 된다 */
export function readyCount(photos: RecordPhoto[]): number {
    return photos.filter((photo) => photo.kind === 'kept' || photo.status === 'done').length
}

export function previewOf(photo: RecordPhoto): string {
    return photo.kind === 'kept' ? photo.url : photo.previewUrl
}

function trimmed(caption: string): string | null {
    return caption.trim() || null
}

/** 신규 기록용. 순서는 화면에 보이는 그대로다 */
export function newPhotosOf(
    photos: RecordPhoto[],
): Array<{ imageKey: string; caption: string | null; cropX: number; cropY: number }> {
    return photos.flatMap((photo) =>
        photo.kind === 'new' && photo.key
            ? [{ imageKey: photo.key, caption: trimmed(photo.caption), cropX: photo.cropX, cropY: photo.cropY }]
            : [],
    )
}

/** 수정용. 서버는 keepPhotos 다음에 newPhotos 순서로 다시 붙인다 */
export function updatePayloadOf(photos: RecordPhoto[]): {
    keepPhotos: Array<{ photoId: number; caption: string | null; cropX: number; cropY: number }>
    newPhotos: Array<{ imageKey: string; caption: string | null; cropX: number; cropY: number }>
} {
    return {
        keepPhotos: photos.flatMap((photo) =>
            photo.kind === 'kept'
                ? [{ photoId: photo.photoId, caption: trimmed(photo.caption), cropX: photo.cropX, cropY: photo.cropY }]
                : [],
        ),
        newPhotos: newPhotosOf(photos),
    }
}
