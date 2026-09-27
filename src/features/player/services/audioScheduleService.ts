import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../../../lib/firebase'
import type { RepeatMode } from '../context/PlayerContext'

export type AudioSchedule = {
  repeatMode: RepeatMode
  repeatTimes: number
  startDelayEnabled: boolean
  startDelaySeconds: number
  volume: number
}

/**
 * Id determinista del documento de programación de un audio para un usuario
 * (mismo patrón que las carpetas fijas de Listas vía listaFijaId): permite
 * leer/guardar/borrar directamente por id, sin necesidad de una query.
 */
function audioScheduleId(uid: string, audioId: string): string {
  return `${uid}_${audioId}`
}

export async function getAudioSchedule(uid: string, audioId: string): Promise<AudioSchedule | null> {
  const snapshot = await getDoc(doc(db, 'audioSchedules', audioScheduleId(uid, audioId)))

  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data()

  return {
    repeatMode: data.repeatMode === 'infinite' || data.repeatMode === 'times' ? data.repeatMode : 'off',
    repeatTimes: typeof data.repeatTimes === 'number' ? data.repeatTimes : 5,
    startDelayEnabled: data.startDelayEnabled === true,
    startDelaySeconds: typeof data.startDelaySeconds === 'number' ? data.startDelaySeconds : 30,
    volume: typeof data.volume === 'number' ? data.volume : 1,
  }
}

export async function saveAudioSchedule(uid: string, audioId: string, schedule: AudioSchedule): Promise<void> {
  await setDoc(doc(db, 'audioSchedules', audioScheduleId(uid, audioId)), {
    uid,
    audioId,
    ...schedule,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteAudioSchedule(uid: string, audioId: string): Promise<void> {
  await deleteDoc(doc(db, 'audioSchedules', audioScheduleId(uid, audioId)))
}
