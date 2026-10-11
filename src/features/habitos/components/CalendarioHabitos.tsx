import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type { AudioProgramado } from '../data/programacion'
import {
  DIAS_SEMANA,
  claveDia,
  diasDeLaRejilla,
  fechaLarga,
  inicioDeMes,
  inicioDelDia,
  mismoDia,
  nombreMes,
  sumarDias,
} from '../utils/fechas'
import HojaDia from './HojaDia'
import { IconoChevron, IconoOnda } from './iconos'

// Programaciones por día ('AAAA-MM-DD'). Vacío hasta conectar las reales.
const PROGRAMACIONES = new Map<string, AudioProgramado[]>()

/**
 * Pestaña «Calendario» de Hábitos (solo diseño: aún sin programaciones reales).
 * Rejilla mensual de lunes a domingo; hoy y el día elegido se distinguen, y
 * los días con algún audio programado llevan un mini icono de onda. Al
 * pulsar un día se abre encima su hoja (HojaDia).
 *
 * Teclado: las flechas mueven el foco por los días (cambiando de mes si hace
 * falta) y Intro o Espacio abren el día.
 */
function CalendarioHabitos() {
  const hoy = useMemo(() => inicioDelDia(new Date()), [])

  const [mes, setMes] = useState(() => inicioDeMes(hoy))
  const [seleccionado, setSeleccionado] = useState(hoy)
  const [diaAbierto, setDiaAbierto] = useState<Date | null>(null)
  // Sentido del último cambio de mes, para que la rejilla entre por ese lado.
  const [sentido, setSentido] = useState<'anterior' | 'siguiente' | null>(null)
  const botones = useRef(new Map<string, HTMLButtonElement>())

  const dias = useMemo(() => diasDeLaRejilla(mes), [mes])
  const enMesActual =
    mes.getFullYear() === hoy.getFullYear() && mes.getMonth() === hoy.getMonth()

  const irAMes = (destino: Date) => {
    const nuevo = inicioDeMes(destino)
    if (nuevo.getTime() === mes.getTime()) return
    setSentido(nuevo < mes ? 'anterior' : 'siguiente')
    setMes(nuevo)
  }

  const enfocar = (dia: Date) => {
    // Tras cambiar de mes, el botón del día aún no existe hasta el render.
    requestAnimationFrame(() => botones.current.get(claveDia(dia))?.focus())
  }

  const elegir = (dia: Date) => {
    setSeleccionado(dia)
    if (dia.getMonth() !== mes.getMonth()) irAMes(dia)
    setDiaAbierto(dia)
  }

  const alPulsarTecla = (
    evento: KeyboardEvent<HTMLButtonElement>,
    dia: Date,
  ) => {
    const pasos: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    }
    const paso = pasos[evento.key]
    if (paso === undefined) return
    evento.preventDefault()
    const destino = sumarDias(dia, paso)
    setSeleccionado(destino)
    if (destino.getMonth() !== mes.getMonth()) irAMes(destino)
    enfocar(destino)
  }

  const cerrarDia = () => {
    const dia = diaAbierto
    setDiaAbierto(null)
    if (dia) enfocar(dia)
  }

  const audiosDe = (dia: Date): AudioProgramado[] =>
    PROGRAMACIONES.get(claveDia(dia)) ?? []

  // El único día alcanzable con Tab: el elegido si está en este mes; si no,
  // hoy (en el mes actual) o el día 1.
  const diaTabulable =
    seleccionado.getMonth() === mes.getMonth() &&
    seleccionado.getFullYear() === mes.getFullYear()
      ? seleccionado
      : enMesActual
        ? hoy
        : mes

  return (
    <div className="cal">
      <header className="cal__cabecera">
        <h2 className="cal__mes" aria-live="polite">
          <span className="cal__mes-nombre">{nombreMes(mes)}</span>
          <span className="cal__mes-anio">{mes.getFullYear()}</span>
        </h2>

        <div className="cal__navegacion">
          {!enMesActual && (
            <button
              type="button"
              className="cal__hoy"
              onClick={() => {
                irAMes(hoy)
                setSeleccionado(hoy)
              }}
            >
              Hoy
            </button>
          )}
          <button
            type="button"
            className="cal__flecha"
            aria-label="Mes anterior"
            onClick={() => irAMes(inicioDeMes(mes, -1))}
          >
            <IconoChevron direccion="izquierda" />
          </button>
          <button
            type="button"
            className="cal__flecha"
            aria-label="Mes siguiente"
            onClick={() => irAMes(inicioDeMes(mes, 1))}
          >
            <IconoChevron direccion="derecha" />
          </button>
        </div>
      </header>

      <div className="cal__semana" aria-hidden="true">
        {DIAS_SEMANA.map((d) => (
          <span key={d.corto} className="cal__dia-semana">
            {d.corto}
          </span>
        ))}
      </div>

      <div
        key={claveDia(mes)}
        className="cal__rejilla"
        data-sentido={sentido ?? undefined}
        role="group"
        aria-label={`${nombreMes(mes)} de ${mes.getFullYear()}`}
      >
        {dias.map((dia) => {
          const clave = claveDia(dia)
          const audios = audiosDe(dia)
          const esHoy = mismoDia(dia, hoy)
          const esSeleccionado = mismoDia(dia, seleccionado)
          const fuera = dia.getMonth() !== mes.getMonth()
          const etiqueta = [
            fechaLarga(dia),
            esHoy ? 'hoy' : null,
            audios.length === 1
              ? '1 audio programado'
              : audios.length > 1
                ? `${audios.length} audios programados`
                : null,
          ]
            .filter(Boolean)
            .join(', ')

          return (
            <button
              key={clave}
              ref={(boton) => {
                if (boton) botones.current.set(clave, boton)
                else botones.current.delete(clave)
              }}
              type="button"
              className={[
                'cal__dia',
                fuera && 'is-fuera',
                esHoy && 'is-hoy',
                esSeleccionado && 'is-seleccionado',
                audios.length > 0 && 'tiene-audio',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-label={etiqueta}
              aria-current={esHoy ? 'date' : undefined}
              aria-pressed={esSeleccionado}
              // Un solo día tabulable: el resto, con las flechas.
              tabIndex={mismoDia(dia, diaTabulable) ? 0 : -1}
              onClick={() => elegir(dia)}
              onKeyDown={(e) => alPulsarTecla(e, dia)}
            >
              <span className="cal__numero">{dia.getDate()}</span>
              {/* Hueco fijo bajo el número (con o sin icono): así todos los
                  números quedan a la misma altura y el icono nunca los pisa. */}
              <span className="cal__marca" aria-hidden="true">
                {audios.length > 0 && (
                  <IconoOnda className="cal__icono-audio" />
                )}
              </span>
            </button>
          )
        })}
      </div>

      {diaAbierto && (
        <HojaDia
          dia={diaAbierto}
          esPasado={diaAbierto < hoy}
          audios={audiosDe(diaAbierto)}
          onCerrar={cerrarDia}
        />
      )}
    </div>
  )
}

export default CalendarioHabitos
