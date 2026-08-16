import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore'
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
