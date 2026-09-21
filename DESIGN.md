---
name: NeuroAudio
description: Plataforma oscura de audio de bienestar que conecta profesionales con sus clientes
colors:
  bg-void: "#000208"
  surface: "#24262A"
  surface-strong: "#141517"
  surface-soft: "#1B1C1F"
  text: "#F0F1F3"
  text-secondary: "#9A9B9F"
  text-muted: "#6A6B6F"
  border: "#2A2A2E"
  border-soft: "rgba(255, 255, 255, 0.08)"
  signal-blue: "#0047ff"
  signal-blue-soft: "#2680eb"
  signal-blue-light: "#3b9eff"
  signal-blue-deep: "#1b4d78"
typography:
  display:
    fontFamily: "'Instrument Serif', Georgia, serif"
    fontSize: "clamp(38px, 5.5vw, 64px)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "normal"
  body:
    fontFamily: "'Manrope', system-ui, sans-serif"
    fontSize: "16.5px"
    fontWeight: 400
    lineHeight: 1.65
  ui:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 600
    letterSpacing: "0.16em"
rounded:
  xs: "6px"
  sm: "8px"
  md: "10px"
  lg: "14px"
  xl: "16px"
  2xl: "22px"
  pill: "999px"
  circle: "50%"
components:
  button-primary:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.text}"
    rounded: "{rounded.xs}"
    padding: "0.8rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.signal-blue-soft}"
    textColor: "{colors.text}"
    rounded: "{rounded.xs}"
  button-pill-landing:
    backgroundColor: "{colors.signal-blue-light}"
    textColor: "#05070d"
    rounded: "{rounded.pill}"
    padding: "14px 26px"
  card-surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "1.2rem"
  badge-plan-free:
    backgroundColor: "rgba(255, 255, 255, 0.08)"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.pill}"
    padding: "0.35rem 0.8rem"
  badge-plan-premium:
    backgroundColor: "{colors.signal-blue-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "0.35rem 0.8rem"
  nav-bottom-link:
    textColor: "#6b6e76"
    padding: "0.25rem 0.2rem"
  nav-bottom-link-active:
    textColor: "#ffffff"
---

# Design System: NeuroAudio

## Overview

**Creative North Star: "El Santuario Nocturno"**

NeuroAudio vive en una oscuridad casi total — fondos entre `#000208` y `#01040f` que no se distinguen del negro a simple vista — sobre la que solo un azul eléctrico (`#0047ff` / `#2680eb`) se permite emitir luz. La metáfora es un santuario nocturno: un refugio privado para los momentos de calma (antes de dormir, al despertar, en introspección), no una sala de espera clínica ni un parque de atracciones de bienestar. La oscuridad transmite intimidad y recogimiento; el azul, escaso y puntual, transmite que alguien fiable está al mando — el profesional detrás del audio, la app detrás del hábito.

Ese matiz importa: el santuario es acogedor pero nunca ingenuo. NeuroAudio conecta a profesionales reales (neuropsicólogos, terapeutas) con sus clientes, así que la superficie debe leerse tan seria y confiable como cálida. Las tarjetas de categoría (`template-card`) resumen la filosofía entera: fondo casi negro, un icono con un halo azul suave (`filter: drop-shadow(...)`), y una imagen de fondo velada por un degradado oscuro — nunca la imagen a pleno brillo. Todo el sistema está construido para que el ojo descanse y solo se active cuando algo importa de verdad.

El azul es un faro, no una inundación: aparece en botones, iconos activos, anillos de selección y estados de foco, pero casi nunca cubre superficies grandes. Las superficies están en calma por defecto — bordes de 1px casi invisibles, sombras discretas — y solo responden con resplandor o elevación cuando el usuario interactúa (hover, selección, foco, reproducción activa). Nada grita; todo guía.

**Key Characteristics:**
- Fondo casi negro (`#000208`–`#01040f`) como lienzo por defecto en toda la app.
- Un único azul-faro (`#0047ff`/`#2680eb`) que aparece con moderación deliberada.
- Tarjetas y controles planos en reposo; el resplandor/la sombra son una respuesta al estado, no un adorno permanente.
- Formas muy redondeadas (pill `999px` para botones y chips, círculo para avatares) conviviendo con radios medios (12–24px) en tarjetas.
- Instrument Serif itálica reservada para momentos de calidez puntual (titulares de la landing, el saludo "Hola, [nombre]"); Inter y Manrope llevan el peso funcional del texto.

## Colors

Paleta casi monocroma: negro-azulado como base, grises neutros para jerarquía de texto, y un único acento eléctrico que hace de faro.

### Primary
- **Azul Faro** (`#0047ff`, `signal-blue`): el acento de acción — botones primarios, foco de teclado, glows de estado activo (mini-reproductor, indicadores). Aparece en superficies pequeñas y puntuales, nunca como fondo de sección.
- **Azul Faro Suave** (`#2680eb`, `signal-blue-soft`): variante para iconos tintados, anillos de selección (`box-shadow` de 3px) y bordes activos — el mismo faro, a media intensidad, para contextos donde el faro puro sería demasiado.

### Secondary
- **Azul Claro de Degradado** (`#3b9eff`, `signal-blue-light`) y **Azul Profundo de Degradado** (`#1b4d78`, `signal-blue-deep`): pareja usada en gradientes de 135° para las superficies "premium" (insignia de plan, botones destacados de la landing) — comunican valor añadido sin salirse de la familia de azules.

### Neutral
- **Vacío** (`#000208`, `bg-void`): fondo base de toda la app (root, body, shell).
- **Superficie** (`#24262A`, `surface`): fondo de tarjetas y paneles elevados (p. ej. tarjeta de plan en Ajustes).
- **Superficie Fuerte** (`#141517`, `surface-strong`) y **Superficie Suave** (`#1B1C1F`, `surface-soft`): variantes de profundidad para paneles secundarios y modales.
- **Texto** (`#F0F1F3`, `text`), **Texto Secundario** (`#9A9B9F`, `text-secondary`), **Texto Apagado** (`#6A6B6F`, `text-muted`): jerarquía de lectura sobre fondo oscuro.
- **Borde** (`#2A2A2E`, `border`) y **Borde Suave** (`rgba(255,255,255,0.08)`, `border-soft`): divisores casi invisibles; la separación la da el espacio y el contraste tonal, no la línea.

### Named Rules
**La Regla del Faro.** El azul ocupa idealmente menos del 10% de cualquier pantalla y solo en elementos accionables o activos. Si una sección entera se siente azul, se ha roto la regla — el faro deja de guiar si ilumina todo.

## Typography

**Display Font:** Instrument Serif (con Georgia como fallback)
**Body Font (marketing):** Manrope (con system-ui de fallback)
**UI Font (producto):** Inter (con system-ui/-apple-system de fallback)

**Character:** Instrument Serif en itálica aporta el único momento "hablado" y cálido del sistema — una voz humana entre tanta interfaz. Manrope da a la landing un tono editorial y cercano para vender la propuesta; Inter es la workhorse silenciosa del producto en uso diario (Biblioteca, Ajustes, navegación), optimizada para legibilidad en pantallas pequeñas antes que para personalidad.

### Hierarchy
- **Display** (400, `clamp(38px, 5.5vw, 64px)`, line-height 1.1): titulares de la landing (`na-hero__title`) e instantes puntuales dentro de la app, como el saludo "Hola, [nombre]" en móvil. Itálica cuando se usa dentro de la app; en la landing puede llevar un `<em>` en Azul Faro Claro para enfatizar una palabra.
- **Stat/Headline serif** (400, 22px): valores destacados tipo `na-stat__value`, mismo Instrument Serif a menor escala.
- **Body** (400, 16.5px, line-height 1.65, máx. ~46ch): párrafos de venta en la landing, en Manrope.
- **UI body** (400-600, 14-16px, line-height 1.5): texto de producto — listas, tarjetas, formularios — en Inter.
- **Label/Eyebrow** (600, 10.5-13px, letter-spacing 0.06-0.16em, mayúsculas): etiquetas de sección, badges de plan, "eyebrow" sobre titulares de landing.

### Named Rules
**La Regla del Susurro Serif.** Instrument Serif itálica se reserva para un máximo de un elemento por pantalla (el titular o el saludo). Si aparece dos veces en la misma vista, ha dejado de ser un momento especial.

## Layout

Dos grafías espaciales conviven:

- **App de producto:** en escritorio, grid de dos columnas (`app-shell`) con sidebar fija de 220-280px y área de contenido fluida (`minmax(0, 1fr)`). En móvil, la sidebar desaparece y se sustituye por una barra de navegación inferior fija (`--bottomnav-h: 72px` + `env(safe-area-inset-bottom)`), con el área de contenido ocupando `calc(100dvh - var(--bottomnav-h))`. Densidad media: tarjetas de categoría en grid de 3 columnas, listas verticales con separadores sutiles.
- **Landing de marketing:** ritmo vertical generoso entre secciones (`gap: 2rem` en `.landing-page__content`), padding horizontal fluido vía `clamp(20px, 4vw, 48px)` para adaptarse sin puntos de quiebre bruscos. El hero usa una imagen de fondo a sangre completa (`fondo_hero.png`) con una ilustración lateral enmascarada que desaparece bajo 860px.

## Elevation & Depth

Sistema **plano en reposo, luminoso como respuesta**. Las superficies no llevan sombra por defecto — tarjetas, sidebar y bottom-nav se apoyan en un borde de 1px casi invisible (`border-soft`) para separarse del fondo, no en sombra ambiental. La profundidad aparece únicamente como reacción a estado: selección, hover, foco o reproducción activa.

### Shadow Vocabulary
- **Resplandor de selección** (`box-shadow: 0 0 0 3px rgba(38, 128, 235, 0.22)`): anillo alrededor de una tarjeta de plantilla o control al marcarlo como seleccionado.
- **Halo de icono activo** (`filter: drop-shadow(0 0 5px rgba(38, 128, 235, 0.4))` / `box-shadow: 0 0 8-22px rgba(43, 123, 255, 0.5-0.8)`): el glow puntual sobre iconos y puntos de estado activos (reproducción, indicador "en vivo").
- **Elevación de superposición** (`--shadow: 0 12px 30px rgba(0,0,0,0.23)`, `--shadow-strong: 0 24px 60px rgba(0,0,0,0.32)`): reservada a elementos que se despegan del flujo — modales, menús flotantes, mini-reproductor comprimido.
- **Sombra de tarjeta clara (landing)** (`0 16px 35px rgba(7, 43, 75, 0.08)`): sombra azulada muy suave bajo tarjetas sobre fondo claro dentro de secciones de venta.

### Named Rules
**La Regla del Brillo Reactivo.** Ninguna superficie brilla en reposo. Si un elemento tiene glow o sombra visible sin que el usuario esté interactuando con él o esté en reproducción activa, es una desviación del sistema.

## Shapes

Dos familias de forma conviven a propósito: **pill** (`999px`) para todo lo accionable — botones primarios y secundarios, badges de plan, chips — y **círculo** (`50%`) para identidad (avatares, botones de icono aislados, puntos de estado). Las superficies de contenido (tarjetas, paneles, modales) usan una escala de radios medios: `6-10px` para controles compactos e inputs, `14-16px` para tarjetas y paneles estándar, `22-24px` para tarjetas destacadas del dashboard y modales grandes. Los bordes son casi siempre de 1px y de muy baja opacidad; el volumen lo da el radio y el espacio, no el trazo.

## Components

### Buttons
- **Shape:** primario de producto en radio pequeño (`6px`, `button-primary`); primario de landing en pill completo (`999px`, `button-pill-landing`).
- **Primary (producto):** fondo Azul Faro (`#0047ff`), texto claro (`text`), padding `0.8rem 1rem`. Usado en CTAs dentro de la app (p. ej. estado vacío de biblioteca).
- **Primary (landing):** fondo Azul Faro Claro (`#3461ff`/`signal-blue-light`), texto oscuro (`#05070d`) para máximo contraste sobre el acento brillante, pill, padding `14px 26px`, peso 700.
- **Hover/Focus:** el primario de producto vira a Azul Faro Suave (`#2680eb`); el foco de teclado global usa un anillo de 2px en `#0047ff` con `outline-offset: 2px`.
- **Secondary/Ghost:** fondo transparente, borde de 1px en un tono azul-gris apagado (`--na-btn-outline`), texto claro — usado como CTA secundaria junto a la primaria.

### Chips / Badges
- **Plan Free:** fondo `rgba(255,255,255,0.08)`, texto `text-secondary`, pill.
- **Plan Premium:** degradado 135° de Azul Profundo a Azul Claro (`signal-blue-deep` → `signal-blue-light`), texto blanco, pill — el único badge que se permite un fondo de color completo, reservado para comunicar valor.

### Cards / Containers
- **Corner Style:** `14px` en tarjetas de panel estándar (p. ej. tarjeta de plan en Ajustes); `13-22px` en tarjetas de categoría/dashboard.
- **Background:** `surface` (`#24262A`) para paneles de Ajustes; casi negro (`#01040f`) para las tarjetas de categoría de Biblioteca, reforzando la sensación de "vacío con un punto de luz".
- **Shadow Strategy:** ninguna en reposo (ver Elevation & Depth); anillo de selección o hover de borde como única respuesta.
- **Border:** 1px, `rgba(255,255,255,0.07-0.08)`.
- **Internal Padding:** `1.1-1.2rem` en tarjetas de panel; `17-18px` en tarjetas de categoría.

### Navigation
- **Bottom nav (móvil):** fondo negro puro (`#000000`), altura fija `72px` + `safe-area-inset-bottom`, iconos y etiquetas en gris apagado (`#6b6e76`) en reposo. El enlace activo pasa a blanco puro (`#ffffff`); en Inicio y Favoritos, el icono además se rellena de blanco por dentro (no solo el trazo), como único caso de icono "sólido" del sistema — el resto de iconos permanecen siempre de contorno.
- **Sidebar (escritorio):** fondo `#090f1a` con una textura de ruido sutil superpuesta (`mix-blend-mode: overlay`, opacidad 4.5%) que añade grano sin romper el plano.

### Template Card (componente insignia)
La tarjeta de categoría de Biblioteca (`template-card`) es la pieza que mejor resume el sistema: fondo casi negro (`#01040f`), icono con halo azul (`drop-shadow` de `rgba(38,128,235,0.4)`), imagen de fondo opcional velada por un degradado oscuro de arriba a abajo, y un anillo de selección azul suave al marcarla. Cualquier tarjeta nueva de categoría o "conjunto de audios" debería heredar esta receta antes de inventar una nueva.

## Do's and Don'ts

### Do:
- **Do** mantener el fondo casi negro (`#000208`–`#01040f`) como base por defecto en cualquier pantalla nueva de producto.
- **Do** reservar el Azul Faro (`#0047ff`/`#2680eb`) para elementos accionables o de estado activo — botones, iconos seleccionados, indicadores de reproducción.
- **Do** dejar las superficies planas en reposo y añadir resplandor/sombra solo como respuesta a hover, selección o foco.
- **Do** usar pill (`999px`) para todo lo accionable (botones, badges, chips) y círculo (`50%`) para avatares/iconos aislados.
- **Do** limitar Instrument Serif itálica a un único momento por pantalla (titular o saludo), nunca como tipografía de cuerpo.
- **Do** respetar la preferencia de movimiento reducido (`.reduce-motion`) ya implementada en cualquier animación nueva.

### Don't:
- **Don't** usar el Azul Faro como color de fondo de secciones completas — deja de ser faro si se convierte en fondo.
- **Don't** añadir sombras o glows permanentes a tarjetas o botones en estado de reposo.
- **Don't** introducir un segundo tono de acento (verde, morado, etc.) fuera de los degradados de "premium" ya establecidos.
- **Don't** usar un tono de voz clínico, frío o de app de salud genérica: la superficie debe sentirse como un santuario íntimo pero fiable, nunca como una sala de espera.
- **Don't** rehacer la estructura ya construida (landing + Inicio/Biblioteca/Favoritos/Hábitos/reproductor) — el trabajo de diseño es pulir y armonizar sobre lo existente, no sustituirlo.
