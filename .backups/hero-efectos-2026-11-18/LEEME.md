# Copias de los efectos del hero (18-11-2026)

Para poder volver a cómo estaban las animaciones del hero de la landing.

## 1-original-sin-barrido/

Tal como estaba en el commit «6» (4ad89db), antes de tocar los efectos:

- Foto de la derecha: fundido con un 2 % de zoom (900 ms, a los 200 ms) y después flota 8 px.
- Tarjeta «Programa enviado»: sube 12 px a los 300 ms.
- Texto de la izquierda: en cascada, subiendo 18 px desde abajo (na-fade-up de global.css).
- Botones con los nombres antiguos: arriba «Crear cuenta»; en el hero «Empezar gratis» y «Ver cómo funciona».

## 2-barrido-suave/

El estado justo antes de cambiar la entrada del texto de la izquierda:

- El naranja de la pared entra desde la derecha. Empieza asomando un 55 % y termina de abrirse en 1 s, con su curva en el borde que avanza.
- La foto llega encima a los 350 ms, desplazándose 12 px desde la derecha.
- La tarjeta «Programa enviado» sale a los 650 ms.
- Texto de la izquierda: igual que en el original, subiendo desde abajo.
- Botones con los nombres nuevos: «Iniciar sesión» y «Empezar gratis» arriba; «Soy profesional» y «Soy oyente» en el hero.

## 3-barrido-e-izquierda-desde-fuera/

Igual que la 2, pero el texto de la izquierda ya entra desde el borde izquierdo hacia dentro (20 px, en cascada), en espejo con el naranja.

## Cómo volver

Copia los archivos de la carpeta elegida a su sitio:

- `HeroSection.tsx` → `src/components/landing/`
- `landing-hero.css` → `src/styles/`
- `NavSimple.tsx` → `src/components/landing/`

Ojo: en el original los botones tenían los nombres antiguos. Si solo quieres los efectos, copia únicamente `landing-hero.css` y, de `HeroSection.tsx`, el bloque `useReveal` y el `ref` de `na-hero__visual`.
