import { Link } from 'react-router-dom'
import { textoIdentificacionEmpresa } from '../../config/empresa'
import { rutaLegal } from '../../features/legal/documentos'
import { useReveal } from './useReveal'

function Footer() {
  const cta = useReveal<HTMLAnchorElement>()
  const identificacion = textoIdentificacionEmpresa()

  return (
    <footer className="na-footer">
      <Link ref={cta.ref} to="/login" className={`na-footer__cta ${cta.className}`} style={cta.style}>
        Únete a NeuroAudio gratis
      </Link>

      <div className="na-footer__main">
        <div className="na-footer__cols">
          <div className="na-footer__col">
            <h4>Marca</h4>
            <a href="#">Acerca de</a>
            <a href="#">Trabaja en NeuroAudio</a>
            <a href="#">Blog</a>
            <a href="#">Precios</a>
          </div>
          <div className="na-footer__col">
            <h4>Soporte</h4>
            <a href="#">Ayuda</a>
            <Link to="/contacto">Contáctanos</Link>
            <Link to={rutaLegal('normas')}>Normas de la comunidad</Link>
            <a href="#">Preguntas frecuentes</a>
          </div>
          <div className="na-footer__col">
            <h4>Legal</h4>
            <Link to={rutaLegal('aviso-legal')}>Aviso legal</Link>
            <Link to={rutaLegal('privacidad')}>Política de privacidad</Link>
            <Link to={rutaLegal('cookies')}>Política de cookies</Link>
            <Link to={rutaLegal('terminos')}>Términos del servicio</Link>
            {/* Aún no hay banner de cookies: lleva a su política. */}
            <Link to={rutaLegal('cookies')}>Configurar cookies</Link>
          </div>
        </div>

        <div className="na-footer__social">
          <a href="#" aria-label="X">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 4l16 16M20 4L4 20" />
            </svg>
          </a>
          <a href="#" aria-label="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" />
            </svg>
          </a>
          <a href="#" aria-label="YouTube">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" />
            </svg>
          </a>
          <a href="#" aria-label="TikTok">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </a>
        </div>
      </div>

      <div className="na-footer__bottom">
        <span>
          © 2026 NeuroAudio
          {/* Razón social y NIF: se rellenan en src/config/empresa.ts. */}
          {identificacion && ` · ${identificacion}`}
        </span>
        <a href="#" className="na-footer__lang">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
          </svg>
          Español
        </a>
      </div>
    </footer>
  )
}

export default Footer
