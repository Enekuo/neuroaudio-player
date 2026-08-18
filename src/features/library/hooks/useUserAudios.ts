import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../../lib/firebase'
import { useAuth } from '../../auth/context/AuthContext'
import type { AudioTrack } from '../../player/context/PlayerContext'

export type LibraryAudio = AudioTrack & {
  size: number
  createdAt: Date
  storagePath?: string
}

export function useUserAudios() {
  const { user } = useAuth()
  const [audios, setAudios] = useState<LibraryAudio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setAudios([])
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)
    const audiosQuery = query(collection(db, 'audios'), where('uid', '==', user.uid))

    const unsubscribe = onSnapshot(
      audiosQuery,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap): LibraryAudio => {
          const data = docSnap.data()

          return {
            id: docSnap.id,
            name: data.name as string,
            url: data.url as string,
            duration: typeof data.duration === 'number' ? data.duration : undefined,
            size: data.size as number,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            storagePath: typeof data.storagePath === 'string' ? data.storagePath : undefined,
          }
        })

        items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        setAudios(items)
        setIsLoading(false)
      },
      (err) => {
        console.error('useUserAudios: no se pudieron cargar los audios', err)
        setError('No se pudieron cargar tus audios. Inténtalo de nuevo.')
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [user])

  return { audios, isLoading, error }
}
