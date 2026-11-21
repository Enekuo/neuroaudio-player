// Entrar con Google: src/features/cuenta/cuentaService.ts (entrarConGoogle).
// Ya no se crea users/{uid} al entrar: solo al registrarse o al elegir.
import { signOut } from 'firebase/auth'
import { auth } from '../../../lib/firebase'
import { borrarPosicionesDe } from '../../player/continuar/posiciones'

export async function signOutUser() {
  // «Continuar donde lo dejaste»: fuera las posiciones de quien sale.
  const uid = auth.currentUser?.uid
  if (uid) {
    borrarPosicionesDe(uid)
  }
  await signOut(auth)
}
