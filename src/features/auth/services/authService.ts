import { GoogleAuthProvider, signInWithPopup, signOut, type User } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../../../lib/firebase'
import { borrarPosicionesDe } from '../../player/continuar/posiciones'

const googleProvider = new GoogleAuthProvider()

export async function signInWithGoogle() {
  const { user } = await signInWithPopup(auth, googleProvider)
  await ensureUserProfile(user)
  return user
}

export async function signOutUser() {
  // «Continuar donde lo dejaste»: fuera las posiciones de quien sale.
  const uid = auth.currentUser?.uid
  if (uid) {
    borrarPosicionesDe(uid)
  }
  await signOut(auth)
}

async function ensureUserProfile(user: User) {
  const userRef = doc(db, 'users', user.uid)
  const snapshot = await getDoc(userRef)

  if (snapshot.exists()) {
    return
  }

  await setDoc(userRef, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    createdAt: serverTimestamp(),
  })
}
