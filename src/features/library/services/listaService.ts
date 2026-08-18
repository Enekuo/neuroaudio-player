import { collection, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
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
