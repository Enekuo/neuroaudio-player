# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

NeuroAudio es una plataforma de dos lados que conecta a profesionales del bienestar con las personas que escuchan sus audios.

- **Profesionales** (neuropsicólogos, terapeutas, creadores de audios de meditación, hipnosis, reprogramación, subliminales, etc.): suben audios a su cuenta y dan acceso a las personas que ellos eligen. Son el lado principal y más valioso del producto, porque traen a sus propios clientes.
- **Usuarios finales** (adultos, ~25-55 años): tienen su propio espacio para organizar y reproducir audios a su manera. Si un profesional les ha dado acceso, ven además los audios que ese profesional les ha asignado. También existe una vía freemium para usuarios que solo quieren organizar y escuchar sus propios audios, sin estar vinculados a un profesional.

Momento de uso típico: instantes de calma (antes de dormir, al despertar, introspección), a menudo como hábito de fondo — escuchando los mismos audios de forma repetida durante días o semanas. De ahí la repetición programada y el seguimiento de hábitos dentro del producto.

## Product Purpose

Ser el puente entre profesionales del bienestar mental y sus clientes en torno al audio: dar al profesional un canal propio para hacer llegar y gestionar sus audios con las personas que elige, y dar al usuario un espacio limpio, sin anuncios ni distracciones, para recibir, organizar y reproducir esos audios (listas, repetición programada, seguimiento de hábitos).

Éxito = un profesional consigue que sus clientes escuchen sus audios de forma constante en el tiempo, y un usuario mantiene el hábito de escucha sin fricción.

## Positioning

NeuroAudio no es "una app más de meditación" con catálogo cerrado (Calm, Headspace, Insight Timer) ni una web que genera audios al pulsar un botón. Su mecanismo diferencial es ser el canal que conecta a un profesional concreto con sus clientes concretos alrededor del audio de bienestar — algo que las apps de meditación al uso no ofrecen. El catálogo de categorías (meditación, hipnosis, reprogramación, subliminales, mantras, sueño, visualización, motivación) es el vocabulario del producto, no el diferencial en sí.

## Operating Context

- Dos superficies: landing de marketing (Hero, Beneficios, Planes/Precios, FAQ) orientada a captar tanto profesionales como usuarios, y la app (Inicio, Biblioteca, Favoritos, Hábitos, reproductor) para el uso diario ya autenticado.
- Autenticación vía Google/Firebase.
- Uso repetido a lo largo de días/semanas sobre los mismos audios, no descubrimiento constante de contenido nuevo.
- Uso mobile muy relevante (sesiones de escucha antes de dormir/al despertar), junto con un layout de escritorio con sidebar.

## Capabilities and Constraints

- Biblioteca del usuario organizada en "Listas" = carpetas: 8 categorías fijas (Meditación, Hipnosis, Reprogramación, Subliminales, Mantras, Para dormir, Visualización, Motivación) más listas personalizadas; los audios se añaden a cada carpeta por checkbox.
- Reproducción de hasta 2 audios en simultáneo, cada uno con su propio mini-reproductor independiente ("audios conjuntos").
- Sección de Hábitos ligada al hábito de escucha repetida.
- Modelo Free / Premium; la gestión de suscripción está marcada en la propia UI como "próximamente" — constancia pendiente de completar, no inventar flujos de cobro.
- Lado profesional: dar acceso a clientes elegidos, panel de profesional (mencionado en el plan de precios como funcionalidad del plan superior); el alcance completo de ese panel aún no está confirmado como construido en detalle — verificar en código antes de asumir pantallas concretas.
- Ajustes ya incluyen una opción de movimiento reducido (reduced motion), a respetar en cualquier trabajo de animación.

## Brand Commitments

- Nombre fijo: "NeuroAudio" (no se toca).
- Tipografías fijas: Instrument Serif (títulos) + Manrope (texto/UI). Mantenerlas.
- Identidad visual ya asentada: tema oscuro con azul como color principal; sensación de calma, elegancia y profundidad. Nada estridente, agresivo ni infantil.
- Tono de voz: cercano y humano, nunca clínico ni frío, pero transmitiendo seriedad y confianza profesional (salud mental no se frivoliza).
- Mercado: hispanohablante (España y Latinoamérica).
- La interfaz y estructura ya construidas (landing + app, con sus secciones actuales) son la base a respetar: el trabajo de diseño es pulir y armonizar, no rehacer desde cero.

## Evidence on Hand

- Landing ya construida: Hero, TrustedBar, Beneficios, FloatingCards, Planes/Pricing, FAQ, Footer (`src/components/landing/`).
- App ya construida: Inicio/Dashboard, Biblioteca (listas/carpetas, buscador, detalle de lista), Favoritos, Hábitos, reproductor (barra comprimida, pantalla completa, reproductor conjunto), Ajustes (Cuenta, Plan, Privacidad, Uso, General) (`src/features/`).
- Plantillas de categoría con gradientes, iconos e imágenes de tarjeta ya definidos en código (`src/features/library/data/plantillasListas.ts`) y assets reales en `public/images/` (logo, imágenes de tarjetas, hero, personas escuchando).
- No hay testimonios, casos de estudio o cifras de profesionales reales documentados todavía — no fabricar prueba social ni datos de uso.

## Product Principles

1. El profesional es el motor de valor: el diseño debe facilitar su labor y visibilidad antes que tratarlo como un usuario más.
2. El espacio del usuario debe sentirse limpio y sin fricción — sin anuncios ni ruido visual que compita con el audio.
3. El producto acompaña un ritual repetido en el tiempo, no un descubrimiento constante de contenido nuevo: la continuidad y la calma priman sobre la novedad.
4. Seriedad y confianza profesional por delante de la estética: la salud mental no se trata con tono trivial ni infantil.
5. Toda expansión visual debe preservar la identidad ya asentada (oscuro + azul + Instrument Serif/Manrope), no sustituirla.

## Accessibility & Inclusion

Ya existe en Ajustes una opción de movimiento reducido (reduced motion) que cualquier animación nueva debe respetar. No hay otro estándar de accesibilidad específico confirmado más allá de esto.
