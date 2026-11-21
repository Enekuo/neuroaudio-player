import { GoogleAuthProvider, signInWithPopup, type User } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import { guardarPerfil } from '../perfilProfesional/perfilService'
import { perfilVacio } from '../perfilProfesional/modelo'
import type { Cuenta } from './recorridos'
import type { DatosProfesional } from './registro'
import { tipoCuentaDe } from './tipoCuenta'

const proveedorGoogle = new GoogleAuthProvider()

/**
 * Entra con Google (ventana de Google) y devuelve el usuario. NO crea nada:
 * la cuenta (users/{uid}) solo se crea al registrarse o al elegir en la
 * pantalla de elección.
 */
export async function entrarConGoogle(): Promise<User> {
  const { user } = await signInWithPopup(auth, proveedorGoogle)
  return user
}

/** La cuenta de un usuario: su tipo, o null si no existe users/{uid}. */
export async function leerCuenta(uid: string): Promise<Cuenta> {
  const documento = await getDoc(doc(db, 'users', uid))
  return documento.exists() ? tipoCuentaDe(documento.data()) : null
}

function usuarioConSesion(uid: string) {
  const usuario = auth.currentUser
  if (!usuario || usuario.uid !== uid) {
    throw new Error('No hay sesión con esta cuenta.')
  }
  return usuario
}

/** Lo que llevan todas las cuentas nuevas (como las creaba la app antes). */
const datosBase = (usuario: User) => ({
  uid: usuario.uid,
  email: usuario.email,
  displayName: usuario.displayName,
  createdAt: serverTimestamp(),
  aceptoTerminosEn: serverTimestamp(),
})

/** Crea la cuenta como oyente (aceptando términos: la fecha, del servidor). */
export async function crearCuentaOyente(uid: string) {
  const usuario = usuarioConSesion(uid)
  await setDoc(doc(db, 'users', uid), {
    ...datosBase(usuario),
    tipoCuenta: 'oyente',
  })
}

const datosDeProfesional = (datos: DatosProfesional, novedades: boolean) => ({
  tipoCuenta: 'profesional',
  aceptoTerminosEn: serverTimestamp(),
  profesional: datos,
  // El consentimiento de correos, sí o no, con su fecha.
  novedades: { acepta: novedades, en: serverTimestamp() },
})

/** Crea la cuenta como profesional, con los datos del formulario. */
export async function crearCuentaProfesional(
  uid: string,
  datos: DatosProfesional,
  novedades: boolean,
) {
  const usuario = usuarioConSesion(uid)
  await setDoc(doc(db, 'users', uid), {
    ...datosBase(usuario),
    ...datosDeProfesional(datos, novedades),
  })
  await llevarNombreAlPerfil(uid, datos.nombre)
}

/**
 * Pasa una cuenta de oyente a profesional, conservando todo lo que tenía
 * (solo se añaden campos).
 */
export async function pasarAProfesional(
  uid: string,
  datos: DatosProfesional,
  novedades: boolean,
) {
  usuarioConSesion(uid)
  await setDoc(doc(db, 'users', uid), datosDeProfesional(datos, novedades), {
    merge: true,
  })
  await llevarNombreAlPerfil(uid, datos.nombre)
}

/**
 * El nombre profesional, al perfil: solo si aún no tiene perfil (nunca pisa
 * uno que ya exista). Si falla, la cuenta ya está creada: no se interrumpe
 * nada, y el nombre se puede poner luego en Perfil.
 */
async function llevarNombreAlPerfil(uid: string, nombre: string) {
  try {
    const perfil = await getDoc(doc(db, 'perfilesProfesionales', uid))
    if (!perfil.exists()) {
      await guardarPerfil(uid, { ...perfilVacio(), nombre })
    }
  } catch (error) {
    console.error('No se pudo poner el nombre en el perfil', error)
  }
}
