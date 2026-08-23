import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../../lib/firebase'

export async function updateDisplayNamePref(uid: string, displayNamePref: string) {
  await setDoc(doc(db, 'users', uid), { displayNamePref }, { merge: true })
}

export async function updateAvatarGenderPref(uid: string, avatarGender: 'male' | 'female') {
  await setDoc(doc(db, 'users', uid), { avatarGender }, { merge: true })
}
