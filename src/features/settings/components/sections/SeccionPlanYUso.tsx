import { useUserPlan } from '../../../dashboard/context/UserPlanContext'
import { useUserAudios } from '../../../library/hooks/useUserAudios'
import { useUserListas } from '../../../library/hooks/useUserListas'
import { formatearEspacio } from '../../../../lib/formato'
import SettingsIcon from '../SettingsIcon'

/** Botón de algo que aún no existe: desactivado y con «Próximamente». */
function BotonProximamente({ texto }: { texto: string }) {
  return (
    <button type="button" className="settings-pu__button" disabled>
      <span className="settings-pu__button-text">{texto}</span>
      <span className="settings-badge">Próximamente</span>
    </button>
  )
}

/**
 * Ajustes → Plan y uso (antes, dos pestañas): tu plan, lo que llevas usado y
 * tus facturas. Solo el diseño: el plan es el de siempre (useUserPlan, hoy
 * «Free»), el uso son las cifras reales de antes (sus audios y listas) y la
 * facturación está vacía. No conecta nada nuevo.
 */
function SeccionPlanYUso() {
  const { userPlan } = useUserPlan()
  const isPremium = userPlan === 'premium'
  const { audios, isLoading, error } = useUserAudios()
  const { listas, isLoading: isLoadingListas, error: errorListas } = useUserListas()

  const totalBytes = audios.reduce((sum, audio) => sum + (audio.size ?? 0), 0)
  const errorUso = error ?? errorListas

  const cifras = [
    { etiqueta: 'Audios guardados', valor: isLoading ? '—' : String(audios.length) },
    { etiqueta: 'Listas creadas', valor: isLoadingListas ? '—' : String(listas.length) },
    {
      etiqueta: 'Espacio usado',
      valor: isLoading ? '—' : formatearEspacio(totalBytes),
      nota: 'Solo audios, sin fotos ni portadas.',
    },
  ]

  return (
    <div className="settings-section">
      <h3>Plan y uso</h3>
      <p className="settings-section__intro">Tu plan, lo que llevas usado y tus facturas.</p>

      <section className="settings-pu__card" aria-labelledby="settings-pu-plan">
        <h4 id="settings-pu-plan" className="settings-pu__title">
          Tu plan
        </h4>
        <div className="settings-pu__plan">
          <p className="settings-pu__plan-name">{isPremium ? 'Premium' : 'Free'}</p>
          <span className="settings-pu__chip">{isPremium ? 'Premium' : 'Gratis'}</span>
        </div>
        <p className="settings-row__hint">Gestión de suscripción próximamente.</p>
        <BotonProximamente texto="Cambiar de plan" />
      </section>

      <section className="settings-pu__card" aria-labelledby="settings-pu-uso">
        <h4 id="settings-pu-uso" className="settings-pu__title">
          Uso
        </h4>
        {errorUso ? (
          <p className="settings-field__error">No se pudo cargar tu uso. Revisa tu conexión.</p>
        ) : (
          <dl className="settings-pu__usage" aria-busy={isLoading || isLoadingListas}>
            {cifras.map((cifra) => (
              <div key={cifra.etiqueta} className="settings-pu__usage-row">
                <dt>{cifra.etiqueta}</dt>
                <dd>{cifra.valor}</dd>
                {cifra.nota ? <p className="settings-row__hint">{cifra.nota}</p> : null}
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="settings-pu__card" aria-labelledby="settings-pu-facturacion">
        <h4 id="settings-pu-facturacion" className="settings-pu__title">
          Facturación
        </h4>
        <div className="settings-pu__payment">
          <span className="settings-pu__payment-icon" aria-hidden="true">
            <SettingsIcon name="tarjeta" />
          </span>
          <p>Todavía no has añadido un método de pago.</p>
        </div>
        <BotonProximamente texto="Cambiar método de pago" />
        <p className="settings-pu__empty">Todavía no tienes facturas.</p>
      </section>
    </div>
  )
}

export default SeccionPlanYUso
