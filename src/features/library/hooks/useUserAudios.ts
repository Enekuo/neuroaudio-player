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

  useEffect(() => {
    if (!user) {
      setAudios([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const audiosQuery = query(collection(db, 'audios'), where('uid', '==', user.uid))

    const unsubscribe = onSnapshot(audiosQuery, (snapshot) => {
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
    })

    return unsubscribe
  }, [user])

  return { audios, isLoading }
}
