import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../../lib/firebase'
import { useAuth } from '../context/AuthContext'

export type UserProfile = {
  displayNamePref?: string
  avatarGender?: 'male' | 'female'
  /** Ajustes → Reproducción: el audio suena al abrirlo. Apagada si no está. */
  reproducirAlAbrir?: boolean
}

export function useUserProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      const data = snapshot.data()

      setProfile({
        displayNamePref: typeof data?.displayNamePref === 'string' ? data.displayNamePref : undefined,
        avatarGender: data?.avatarGender === 'male' || data?.avatarGender === 'female' ? data.avatarGender : undefined,
        reproducirAlAbrir: data?.reproducirAlAbrir === true,
      })
      setIsLoading(false)
    })

    return unsubscribe
  }, [user])

  return { profile, isLoading }
}
