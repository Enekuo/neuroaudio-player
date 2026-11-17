import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../auth/context/AuthContext'

/**
 * Si el usuario con sesión es profesional.
 *
 * Criterio: tiene perfil profesional, es decir, existe
 * `perfilesProfesionales/{su uid}` (se crea al guardar el perfil en el panel).
 * Hoy no hay otra marca de «profesional» (ni en users/{uid} ni en el control
 * de acceso del panel, que aún no existe), y la app del oyente no leía este
 * documento: es UNA lectura del propio documento, una vez por sesión y
 * usuario (se recuerda en memoria). Las reglas dejan leerlo a su dueño en los
 * dos modos.
 *
 * Mientras no se sabe (o si falla la lectura): false, para que un oyente
 * normal nunca vea el botón.
 */
const sabido = new Map<string, boolean>()

export function useEsProfesional(): boolean {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const [resultado, setResultado] = useState<{
    uid: string
    es: boolean
  } | null>(() =>
    uid && sabido.has(uid) ? { uid, es: sabido.get(uid) === true } : null,
  )

  useEffect(() => {
    if (!uid || sabido.has(uid)) {
      return
    }
    let vigente = true
    getDoc(doc(db, 'perfilesProfesionales', uid))
      .then((documento) => {
        sabido.set(uid, documento.exists())
        if (vigente) setResultado({ uid, es: documento.exists() })
      })
      .catch(() => {
        // Sin poder comprobarlo, no se muestra (y se vuelve a intentar en la
        // próxima visita).
        if (vigente) setResultado({ uid, es: false })
      })
    return () => {
      vigente = false
    }
  }, [uid])

  if (!uid) return false
  if (sabido.has(uid)) return sabido.get(uid) === true
  return resultado?.uid === uid ? resultado.es : false
}
