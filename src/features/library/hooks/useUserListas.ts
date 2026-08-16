import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../../lib/firebase'
import { useAuth } from '../../auth/context/AuthContext'

export type LibraryLista = {
  id: string
  name: string
  template: string
  createdAt: Date
}

export function useUserListas() {
  const { user } = useAuth()
  const [listas, setListas] = useState<LibraryLista[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setListas([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const listasQuery = query(collection(db, 'listas'), where('uid', '==', user.uid))

    const unsubscribe = onSnapshot(listasQuery, (snapshot) => {
      const items = snapshot.docs.map((docSnap): LibraryLista => {
        const data = docSnap.data()

        return {
          id: docSnap.id,
          name: data.name as string,
          template: data.template as string,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        }
      })

      items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      setListas(items)
      setIsLoading(false)
    })

    return unsubscribe
  }, [user])

  return { listas, isLoading }
}
