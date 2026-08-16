import { useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import { crearLista } from '../services/listaService'

export function useCrearLista() {
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function create(name: string, template: string) {
    if (!user) {
      setError('Debes iniciar sesión para crear una lista.')
      return false
    }

    setIsSaving(true)
    setError(null)

    try {
      await crearLista({ uid: user.uid, name, template })
      return true
    } catch {
      setError('No se pudo crear la lista. Inténtalo de nuevo.')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  return { create, isSaving, error }
}
