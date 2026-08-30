import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../../../lib/firebase'

type CrearListaParams = {
  uid: string
  name: string
  template: string
}

export async function crearLista({ uid, name, template }: CrearListaParams) {
  const listaRef = doc(collection(db, 'listas'))

  await setDoc(listaRef, {
    uid,
    name,
    template,
    audioIds: [],
    createdAt: serverTimestamp(),
  })

  return listaRef.id
}

export async function renombrarLista(listaId: string, name: string) {
  const listaRef = doc(db, 'listas', listaId)
  await updateDoc(listaRef, { name })
}

export async function eliminarLista(listaId: string) {
  const listaRef = doc(db, 'listas', listaId)
  await deleteDoc(listaRef)
}

type ListaFijaMeta = {
  uid: string
  name: string
  template: string
}

/**
 * Añade un audio a una lista.
 *
 * Para las categorías fijas el documento puede no existir todavía. No podemos
 * comprobarlo con getDoc: las reglas de Firestore rechazan la lectura de un
 * documento inexistente (evalúan `resource.data.uid` sobre `null`). Por eso
 * probamos primero `updateDoc` y, si falla, creamos el documento con `setDoc`
 * en modo merge (arrayUnion evita pisar audios ya guardados).
 */
export async function anadirAudioALista(listaId: string, audioId: string, meta: ListaFijaMeta) {
  const listaRef = doc(db, 'listas', listaId)

  try {
    await updateDoc(listaRef, { audioIds: arrayUnion(audioId) })
  } catch {
    await setDoc(
      listaRef,
      {
        uid: meta.uid,
        name: meta.name,
        template: meta.template,
        audioIds: arrayUnion(audioId),
        createdAt: serverTimestamp(),
      },
      { merge: true },
    )
  }
}

export async function quitarAudioDeLista(listaId: string, audioId: string) {
  const listaRef = doc(db, 'listas', listaId)
  await updateDoc(listaRef, { audioIds: arrayRemove(audioId) })
}
