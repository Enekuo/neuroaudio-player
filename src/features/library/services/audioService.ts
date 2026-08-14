import { collection, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytesResumable, type UploadTaskSnapshot } from 'firebase/storage'
import { db, storage } from '../../../lib/firebase'

type UploadAudioParams = {
  uid: string
  file: File
  name: string
  onProgress?: (progress: number) => void
}

export async function uploadAudio({ uid, file, name, onProgress }: UploadAudioParams) {
  const audioRef = doc(collection(db, 'audios'))
  const extension = getFileExtension(file)
  const storagePath = `audios/${uid}/${audioRef.id}.${extension}`
  const storageRef = ref(storage, storagePath)

  const duration = await getAudioDuration(file)
  const uploadTask = uploadBytesResumable(storageRef, file)

  await new Promise<void>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        onProgress?.((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
      },
      reject,
      () => resolve(),
    )
  })

  const url = await getDownloadURL(uploadTask.snapshot.ref)

  await setDoc(audioRef, {
    uid,
    name,
    url,
    storagePath,
    size: file.size,
    ...(duration !== null ? { duration } : {}),
    createdAt: serverTimestamp(),
  })

  return audioRef.id
}

type DeleteAudioParams = {
  id: string
  url: string
  storagePath?: string
}

export async function deleteAudio({ id, url, storagePath }: DeleteAudioParams) {
  try {
    await deleteObject(ref(storage, storagePath ?? url))
  } catch (error) {
    console.error('No se pudo eliminar el archivo de Storage', error)
  }

  await deleteDoc(doc(db, 'audios', id))
}

function getFileExtension(file: File) {
  const parts = file.name.split('.')

  if (parts.length > 1) {
    return parts.pop() as string
  }

  return file.type.split('/').pop() ?? 'mp3'
}

function getAudioDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file)
    const audioEl = new Audio()

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl)
      audioEl.removeEventListener('loadedmetadata', onLoaded)
      audioEl.removeEventListener('error', onError)
    }

    const onLoaded = () => {
      const duration = Number.isFinite(audioEl.duration) ? audioEl.duration : null
      cleanup()
      resolve(duration)
    }

    const onError = () => {
      cleanup()
      resolve(null)
    }

    audioEl.addEventListener('loadedmetadata', onLoaded)
    audioEl.addEventListener('error', onError)
    audioEl.src = objectUrl
  })
}
