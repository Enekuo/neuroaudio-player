/**
 * Textos de la ayuda del panel profesional: una entrada por cada página del
 * menú izquierdo, con la misma clave que su ruta («dashboard» para la
 * portada; el resto, el segmento de /profesional/{clave}).
 *
 * Todo es texto plano: se pinta tal cual, nunca se interpreta como HTML.
 * Cada sección lleva, en este orden y todo opcional (pero al menos una
 * cosa): `texto` (párrafos), `pasos` (lista numerada) y `nota` (nota final).
 */

export type SeccionAyuda = {
  titulo: string
  /** Uno o varios párrafos. */
  texto?: string[]
  /** Pasos numerados. */
  pasos?: string[]
  /** Nota final, después del texto y los pasos. */
  nota?: string
}

export type AyudaPagina = {
  titulo: string
  /** Una o dos frases que resumen la página. */
  introduccion: string
  secciones: SeccionAyuda[]
}

export const AYUDA: Record<string, AyudaPagina> = {
  dashboard: {
    titulo: 'Dashboard',
    introduccion:
      'El Dashboard es tu página de inicio. Te enseña de un vistazo lo que tienes publicado y te da accesos directos a lo que más se usa.',
    secciones: [
      {
        titulo: 'Qué significan los números',
        texto: [
          '«Audios publicados»: los audios generales y los hechos para una persona que tienes publicados. No cuenta los borradores ni los audios de Biblioteca.',
          '«Oyentes»: las personas con el vínculo activo. Las que están en pausa no cuentan.',
          '«Programas»: tus programas publicados.',
          'Debajo de cada número hay un enlace para ir a su página.',
        ],
      },
      {
        titulo: 'Accesos rápidos',
        texto: [
          '«Subir un audio» te lleva a Biblioteca y abre la ventana para subirlo.',
          '«Crear un programa» abre la ventana de nuevo programa.',
        ],
      },
      {
        titulo: 'Primeros pasos',
        texto: [
          'Es una lista de cuatro tareas para empezar: completar tu perfil, subir tu primer audio, tener tu primer oyente y crear tu primer programa.',
          'Las casillas se marcan solas cuando haces cada cosa. Cuando están las cuatro, la lista desaparece.',
        ],
      },
      {
        titulo: 'Por qué a veces no coinciden',
        texto: [
          '«Primeros pasos» cuenta también los borradores y los audios de Biblioteca. El «Resumen» solo cuenta lo publicado. Por eso puedes tener hecho el paso «Sube tu primer audio» y ver un 0 en «Audios publicados».',
        ],
      },
    ],
  },

  perfil: {
    titulo: 'Perfil',
    introduccion:
      'Tu perfil es tu página de presentación. Solo la ven las personas vinculadas contigo: en su inicio ven tu foto, tu nombre y tu frase, y al abrir tu perfil ven todo lo demás.',
    secciones: [
      {
        titulo: 'Cómo cambiar tu perfil',
        pasos: [
          'Pulsa «Editar perfil».',
          'Cambia lo que quieras.',
          'Pulsa «Guardar cambios».',
        ],
        nota: 'Tus oyentes no ven ningún cambio hasta que guardas. Si sales sin guardar, los cambios se pierden.',
      },
      {
        titulo: 'Cabecera',
        texto: [
          'Es lo primero que ven de ti: tu nombre, una frase corta (hasta 160 caracteres) y el texto «A qué me dedico».',
          'En Instagram, YouTube y TikTok, escribe solo tu nombre de usuario. En la web, escribe el enlace completo.',
        ],
      },
      {
        titulo: 'Fotos',
        texto: [
          'Puedes tener hasta 9 fotos: la principal y 8 más. Deben ser JPG, PNG o WebP, de hasta 5 MB cada una.',
          'La foto principal es la que ven tus oyentes junto a tus audios, recortada en círculo. La primera foto que subes pasa a ser la principal. Para cambiarla, pulsa la estrella «Usar como principal» en otra foto. Con «Ajustar encuadre» puedes recolocarla dentro del círculo.',
          'Si no tienes foto principal, tus oyentes ven tus iniciales.',
        ],
      },
      {
        titulo: 'Secciones',
        texto: [
          'Son las páginas de tu perfil, para contar lo que quieras. Puedes empezar con una plantilla («Acerca de mí», «Cómo trabajo», «Formación», «Preguntas frecuentes», «Otros servicios») o con «Sección en blanco».',
          'Cada sección se puede subir, bajar, ocultar a tus oyentes o borrar. Puedes tener hasta 30.',
        ],
      },
      {
        titulo: 'Para tus oyentes',
        texto: [
          '«Mensaje de bienvenida»: lo ve cada oyente la primera vez que entra.',
          '«Cuándo suelo responder»: se muestra en tu perfil, para que sepan qué esperar.',
        ],
      },
      {
        titulo: 'Ver cómo queda',
        texto: [
          'Pulsa «Vista previa: así te ve un oyente». Verás tu perfil tal como lo ven ellos, en su inicio y al abrirlo. Si estás editando, incluye los cambios que aún no has guardado.',
        ],
      },
    ],
  },

  oyentes: {
    titulo: 'Oyentes',
    introduccion:
      'Aquí ves a las personas vinculadas contigo. Mientras su vínculo esté activo, escuchan tus audios generales y todo lo que les envíes.',
    secciones: [
      {
        titulo: 'La lista',
        texto: [
          'Cuando una persona se vincula contigo, aparece en esta lista. De cada una ves su nombre, su estado («Activo» o «En pausa»), la fecha de entrada y cuántos audios de Biblioteca tiene.',
          'Puedes buscar por nombre o correo y filtrar por estado. Pulsa una fila para abrir la ficha de esa persona.',
        ],
      },
      {
        titulo: 'Pausar y reanudar',
        texto: [
          'En la ficha, «Pausar» hace que esa persona deje de ver todos tus audios y programas. No se borra nada.',
          '«Reanudar» le devuelve el acceso a todo, con su progreso tal como estaba.',
        ],
      },
      {
        titulo: 'Enviarle audios de Biblioteca',
        pasos: [
          'Abre la ficha de la persona.',
          'Pulsa «Enviar desde Biblioteca».',
          'Marca los audios (hasta 20 de una vez) y pulsa «Enviar».',
        ],
        nota: 'Los recibe en su sección «Para ti». Con «Cambiar por…» sustituyes un audio por otro, y con «Retirar» se lo quitas.',
      },
      {
        titulo: 'Crear un audio solo para esa persona',
        texto: [
          'En la ficha, pulsa «Crear audio para esta persona». Ese audio solo lo ve y lo escucha ella.',
        ],
      },
      {
        titulo: 'Nota privada',
        texto: [
          'Sirve para apuntar lo que quieras recordar de esa persona. Solo la ves tú: ella no puede leerla. Escribe y pulsa «Guardar nota».',
        ],
      },
    ],
  },

  'mis-audios': {
    titulo: 'Biblioteca',
    introduccion:
      'La Biblioteca es tu almacén privado de audios. Subes cada audio una sola vez y después se lo envías a quien lo necesite. Nadie ve un audio de Biblioteca hasta que se lo envías.',
    secciones: [
      {
        titulo: 'Subir un audio',
        pasos: [
          'Pulsa «Subir audio».',
          'Arrastra el archivo o pulsa para elegirlo. Vale MP3, M4A o WAV, de hasta 100 MB.',
          'Ponle un título. Si quieres, añade descripción, etiquetas e imagen.',
          'Pulsa «Guardar en Biblioteca».',
        ],
      },
      {
        titulo: 'Enviar un audio a tus oyentes',
        pasos: [
          'Abre el menú del audio y pulsa «Enviar…».',
          'Marca a las personas (hasta 20 de una vez).',
          'Pulsa «Enviar».',
        ],
        nota: 'Lo reciben en su sección «Para ti». En esa misma ventana ves a quién se lo has enviado y puedes retirárselo.',
      },
      {
        titulo: 'Etiquetas',
        texto: [
          'Son palabras cortas para ordenar tus audios por tema, como «sueño» o «calma». Puedes poner hasta 5 por audio. Te sirven para encontrarlos con el buscador y el filtro. Tus oyentes no las ven.',
        ],
      },
      {
        titulo: 'Dónde más puedes usar estos audios',
        texto: [
          'Los programas se montan con audios de Biblioteca.',
          'También puedes publicar un audio de Biblioteca para todos tus oyentes: en la página Audios, pulsa «Añadir desde Biblioteca». No hace falta subirlo otra vez.',
        ],
      },
      {
        titulo: 'Borrar un audio',
        texto: [
          'Al borrar un audio de Biblioteca, se lo quitas a todas las personas que lo tienen. También desaparece de Audios, de tus listas y de tus programas. No se puede deshacer.',
        ],
      },
      {
        titulo: 'Límite',
        texto: [
          'Caben 200 audios. Si la Biblioteca está llena, borra alguno para subir otro.',
        ],
      },
    ],
  },

  audios: {
    titulo: 'Audios',
    introduccion:
      'Aquí están los audios que publicas. Hay dos tipos, cada uno en su pestaña: «Audios generales», que escuchan todos tus oyentes, y «Para una persona», que solo escucha la persona que elijas.',
    secciones: [
      {
        titulo: '¿Audios o Biblioteca?',
        texto: [
          'En Audios se publica: lo que publicas aquí lo ven tus oyentes directamente.',
          'En Biblioteca se guarda en privado, y tú decides a quién se lo envías.',
        ],
      },
      {
        titulo: 'Subir un audio general',
        pasos: [
          'En la pestaña «Audios generales», pulsa «Subir audio».',
          'Arrastra el archivo o pulsa para elegirlo. Vale MP3, M4A o WAV, de hasta 100 MB.',
          'Ponle un título. Si quieres, añade descripción e imagen.',
          'Pulsa «Publicar», o «Guardar borrador» si aún no quieres que se vea.',
        ],
      },
      {
        titulo: 'Borrador y publicado',
        texto: [
          'Un borrador solo lo ves tú. Un audio publicado lo ven tus oyentes con el vínculo activo.',
          'Puedes cambiarlo cuando quieras desde el menú del audio, con «Publicar» o «Despublicar».',
        ],
      },
      {
        titulo: 'Cambiar el orden',
        texto: [
          'En el menú de cada audio, «Subir» y «Bajar» lo mueven en la lista. Tus oyentes los ven en ese mismo orden.',
          'Si tienes puesta una búsqueda o un filtro, quítalos para poder ordenar.',
        ],
      },
      {
        titulo: 'Añadir desde Biblioteca',
        texto: [
          '«Añadir desde Biblioteca» publica aquí audios que ya tienes en tu Biblioteca, sin volver a subirlos.',
          'Es el mismo audio en los dos sitios: si cambias el título, la descripción o la imagen, cambia en ambos.',
          '«Quitar de Audios» lo quita de aquí, pero sigue en tu Biblioteca.',
        ],
      },
      {
        titulo: 'Audios para una persona',
        pasos: [
          'Abre la pestaña «Para una persona» y pulsa «Subir audio».',
          'Elige para quién es.',
          'Sube el archivo, ponle un título y pulsa «Publicar».',
        ],
        nota: 'Solo esa persona lo ve y lo escucha. La persona no se puede cambiar después: si te equivocas, borra el audio y crea otro. Necesitas al menos un oyente con el vínculo activo.',
      },
      {
        titulo: 'Contenido de salud',
        texto: [
          'Marca «Contiene contenido de salud» si el audio habla de diagnósticos, tratamientos o medicación. Tus oyentes verán un aviso junto al audio.',
        ],
      },
      {
        titulo: 'Editar un audio',
        texto: [
          'Puedes cambiar el título, la descripción y la imagen. El archivo de sonido no se puede cambiar: para eso, borra el audio y sube otro.',
        ],
      },
    ],
  },

  listas: {
    titulo: 'Listas y programas',
    introduccion:
      'Son dos formas de agrupar tus audios. Una lista reúne audios para escucharlos libremente. Un programa los ordena en pasos, para seguirlos uno a uno.',
    secciones: [
      {
        titulo: '¿Lista o programa?',
        texto: [
          'Una lista es una colección por tema. Se hace con tus audios generales, los de la página Audios.',
          'Un programa es un recorrido con pasos y un ritmo. Se hace con audios de tu Biblioteca, y cada persona lleva su propio progreso.',
        ],
      },
      {
        titulo: 'Crear una lista',
        pasos: [
          'En la pestaña «Listas», pulsa «Nueva lista».',
          'Elige «Empezar desde una lista ya hecha», con el nombre y la imagen de NeuroAudio, o «Crear desde cero».',
          'Pulsa «Añadir audios» y marca los que quieras.',
          'Pulsa «Publicar», o «Guardar borrador» si aún no quieres que se vea.',
        ],
        nota: 'Una lista admite hasta 100 audios, y puedes tener hasta 30 listas propias. Los audios que estén en borrador no se ven dentro de la lista.',
      },
      {
        titulo: 'Crear un programa',
        pasos: [
          'En la pestaña «Programas», pulsa «Nuevo programa».',
          'Ponle un nombre y, si quieres, una descripción.',
          'Elige cómo se abre y el ritmo recomendado.',
          'Pulsa «Añadir audio de Biblioteca». Cada audio es un paso, hasta 50.',
          'En «¿Para quién es?», elige «Todos mis oyentes» o «Personas concretas».',
          'Pulsa «Crear en borrador».',
          'Abre el programa y pulsa «Publicar».',
        ],
        nota: 'Un programa nuevo siempre se crea en borrador. Nadie lo ve hasta que lo publicas.',
      },
      {
        titulo: 'Cómo se abre un programa',
        texto: [
          '«Libre»: todos los pasos están abiertos desde el principio.',
          '«En orden»: el siguiente paso se abre al completar el anterior.',
          '«Por calendario»: se abre un paso según el ritmo, contando desde el día en que cada persona recibe el programa.',
        ],
      },
      {
        titulo: 'Para quién es un programa',
        texto: [
          '«Todos mis oyentes»: lo ven todos tus oyentes con el vínculo activo, también los que lleguen después. Cada uno empieza desde el paso 1.',
          '«Personas concretas»: solo lo ven las que tú elijas. Después puedes añadir o quitar personas desde la página del programa, con «Añadir persona».',
        ],
      },
      {
        titulo: 'El progreso de cada persona',
        texto: [
          'Cada persona tiene su propio progreso. Se conserva aunque pases el programa a borrador, o aunque se lo quites y se lo vuelvas a dar.',
        ],
      },
      {
        titulo: 'Pasar a borrador o borrar',
        texto: [
          '«Pasar a borrador» lo esconde a tus oyentes hasta que lo vuelvas a publicar. Su progreso se conserva.',
          '«Borrar» lo elimina para todos y no se puede deshacer.',
        ],
      },
    ],
  },

  mensajes: {
    titulo: 'Mensajes',
    introduccion: 'Esta página estará disponible próximamente.',
    secciones: [],
  },

  estadisticas: {
    titulo: 'Estadísticas',
    introduccion: 'Esta página estará disponible próximamente.',
    secciones: [],
  },

  ajustes: {
    titulo: 'Ajustes',
    introduccion:
      'Aquí están los ajustes de tu cuenta y de la aplicación, en cuatro apartados: «General», «Cuenta», «Privacidad» y «Plan y uso».',
    secciones: [
      {
        titulo: 'General',
        texto: [
          '«¿Cómo quieres que te llamemos?» es el nombre con el que te saluda la aplicación. No es el nombre de tu Perfil, que es el que ven tus oyentes.',
          '«Reducir animaciones» quita los movimientos de la aplicación en este dispositivo.',
          'Para cambiar entre modo claro y oscuro, usa el botón de la luna o el sol de la barra de la derecha.',
        ],
      },
      {
        titulo: 'Cuenta',
        texto: [
          'Tu nombre y tu correo vienen de tu cuenta de Google y no se cambian aquí.',
          '«Cerrar sesión» te saca de la aplicación en este dispositivo.',
          '«Eliminar cuenta» todavía no está disponible desde aquí. Si quieres eliminar tu cuenta, escríbenos a olondoweb@gmail.com.',
        ],
      },
      {
        titulo: 'Privacidad',
        texto: [
          'Los documentos legales de NeuroAudio (términos, política de privacidad y política de cookies) están en la web de NeuroAudio, al pie de la página.',
        ],
      },
      {
        titulo: 'Plan y uso',
        texto: [
          'Tu plan actual es «Free», gratuito. La gestión de planes y la facturación estarán disponibles próximamente.',
          'En «Uso» ves cuántos audios tienes guardados, cuántas listas has creado y cuánto espacio ocupan tus audios.',
        ],
      },
    ],
  },
}
