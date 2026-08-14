import { useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import { uploadAudio } from '../services/audioService'

export function useUploadAudio() {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File, name: string) {
    if (!user) {
      setError('Debes iniciar sesión para subir audios.')
      return false
    }

    setIsUploading(true)
    setProgress(0)
    setError(null)

    try {
      await uploadAudio({ uid: user.uid, file, name, onProgress: setProgress })
      return true
    } catch {
      setError('No se pudo subir el audio. Inténtalo de nuevo.')
      return false
    } finally {
      setIsUploading(false)
    }
  }

  return { upload, isUploading, progress, error }
}
