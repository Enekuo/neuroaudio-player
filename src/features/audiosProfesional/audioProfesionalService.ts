import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import {
  deleteObject,
  getBlob,
  ref,
  uploadBytesResumable,
  type UploadTask,
} from 'firebase/storage'
import { db, storage } from '../../lib/firebase'
import { getAudioDuration } from '../library/services/audioService'
import { ErrorAudio, comprobarArchivoAudio } from './archivoAudio'
import {
  SUBIDAS_AUDIO_POR_MINUTO,
  TIPOS_PORTADA_AUDIO,
  idEnvio,
  idGeneralDeBiblioteca,
  normalizarEtiquetas,
  rutaAudio,
  rutaPortadaAudio,
  type AudioProfesional,
  type EnvioAudio,
  type EstadoAudio,
  type TipoPortadaAudio,
} from './modelo'
import type { Encuadre } from '../perfilProfesional/fotos/encuadre'
import { idVinculo } from '../perfilProfesional/modelo'
import {
  adquirirImagenPrivada,
  borrarImagenPrivada,
  soltarImagenPrivada,
  subirImagenCuadrada,
} from '../perfilProfesional/fotos/imagenPrivada'

const COLECCION = 'audiosProfesional'
const VENTANA_MS = 60_000

// ---------- Lectura ----------

const texto = (v: unknown) => (typeof v === 'string' ? v : '')
const numero = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) ? v : 0
const fecha = (v: unknown) =>
  v && typeof (v as { toDate?: unknown }).toDate === 'function'
    ? (v as { toDate: () => Date }).toDate()
    : null

/** Sin campo (audios anteriores) o con datos raros: la de NeuroAudio. */
function portadaDesdeDocumento(d: DocumentData) {
  const imagen =
    typeof d.portadaImagen === 'string' && d.portadaImagen
      ? d.portadaImagen
      : null
  const portada: TipoPortadaAudio = TIPOS_PORTADA_AUDIO.includes(d.portada)
    ? d.portada
    : 'defecto'
  if (portada === 'propia' && !imagen) {
    return { portada: 'defecto' as const, portadaImagen: null }
  }
  return { portada, portadaImagen: portada === 'propia' ? imagen : null }
}

function audioDesdeDocumento(id: string, d: DocumentData): AudioProfesional {
  return {
    id,
    profesionalUid: texto(d.profesionalUid),
    titulo: texto(d.titulo),
    descripcion: texto(d.descripcion),
    estado: d.estado === 'publicado' ? 'publicado' : 'borrador',
    tipo: d.tipo === 'personal' || d.tipo === 'biblioteca' ? d.tipo : 'general',
    destinatarioUid:
      typeof d.destinatarioUid === 'string' ? d.destinatarioUid : null,
    archivo: texto(d.archivo),
    duracionSegundos: numero(d.duracionSegundos),
    tamanoBytes: numero(d.tamanoBytes),
    contieneSalud: d.contieneSalud === true,
    orden: numero(d.orden),
    ...portadaDesdeDocumento(d),
    etiquetas: Array.isArray(d.etiquetas)
      ? d.etiquetas.filter((e: unknown): e is string => typeof e === 'string')
      : [],
    deMisAudios: typeof d.deMisAudios === 'string' ? d.deMisAudios : null,
    enAudios: d.enAudios === true,
    publicoEnAudios: d.publicoEnAudios === true,
    enProgramaPublico: d.enProgramaPublico === true,
    creadoEn: fecha(d.creadoEn),
    actualizadoEn: fecha(d.actualizadoEn),
  }
}

const porOrden = (a: AudioProfesional, b: AudioProfesional) =>
  a.orden - b.orden ||
  (b.creadoEn?.getTime() ?? 0) - (a.creadoEn?.getTime() ?? 0)

/** Todos los audios generales del propio profesional (borradores incluidos), en su orden. */
export function escucharMisAudiosGenerales(
  profesionalUid: string,
  onAudios: (audios: AudioProfesional[]) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    query(
      collection(db, COLECCION),
      where('profesionalUid', '==', profesionalUid),
      where('tipo', '==', 'general'),
    ),
    (snap) =>
      onAudios(
        snap.docs
          .map((d) =>
            audioDesdeDocumento(d.id, d.data({ serverTimestamps: 'estimate' })),
          )
          .sort(porOrden),
      ),
    (error) => onError?.(error),
  )
}

/**
 * Audios generales PUBLICADOS de un profesional, para un oyente con vínculo
 * activo. La consulta filtra por tipo y estado porque las reglas solo dejan
 * leer eso (sin ordenar en Firestore: así no hace falta un índice compuesto).
 */
export function escucharAudiosPublicados(
  profesionalUid: string,
  onAudios: (audios: AudioProfesional[]) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    query(
      collection(db, COLECCION),
      where('profesionalUid', '==', profesionalUid),
      where('tipo', '==', 'general'),
      where('estado', '==', 'publicado'),
    ),
    (snap) =>
      onAudios(
        snap.docs
          .map((d) => audioDesdeDocumento(d.id, d.data()))
          .sort(porOrden),
      ),
    (error) => onError?.(error),
  )
}

/**
 * Audios PERSONALES publicados que un profesional ha dirigido a este oyente
 * («Para ti»). Las reglas solo dejan leer los que tienen su uid como
 * destinatario y con vínculo activo, y la consulta pide exactamente eso.
 */
export function escucharAudiosParaMi(
  profesionalUid: string,
  oyenteUid: string,
  onAudios: (audios: AudioProfesional[]) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    query(
      collection(db, COLECCION),
      where('profesionalUid', '==', profesionalUid),
      where('tipo', '==', 'personal'),
      where('destinatarioUid', '==', oyenteUid),
      where('estado', '==', 'publicado'),
    ),
    (snap) =>
      onAudios(
        snap.docs
          .map((d) => audioDesdeDocumento(d.id, d.data()))
          .sort(porOrden),
      ),
    (error) => onError?.(error),
  )
}

/**
 * Los audios PERSONALES del propio profesional (para una persona concreta),
 * borradores incluidos, del más reciente al más antiguo. Nunca se mezclan con
 * los generales (ni en su pestaña ni en las listas).
 */
export function escucharMisAudiosPersonales(
  profesionalUid: string,
  onAudios: (audios: AudioProfesional[]) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    query(
      collection(db, COLECCION),
      where('profesionalUid', '==', profesionalUid),
      where('tipo', '==', 'personal'),
    ),
    (snap) =>
      onAudios(
        snap.docs
          .map((d) =>
            audioDesdeDocumento(d.id, d.data({ serverTimestamps: 'estimate' })),
          )
          .sort(
            (a, b) =>
              (b.creadoEn?.getTime() ?? 0) - (a.creadoEn?.getTime() ?? 0),
          ),
      ),
    (error) => onError?.(error),
  )
}

/**
 * Un audio, en vivo (null si no existe o ya no se puede leer: borrado,
 * despublicado o sin vínculo). Para la portada del audio que suena.
 */
export function escucharAudio(
  audioId: string,
  onAudio: (audio: AudioProfesional | null) => void,
) {
  return onSnapshot(
    doc(db, COLECCION, audioId),
    (snap) =>
      onAudio(snap.exists() ? audioDesdeDocumento(snap.id, snap.data()) : null),
    () => onAudio(null),
  )
}

// ---------- Subida ----------

/**
 * Reserva el permiso para subir UN audio nuevo (límite por minuto en
 * `limitesSubidaAudio/{uid}`, comprobado por las reglas). Storage solo admite
 * el archivo del audio reservado.
 */
async function reservarSubidaAudio(uid: string, audioId: string) {
  const limite = doc(db, 'limitesSubidaAudio', uid)
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(limite)
      const datos = snap.data()
      const inicio = datos?.ventanaInicio?.toMillis?.() as number | undefined
      const dentroDeVentana =
        inicio !== undefined && Date.now() < inicio + VENTANA_MS
      if (snap.exists() && dentroDeVentana) {
        if ((datos?.cuenta ?? 0) >= SUBIDAS_AUDIO_POR_MINUTO) {
          throw new ErrorAudio(
            'Has subido muchos audios seguidos. Espera un minuto y vuelve a intentarlo.',
          )
        }
        tx.update(limite, {
          cuenta: (datos?.cuenta ?? 0) + 1,
          reservada: audioId,
          reservadaEn: serverTimestamp(),
        })
      } else {
        tx.set(limite, {
          ventanaInicio: serverTimestamp(),
          cuenta: 1,
          reservada: audioId,
          reservadaEn: serverTimestamp(),
        })
      }
    })
  } catch (error) {
    if (error instanceof ErrorAudio) throw error
    throw new ErrorAudio(
      'No se pudo subir el audio ahora. Espera un minuto y vuelve a intentarlo.',
    )
  }
}

export type AudioSubido = {
  audioId: string
  archivo: string
  duracionSegundos: number
  tamanoBytes: number
}

export type SubidaAudio = {
  /** Termina cuando el archivo está en Storage (aún sin documento). */
  promesa: Promise<AudioSubido>
  cancelar: () => void
}

/**
 * Comprueba y sube un audio a `audiosPro/{uid}/{audioId}/archivo`, con
 * progreso (0–100) y opción de cancelar. El documento se crea después, al
 * guardar el formulario (crearAudio); si no se guarda, hay que borrar el
 * archivo (borrarArchivoAudio).
 */
/** Id para un audio nuevo (se pide antes para subir su portada a la vez). */
export function nuevoIdAudio() {
  return doc(collection(db, COLECCION)).id
}

export function subirAudio(
  uid: string,
  file: File,
  onProgreso: (porcentaje: number) => void,
  audioId: string = nuevoIdAudio(),
  /** Audio de «Mis audios»: su archivo va en la carpeta de la biblioteca. */
  biblioteca = false,
): SubidaAudio {
  let tarea: UploadTask | null = null
  let cancelada = false

  const promesa = (async () => {
    const tipo = await comprobarArchivoAudio(file)
    const duracion = await getAudioDuration(file)
    if (duracion === null) {
      throw new ErrorAudio(
        'No se pudo leer la duración del audio. ¿Está dañado?',
      )
    }
    await reservarSubidaAudio(uid, audioId)
    if (cancelada) throw new ErrorAudio('Subida cancelada.')

    const archivo = rutaAudio(uid, audioId, biblioteca)
    tarea = uploadBytesResumable(ref(storage, archivo), file, {
      contentType: tipo,
      cacheControl: 'private, max-age=3600',
    })
    await new Promise<void>((resolve, reject) => {
      tarea!.on(
        'state_changed',
        (s) =>
          onProgreso(
            s.totalBytes ? (s.bytesTransferred / s.totalBytes) * 100 : 0,
          ),
        (error) =>
          reject(
            (error as { code?: string }).code === 'storage/canceled'
              ? new ErrorAudio('Subida cancelada.')
              : new ErrorAudio(
                  'No se pudo subir el audio. Revisa tu conexión e inténtalo de nuevo.',
                ),
          ),
        () => resolve(),
      )
    })
    return {
      audioId,
      archivo,
      duracionSegundos: Math.round(duracion),
      tamanoBytes: file.size,
    }
  })()

  return {
    promesa,
    cancelar: () => {
      cancelada = true
      tarea?.cancel()
    },
  }
}

export type DatosAudio = {
  titulo: string
  descripcion: string
  contieneSalud: boolean
  estado: EstadoAudio
  portada?: TipoPortadaAudio
  /** Id de la imagen propia (con portada 'propia'). */
  portadaImagen?: string | null
  /** Solo en la biblioteca. */
  etiquetas?: string[]
}

/** Crea el documento de un audio general recién subido (al principio de la lista). */
/**
 * Crea el documento del audio ya subido. Con `destinatarioUid` es un audio
 * personal (solo para esa persona, que debe tener un vínculo activo con el
 * profesional: lo exigen las reglas); sin él, general. El tipo y el
 * destinatario no se pueden cambiar después.
 */
export async function crearAudio(
  uid: string,
  subido: AudioSubido,
  datos: DatosAudio,
  orden: number,
  destinatarioUid: string | null = null,
  /** Audio de «Mis audios» (subido con `biblioteca` en subirAudio). */
  biblioteca = false,
) {
  await setDoc(doc(db, COLECCION, subido.audioId), {
    profesionalUid: uid,
    titulo: datos.titulo.trim(),
    descripcion: datos.descripcion.trim(),
    estado: datos.estado,
    tipo: biblioteca ? 'biblioteca' : destinatarioUid ? 'personal' : 'general',
    destinatarioUid: biblioteca ? null : destinatarioUid,
    ...(biblioteca
      ? { etiquetas: normalizarEtiquetas(datos.etiquetas ?? []) }
      : {}),
    archivo: subido.archivo,
    duracionSegundos: subido.duracionSegundos,
    tamanoBytes: subido.tamanoBytes,
    contieneSalud: datos.contieneSalud,
    orden,
    portada: datos.portada ?? 'defecto',
    portadaImagen:
      datos.portada === 'propia' ? (datos.portadaImagen ?? null) : null,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  })
}

/** Lo que comparten un audio de Biblioteca y su general en Audios. */
const CAMPOS_COMPARTIDOS = [
  'titulo',
  'descripcion',
  'contieneSalud',
  'portada',
  'portadaImagen',
]

/**
 * Edita título, descripción, salud o estado (publicar / despublicar). Con
 * `enlazado` (ver audioEnlazado), lo compartido se guarda también en el
 * otro documento del mismo audio, en una sola escritura; el estado y las
 * etiquetas, solo en este.
 */
export async function actualizarAudio(
  audioId: string,
  cambios: Partial<DatosAudio>,
  enlazado: string | null = null,
) {
  const datos: Record<string, unknown> = { actualizadoEn: serverTimestamp() }
  if (cambios.titulo !== undefined) datos.titulo = cambios.titulo.trim()
  if (cambios.descripcion !== undefined)
    datos.descripcion = cambios.descripcion.trim()
  if (cambios.contieneSalud !== undefined)
    datos.contieneSalud = cambios.contieneSalud
  if (cambios.estado !== undefined) datos.estado = cambios.estado
  if (cambios.etiquetas !== undefined)
    datos.etiquetas = normalizarEtiquetas(cambios.etiquetas)
  if (cambios.portada !== undefined) {
    datos.portada = cambios.portada
    datos.portadaImagen =
      cambios.portada === 'propia' ? (cambios.portadaImagen ?? null) : null
  }
  const compartidos = Object.fromEntries(
    Object.entries(datos).filter(([campo]) =>
      CAMPOS_COMPARTIDOS.includes(campo),
    ),
  )
  // Publicar o despublicar en Audios uno de Biblioteca: su original lleva la
  // marca que mira Storage (publicoEnAudios).
  const esSuGeneral =
    enlazado !== null && idGeneralDeBiblioteca(enlazado) === audioId
  const marca =
    esSuGeneral && cambios.estado !== undefined
      ? { publicoEnAudios: cambios.estado === 'publicado' }
      : {}
  if (
    !enlazado ||
    (Object.keys(compartidos).length === 0 && !('publicoEnAudios' in marca))
  ) {
    await updateDoc(doc(db, COLECCION, audioId), datos)
    return
  }
  const lote = writeBatch(db)
  lote.update(doc(db, COLECCION, audioId), datos)
  lote.update(doc(db, COLECCION, enlazado), {
    ...compartidos,
    ...marca,
    actualizadoEn: serverTimestamp(),
  })
  await lote.commit()
}

/**
 * Añade a Audios (generales y publicados) audios de Biblioteca sin volver a
 * subirlos: por cada uno, un general {id}__general con el mismo archivo y su
 * título, descripción, imagen y salud (sin etiquetas), al final de la lista
 * desde `ordenDesde`; y la marca «En Audios» en el original. Todo en una
 * sola escritura.
 */
export async function anadirDesdeBiblioteca(
  origenes: AudioProfesional[],
  ordenDesde: number,
) {
  const lote = writeBatch(db)
  origenes.forEach((b, i) => {
    lote.set(doc(db, COLECCION, idGeneralDeBiblioteca(b.id)), {
      profesionalUid: b.profesionalUid,
      titulo: b.titulo,
      descripcion: b.descripcion,
      estado: 'publicado',
      tipo: 'general',
      destinatarioUid: null,
      deMisAudios: b.id,
      archivo: b.archivo,
      duracionSegundos: b.duracionSegundos,
      tamanoBytes: b.tamanoBytes,
      contieneSalud: b.contieneSalud,
      orden: ordenDesde + i,
      portada: b.portada,
      portadaImagen: b.portada === 'propia' ? b.portadaImagen : null,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    })
    lote.update(doc(db, COLECCION, b.id), {
      enAudios: true,
      publicoEnAudios: true,
      actualizadoEn: serverTimestamp(),
    })
  })
  await lote.commit()
}

/** Guarda el nuevo orden (0, 1, 2…) de los audios, en una sola escritura. */
export async function guardarOrden(audioIds: string[]) {
  const lote = writeBatch(db)
  audioIds.forEach((id, orden) =>
    lote.update(doc(db, COLECCION, id), {
      orden,
      actualizadoEn: serverTimestamp(),
    }),
  )
  await lote.commit()
}

/** Borra el archivo de un audio (si ya no existe, no es un error). */
export async function borrarArchivoAudio(archivo: string) {
  olvidarAudio(archivo)
  try {
    await deleteObject(ref(storage, archivo))
  } catch (error) {
    if ((error as { code?: string }).code !== 'storage/object-not-found')
      throw error
  }
}

/**
 * Borra un audio: primero el documento (deja de verse) y después su archivo.
 * Uno añadido desde Biblioteca solo se quita de Audios (el archivo y la
 * imagen son del original, que sigue allí); uno de Biblioteca que también
 * está en Audios se quita de los dos.
 */
export async function borrarAudio(audio: AudioProfesional) {
  if (audio.deMisAudios) {
    const lote = writeBatch(db)
    lote.delete(doc(db, COLECCION, audio.id))
    lote.update(doc(db, COLECCION, audio.deMisAudios), {
      enAudios: false,
      publicoEnAudios: false,
      actualizadoEn: serverTimestamp(),
    })
    await lote.commit()
    return
  }
  const biblioteca = audio.tipo === 'biblioteca'
  if (biblioteca) {
    // De la biblioteca: el audio y todos sus envíos a la vez (se lo quita a
    // todos). Si quedara algún envío suelto, no enseña nada: el audio ya no
    // existe.
    const envios = await getDocs(
      query(
        collection(db, ENVIOS),
        where('profesionalUid', '==', audio.profesionalUid),
        where('audioId', '==', audio.id),
      ),
    )
    const lote = writeBatch(db)
    lote.delete(doc(db, COLECCION, audio.id))
    if (audio.enAudios)
      lote.delete(doc(db, COLECCION, idGeneralDeBiblioteca(audio.id)))
    envios.docs.forEach((e) => lote.delete(e.ref))
    await lote.commit()
  } else {
    await deleteDoc(doc(db, COLECCION, audio.id))
  }
  await borrarArchivoAudio(audio.archivo).catch(() => {})
  if (audio.portadaImagen) {
    await borrarPortadaAudio(
      audio.profesionalUid,
      audio.id,
      audio.portadaImagen,
      biblioteca,
    ).catch(() => {})
  }
}

// ---------- «Mis audios»: biblioteca y envíos ----------

const ENVIOS = 'enviosAudio'

/** La biblioteca del profesional con sesión, del más reciente al más antiguo. */
export function escucharMiBiblioteca(
  profesionalUid: string,
  onAudios: (audios: AudioProfesional[]) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    query(
      collection(db, COLECCION),
      where('profesionalUid', '==', profesionalUid),
      where('tipo', '==', 'biblioteca'),
    ),
    (snap) =>
      onAudios(
        snap.docs
          .map((d) =>
            audioDesdeDocumento(d.id, d.data({ serverTimestamps: 'estimate' })),
          )
          .sort(
            (a, b) =>
              (b.creadoEn?.getTime() ?? 0) - (a.creadoEn?.getTime() ?? 0),
          ),
      ),
    (error) => onError?.(error),
  )
}

function envioDesdeDocumento(id: string, d: DocumentData): EnvioAudio {
  return {
    id,
    profesionalUid: texto(d.profesionalUid),
    audioId: texto(d.audioId),
    oyenteUid: texto(d.oyenteUid),
    creadoEn: fecha(d.creadoEn),
  }
}

/** Todos los envíos del profesional con sesión (a quién mandó qué). */
export function escucharMisEnvios(
  profesionalUid: string,
  onEnvios: (envios: EnvioAudio[]) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    query(
      collection(db, ENVIOS),
      where('profesionalUid', '==', profesionalUid),
    ),
    (snap) =>
      onEnvios(
        snap.docs.map((d) =>
          envioDesdeDocumento(d.id, d.data({ serverTimestamps: 'estimate' })),
        ),
      ),
    (error) => onError?.(error),
  )
}

/**
 * Los audios de la biblioteca que un profesional ha enviado a este oyente
 * («Para ti»), del más reciente al más antiguo. Las reglas solo le dejan
 * leer sus propios envíos.
 */
export function escucharEnviosParaMi(
  profesionalUid: string,
  oyenteUid: string,
  onEnvios: (envios: EnvioAudio[]) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    query(
      collection(db, ENVIOS),
      where('profesionalUid', '==', profesionalUid),
      where('oyenteUid', '==', oyenteUid),
    ),
    (snap) =>
      onEnvios(
        snap.docs
          .map((d) => envioDesdeDocumento(d.id, d.data()))
          .sort(
            (a, b) =>
              (b.creadoEn?.getTime() ?? 0) - (a.creadoEn?.getTime() ?? 0),
          ),
      ),
    (error) => onError?.(error),
  )
}

/**
 * Un envío y, en la misma escritura, el audio en la lista de su vínculo
 * (audiosBiblioteca), que es lo que mira Storage para dejarle oírlo.
 */
function escribirEnvio(
  profesionalUid: string,
  audioId: string,
  oyenteUid: string,
) {
  const lote = writeBatch(db)
  lote.set(doc(db, ENVIOS, idEnvio(audioId, oyenteUid)), {
    profesionalUid,
    audioId,
    oyenteUid,
    creadoEn: serverTimestamp(),
  })
  lote.update(doc(db, 'vinculos', idVinculo(profesionalUid, oyenteUid)), {
    audiosBiblioteca: arrayUnion(audioId),
  })
  return lote.commit()
}

/**
 * Envía un audio de la biblioteca a varias personas (con vínculo activo:
 * lo exigen las reglas). Un envío por escritura, para que uno que falle no
 * tumbe a los demás. Devuelve a quién no se pudo enviar.
 */
export async function enviarAudio(
  audio: AudioProfesional,
  oyenteUids: string[],
) {
  const resultados = await Promise.allSettled(
    oyenteUids.map((oyenteUid) =>
      escribirEnvio(audio.profesionalUid, audio.id, oyenteUid),
    ),
  )
  return oyenteUids.filter((_, i) => resultados[i].status === 'rejected')
}

/**
 * Envía varios audios de la biblioteca a UNA persona (ficha de «Oyentes»).
 * Mismo envío y mismas reglas que enviarAudio, uno por escritura. Devuelve
 * los ids de los audios que no se pudieron enviar.
 */
export async function enviarAudiosA(
  profesionalUid: string,
  oyenteUid: string,
  audioIds: string[],
) {
  const resultados = await Promise.allSettled(
    audioIds.map((audioId) =>
      escribirEnvio(profesionalUid, audioId, oyenteUid),
    ),
  )
  return audioIds.filter((_, i) => resultados[i].status === 'rejected')
}

/**
 * Retira un audio a una persona: deja de verlo al momento. De la lista de
 * su vínculo se quita al recalcular los accesos (useMantenerAccesos, en las
 * páginas donde se retira), por si lo sigue teniendo por un programa.
 */
export async function retirarEnvio(audioId: string, oyenteUid: string) {
  await deleteDoc(doc(db, ENVIOS, idEnvio(audioId, oyenteUid)))
}

// ---------- Portada propia (privada) ----------
// Mismo procesado, contador (limitesSubida) y lectura privada que la imagen
// de las listas. La lee su dueño y, si el audio está publicado, quien puede
// escucharlo (en uno personal, solo su destinatario).

// `biblioteca`: el audio es de «Mis audios» (su portada va en esa carpeta).

export function subirPortadaAudio(
  profesionalUid: string,
  audioId: string,
  file: File,
  encuadre?: Encuadre,
  biblioteca = false,
) {
  return subirImagenCuadrada(
    profesionalUid,
    (imagenId) =>
      rutaPortadaAudio(profesionalUid, audioId, imagenId, biblioteca),
    file,
    encuadre,
  )
}

export function borrarPortadaAudio(
  profesionalUid: string,
  audioId: string,
  imagenId: string,
  biblioteca = false,
) {
  return borrarImagenPrivada(
    rutaPortadaAudio(profesionalUid, audioId, imagenId, biblioteca),
  )
}

export function adquirirPortadaAudio(
  profesionalUid: string,
  audioId: string,
  imagenId: string,
  biblioteca = false,
) {
  return adquirirImagenPrivada(
    rutaPortadaAudio(profesionalUid, audioId, imagenId, biblioteca),
  )
}

export function soltarPortadaAudio(
  profesionalUid: string,
  audioId: string,
  imagenId: string,
  biblioteca = false,
) {
  soltarImagenPrivada(
    rutaPortadaAudio(profesionalUid, audioId, imagenId, biblioteca),
  )
}

// ---------- Reproducción privada ----------
// Nunca getDownloadURL (daría un enlace público permanente). Se descarga con
// getBlob, que pasa por las reglas de Storage en cada petición, y se
// reproduce con una URL local (blob:) de esta pestaña. Se guardan en memoria
// solo los últimos audios, porque pueden pesar mucho.

const MAX_EN_MEMORIA = 3
const cache = new Map<string, Promise<string>>()

function olvidarAudio(archivo: string) {
  const enCache = cache.get(archivo)
  cache.delete(archivo)
  enCache?.then((url) => URL.revokeObjectURL(url)).catch(() => {})
}

/** URL local (blob:) del audio, si quien la pide tiene permiso. */
export function urlAudio(archivo: string) {
  const enCache = cache.get(archivo)
  if (enCache) {
    // Lo más reciente, al final.
    cache.delete(archivo)
    cache.set(archivo, enCache)
    return enCache
  }
  const url = getBlob(ref(storage, archivo)).then((blob) =>
    URL.createObjectURL(blob),
  )
  url.catch(() => cache.delete(archivo))
  cache.set(archivo, url)
  while (cache.size > MAX_EN_MEMORIA) {
    const masAntiguo = cache.keys().next().value as string
    olvidarAudio(masAntiguo)
  }
  return url
}
