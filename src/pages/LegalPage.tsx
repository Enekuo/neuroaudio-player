import '../components/landing/fuentes'
import '../styles/legal.css'
import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Footer from '../components/landing/Footer'
import NavSimple from '../components/landing/NavSimple'
import {
  buscarDocumentoLegal,
  textoDeDocumento,
} from '../features/legal/documentos'
import { huecosPendientes } from '../features/legal/formato'
import TextoLegal from '../features/legal/TextoLegal'

/**
 * Páginas legales (/legal/aviso-legal, /legal/privacidad, /legal/cookies,
 * /legal/terminos, /legal/normas) con el diseño de la landing. Los textos
 * viven en features/legal/textos.
 */
function LegalPage() {
  const { documento } = useParams()
  const doc = buscarDocumentoLegal(documento)
  const texto = doc ? textoDeDocumento(doc) : ''

  // En local, aviso en la consola si quedan huecos [ ] por rellenar.
  useEffect(() => {
    if (!import.meta.env.DEV || !doc) return
    const huecos = huecosPendientes(texto)
    if (huecos.length > 0)
      console.warn(
        `/legal/${doc.slug}: ${huecos.length} huecos sin rellenar`,
        huecos,
      )
  }, [doc, texto])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [documento])

  useEffect(() => {
    if (!doc) return
    const anterior = document.title
    document.title = `${doc.titulo} · NeuroAudio`
    return () => {
      document.title = anterior
    }
  }, [doc])

  if (!doc) return <Navigate to="/" replace />

  return (
    <div className="landing-root na-legal">
      <NavSimple />

      <main className="na-legal__contenido">
        <p className="na-legal__eyebrow">
          <span className="na-legal__eyebrow-dot" aria-hidden="true" />
          Legal
        </p>
        <h1 className="na-legal__titulo">{doc.titulo}</h1>
        <TextoLegal texto={texto} />
        <Link to="/" className="na-legal__volver">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          Volver al inicio
        </Link>
      </main>

      <Footer />
    </div>
  )
}

export default LegalPage
