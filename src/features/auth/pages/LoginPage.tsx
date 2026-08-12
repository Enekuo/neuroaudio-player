import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import GoogleIcon from '../components/GoogleIcon'
import { useAuth } from '../context/AuthContext'
import { signInWithGoogle } from '../services/authService'

function LoginPage() {
  const { user, loading } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!loading && user) {
    return <Navigate to="/app" replace />
  }

  async function handleGoogleSignIn() {
    setError(null)
    setIsSigningIn(true)

    try {
      await signInWithGoogle()
    } catch {
      setError('No se pudo iniciar sesión. Inténtalo de nuevo.')
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-card__brand">
          <span className="login-card__brand-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 6h10" />
              <path d="M6 12h10" />
              <path d="M6 18h6" />
            </svg>
          </span>
          <span>NeuroAudio</span>
        </div>

        <p className="login-card__welcome">
          Sonidos y frecuencias diseñados para tu enfoque, calma y descanso.
        </p>

        <button
          type="button"
          className="login-card__google-button"
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
        >
          <GoogleIcon />
          {isSigningIn ? 'Conectando...' : 'Continuar con Google'}
        </button>

        {error && <p className="login-card__error">{error}</p>}

        <p className="login-card__legal">
          Al continuar, aceptas los Términos de servicio y la Política de privacidad de NeuroAudio.
        </p>
      </div>
    </div>
  )
}

export default LoginPage
