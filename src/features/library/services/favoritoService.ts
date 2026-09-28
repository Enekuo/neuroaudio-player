import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../../../lib/firebase'

// Los favoritos viven en el propio documento del audio (campo `favorite` +
// `favoritedAt`), así la página de Favoritos y los corazones de cada fila se
// actualizan solos con el onSnapshot de useUserAudios, sin colección aparte.
export async function marcarFavorito(audioId: string, favorito: boolean) {
  await updateDoc(doc(db, 'audios', audioId), {
    favorite: favorito,
    favoritedAt: favorito ? serverTimestamp() : null,
  })
}

// Alterna el favorito de un audio desde cualquier fila/menú. Firestore aplica
// el cambio en local al instante (el corazón responde sin esperar a la red);
// si el servidor lo rechaza, se revierte solo y se avisa.
export async function alternarFavorito(audio: { id: string; isFavorite: boolean }) {
  try {
    await marcarFavorito(audio.id, !audio.isFavorite)
  } catch (error) {
    console.error('No se pudo actualizar el favorito', error)
    window.alert('No se pudo actualizar tus favoritos. Inténtalo de nuevo.')
  }
}
