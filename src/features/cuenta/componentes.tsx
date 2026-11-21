import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import '@fontsource/poppins/600.css'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/600.css'
import '@fontsource/dm-sans/700.css'
import LogoNeuroAudio from '../../components/landing/LogoNeuroAudio'
import GoogleIcon from '../auth/components/GoogleIcon'
import '../../styles/registro.css'

/**
 * Marco común de las pantallas de cuenta: fondo con manchas, logo oficial
 * (enlazado a la landing), tarjeta blanca con franja de degradado y, debajo,
 * los enlaces.
 */
export function PantallaCuenta({
  etiqueta,
  children,
  debajo,
}: {
  /** Nombre de la pantalla para lectores (el <main>). */
  etiqueta: string
  children: ReactNode
  debajo?: ReactNode
}) {
  return (
    <main className="registro" aria-label={etiqueta}>
      <Link to="/" className="registro__logo" aria-label="NeuroAudio, inicio">
        <LogoNeuroAudio />
      </Link>
      <section className="registro__tarjeta">{children}</section>
      {debajo && <div className="registro__debajo">{debajo}</div>}
    </main>
  )
}

/** Un bloque que entra escalonado (el número marca el orden). */
export function Escalon({
  i,
  children,
  className = '',
}: {
  i: number
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`registro__escalon ${className}`.trim()}
      style={{ ['--i' as string]: i }}
    >
      {children}
    </div>
  )
}

/** Título con una palabra en azul: «Crea tu cuenta *profesional*». */
export function Titulo({
  antes,
  clave,
  despues = '',
  id,
}: {
  antes: string
  clave: string
  despues?: string
  id?: string
}) {
  return (
    <h1 className="registro__titulo" id={id}>
      {antes}
      <em>{clave}</em>
      {despues}
    </h1>
  )
}

/**
 * Botón de Google (estilo oficial) o azul. Mientras espera, muestra carga y
 * no admite otro clic.
 */
export function BotonCuenta({
  children,
  onClick,
  cargando = false,
  disabled = false,
  google = true,
  describedBy,
}: {
  children: ReactNode
  onClick: () => void
  cargando?: boolean
  disabled?: boolean
  google?: boolean
  describedBy?: string
}) {
  return (
    <button
      type="button"
      className={`registro__boton ${google ? 'registro__boton--google' : 'registro__boton--azul'}`}
      onClick={() => {
        if (!cargando) onClick()
      }}
      disabled={disabled}
      aria-busy={cargando}
      aria-describedby={describedBy}
    >
      {cargando ? (
        <span className="registro__cargando" aria-hidden="true" />
      ) : (
        google && (
          <span className="registro__google" aria-hidden="true">
            <GoogleIcon />
          </span>
        )
      )}
      <span>{cargando ? 'Un momento…' : children}</span>
    </button>
  )
}

/** Una opción entre varias, en pastillas (radios de verdad, accesibles). */
export function Pastillas({
  etiqueta,
  opcional = false,
  nombre,
  opciones,
  valor,
  onCambiar,
  error,
}: {
  etiqueta: string
  opcional?: boolean
  nombre: string
  opciones: readonly { valor: string; etiqueta: string }[]
  valor: string
  onCambiar: (valor: string) => void
  error?: string
}) {
  const idError = useId()
  return (
    <fieldset
      className="registro__campo"
      aria-describedby={error ? idError : undefined}
      aria-required={!opcional}
    >
      <legend className="registro__etiqueta">
        {etiqueta}
        {opcional && <span className="registro__opcional"> (opcional)</span>}
      </legend>
      <div className="registro__pastillas">
        {opciones.map((o) => (
          <label key={o.valor} className="registro__pastilla">
            <input
              type="radio"
              name={nombre}
              value={o.valor}
              checked={valor === o.valor}
              onChange={() => onCambiar(o.valor)}
            />
            <span>{o.etiqueta}</span>
          </label>
        ))}
      </div>
      {error && (
        <p id={idError} className="registro__error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  )
}

/** Enlaces a los textos legales (en pestaña nueva). */
export function EnlacesLegales() {
  return (
    <>
      los{' '}
      <a href="/legal/terminos" target="_blank" rel="noopener">
        Términos del servicio
      </a>{' '}
      y la{' '}
      <a href="/legal/privacidad" target="_blank" rel="noopener">
        Política de privacidad
      </a>
    </>
  )
}

/**
 * «¿Seguro que quieres crear una cuenta profesional?». Ventana modal: el
 * foco empieza en «Sí, continuar», no sale de la ventana, Escape (o clic
 * fuera) cancela y, al cerrar, vuelve a donde estaba.
 */
export function DialogoPasoAProfesional({
  onCancelar,
  onConfirmar,
}: {
  onCancelar: () => void
  onConfirmar: () => void
}) {
  const tarjeta = useRef<HTMLDivElement>(null)
  const confirmar = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const antes = document.activeElement as HTMLElement | null
    confirmar.current?.focus()
    return () => antes?.focus?.()
  }, [])

  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancelar()
        return
      }
      if (e.key !== 'Tab' || !tarjeta.current) return
      const botones = [...tarjeta.current.querySelectorAll<HTMLButtonElement>('button')]
      const primero = botones[0]
      const ultimo = botones[botones.length - 1]
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primero.focus()
      }
    }
    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [onCancelar])

  return (
    <div className="registro-dialogo" role="presentation" onClick={onCancelar}>
      <div
        ref={tarjeta}
        className="registro-dialogo__tarjeta"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="paso-profesional-titulo"
        aria-describedby="paso-profesional-texto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="paso-profesional-titulo" className="registro-dialogo__titulo">
          ¿Seguro que quieres crear una cuenta profesional?
        </h2>
        <p id="paso-profesional-texto" className="registro-dialogo__texto">
          Tu cuenta pasará a ser profesional. Conservarás todo lo que tienes como
          oyente y podrás seguir escuchando desde el panel del oyente.
        </p>
        <div className="registro-dialogo__acciones">
          <button
            type="button"
            className="registro__boton registro__boton--secundario"
            onClick={onCancelar}
          >
            Cancelar
          </button>
          <button
            ref={confirmar}
            type="button"
            className="registro__boton registro__boton--azul"
            onClick={onConfirmar}
          >
            Sí, continuar
          </button>
        </div>
      </div>
    </div>
  )
}
