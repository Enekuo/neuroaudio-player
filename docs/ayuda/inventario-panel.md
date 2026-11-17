# Inventario del panel profesional

Qué hay de verdad hoy (14 de noviembre de 2026) en cada página del panel profesional, sacado del código. Sirve de base para escribir la ayuda.

- Los textos entre comillas «así» son exactamente los que aparecen en pantalla.
- Donde pone {nombre}, {título} o {N}, en pantalla sale el dato real.
- Lo que no funciona todavía o está a medias se dice claramente, marcado con **A medias**.
- «Oyente» o «persona» es alguien vinculado al profesional. El vínculo puede estar **activo** o **en pausa**.

---

## Elementos comunes a todo el panel

### Menú izquierdo

- Arriba, el logotipo de NeuroAudio; lleva al Dashboard.
- Páginas, por este orden: Dashboard, Perfil, Oyentes, Biblioteca, Audios, Listas y programas, Mensajes, Estadísticas, Ajustes.
- Abajo del todo: «Panel del oyente» (tooltip «Ir al panel del oyente»). Lleva a la app del oyente.
- En pantallas estrechas el menú se esconde. Se abre con el botón de menú de la barra superior, que también muestra el nombre de la página actual.

### Barra de utilidades (derecha en pantallas anchas; en la barra superior en estrechas)

- **Avatar:** la foto de la cuenta o la inicial del nombre. Al pasar el ratón, muestra el nombre. No tiene menú ni hace nada al pulsarlo.
- **Ayuda:** abre un panel con un desplegable de páginas y la ayuda de cada una. Mensajes y Estadísticas solo dicen «Esta página estará disponible próximamente.».
- **Soporte:** abre un panel más ancho (hasta la mitad de la pantalla) con dos pestañas, «Necesito ayuda con un problema» y «Enviar comentarios», cada una con su formulario. **A medias:** los mensajes no se guardan hasta publicar sus reglas, y todavía no llegan por correo.
- **Luna / sol:** cambia el panel entre modo claro y modo oscuro. Se recuerda en ese navegador.

### Arriba del contenido (pantallas anchas)

Un rótulo fijo, «Panel profesional».

---

## Dashboard

**Para qué sirve:** resumen de un vistazo de lo que tiene el profesional y accesos a lo más habitual.

### Lo que se ve

- **Saludo:** «Bienvenido, {nombre}» y debajo «Esto es lo que tienes hoy en tu panel.».
  - El nombre sale del Perfil. Si no hay, de la cuenta.
  - Si no hay ninguno, solo «Bienvenido».
- **«Resumen»:** tres tarjetas con un número cada una.
  - **«Audios publicados»** — «Los audios que compartes con tus oyentes.»
    - Cuenta los audios generales y los audios para una persona que están publicados.
    - **No cuenta** los de Biblioteca ni los borradores.
    - Enlace «Ver audios →» a Audios.
  - **«Oyentes»** — «Las personas que tienen acceso a tus audios.»
    - Cuenta solo los vínculos activos (los que están en pausa no cuentan).
    - Enlace «Ver oyentes →» a Oyentes.
  - **«Programas»** — «Tus programas paso a paso publicados.»
    - Cuenta solo los programas publicados.
    - Enlace «Ver programas →» a la pestaña Programas de Listas y programas.
- **«Accesos rápidos»:**
  - «Subir un audio»: lleva a Biblioteca y abre directamente la ventana para subir un audio. Si la Biblioteca está llena, solo lleva a la página.
  - «Crear un programa»: lleva a Programas y abre directamente la ventana de nuevo programa.
- **«Primeros pasos»:** lista de 4 pasos con casillas que se marcan solas (no se pueden pulsar), una barra de progreso y «{N} de 4 completados». Desaparece cuando están los 4 hechos.
  1. «Completa tu perfil» — se marca cuando el perfil tiene nombre, frase corta, «A qué me dedico» y foto principal. Botón «Completar» → Perfil.
  2. «Sube tu primer audio» — se marca con cualquier audio, también de Biblioteca o en borrador. Botón «Subir» → Biblioteca con la ventana de subida abierta.
  3. «Invita a tu primer oyente» — se marca cuando existe algún vínculo, activo o en pausa. **No tiene botón**: hoy no se puede invitar a nadie desde el panel (ver Oyentes).
  4. «Crea tu primer programa» — se marca con cualquier programa, también en borrador. Botón «Crear» → ventana de nuevo programa.

### Mensajes

- Mientras carga, los números aparecen como barras grises.
- Si falla: «No se pudo cargar el resumen.» con el botón «Reintentar».

### Puede confundir

- «Audios publicados» no incluye la Biblioteca, aunque «Sube tu primer audio» sí cuenta un audio subido a Biblioteca.
- «Primeros pasos» cuenta borradores; las tarjetas del Resumen, no.

---

## Perfil

**Para qué sirve:** preparar la página de presentación que ven los oyentes vinculados.

Subtítulo de la página: «Solo lo ven las personas que tú invitas a NeuroAudio.»

### Vista normal (sin editar)

- **Cabecera:**
  - foto principal (en círculo), nombre, frase y enlaces a redes como botones;
  - si se ha elegido, «Suelo responder {el mismo día / en 1 o 2 días / en 3 a 5 días}».
- **Botones:** «Editar perfil» y «Vista previa: así te ve un oyente».
- **Si falta algo**, aparece un aviso: «Para que tus oyentes te conozcan mejor, te falta añadir…» seguido de lo que falte entre:
  - «una foto principal»;
  - «tu nombre»;
  - «una frase corta»;
  - «alguna sección (por ejemplo «Acerca de mí»)»;
  - «un mensaje de bienvenida».
- **Tarjetas:**
  - «A qué me dedico»;
  - «Fotos» (la principal lleva la etiqueta «Principal»);
  - una por cada sección (las ocultas llevan «Oculta»; sin título se llaman «Sección sin título»);
  - «Mensaje de bienvenida».

### Editar perfil

- Al pulsar «Editar perfil», el título pasa a «Editar perfil» y arriba aparecen «Vista previa», «Cancelar» y «Guardar cambios». «Guardar cambios» solo se activa cuando hay cambios.
- **Nada llega a los oyentes hasta «Guardar cambios».** Al guardar sale «Cambios guardados. Tus oyentes ya los ven.».
- Mientras hay cambios sin guardar, abajo se queda fija una barra: «Tienes cambios sin guardar.» con «Descartar» y «Guardar cambios».

**Bloque «Cabecera» — «Lo primero que ven tus oyentes de ti.»**

- **«Nombre»:** hasta 80 caracteres.
- **«Frase corta»:**
  - hasta 160 caracteres, con contador «{N} de 160 caracteres»;
  - ejemplo en el campo: «Por ejemplo: Te acompaño a dormir mejor y vivir con más calma.».
- **«A qué me dedico»:** texto largo, hasta 4.000 caracteres.
- **Web, Instagram, YouTube, TikTok:**
  - En las redes se escribe **solo el nombre de usuario** («Solo tu nombre de usuario»). Si se pega el enlace completo o «@usuario», al salir del campo se deja solo el usuario.
  - La web admite el enlace; si no lleva «https://», se añade.
  - Errores posibles (al salir del campo o al guardar):
    - «La web no es un enlace válido.»
    - «La web debe empezar por https://.»
    - «La web es demasiado larga.»
    - «Escribe solo tu nombre de usuario de {red}.»
    - «Ese enlace no es de {red}. Escribe solo tu nombre de usuario.»
    - «Ese enlace no es de un perfil. Escribe solo tu nombre de usuario.»
    - «El nombre de usuario solo puede tener letras, números, punto, guion y guion bajo.»
    - «El nombre de usuario es demasiado largo.»

**Bloque «Fotos»**

- Texto: «La foto principal es la que ven tus oyentes en su inicio, junto a sus audios y en las listas, recortada en círculo. JPG, PNG o WebP de hasta 5 MB.»
- **Límites:** 9 fotos en total (la principal y 8 más). JPG, PNG o WebP, hasta 5 MB cada una.
- **«Subir fotos»:**
  - permite elegir varias a la vez;
  - si no queda sitio, el botón se desactiva; si se eligen más de las que caben: «Solo caben 9 fotos (la principal y 8 más). Algunas no se han subido.».
- **La primera vez (sin foto principal):** la primera foto válida se abre en «Ajustar foto» para recortarla en círculo y pasa a ser la principal. Si se cancela, esa foto no se sube. Las demás del lote se suben como adicionales.
- **En cada foto:**
  - **Principal:** etiqueta «Principal» y botón «Ajustar encuadre».
  - **Las demás:** estrella «Usar como principal», que abre «Ajustar foto» antes de convertirla en principal.
  - Flechas «Mover antes» / «Mover después» para ordenar.
  - «Quitar foto». Si se quita la principal, no se elige otra sola: el perfil se queda sin principal hasta que se elija una.
  - Campo «Texto alternativo» (opcional, 200 caracteres), para lectores de pantalla.
- **Avisos:**
  - Sin fotos: «Aún no has subido fotos. Sin foto principal, tus oyentes verán tus iniciales.».
  - Con fotos pero sin principal: «Elige tu foto principal con la estrella. Sin ella, tus oyentes verán tus iniciales.».
- **Errores**, cada uno precedido del nombre del archivo:
  - «La foto pesa más de 5 MB.»
  - «El archivo no es una imagen JPG, PNG o WebP.»
  - «No se pudo leer la imagen. ¿Está dañada?»
  - «La foto tiene demasiados píxeles.»
  - «Has subido muchas fotos seguidas. Espera un minuto y vuelve a intentarlo.»
  - «No se pudo subir la foto ahora. Espera un minuto y vuelve a intentarlo.»
  - «No se pudo subir. Inténtalo de nuevo.»
  - «No se pudo abrir la foto para ajustarla. Inténtalo de nuevo.»
- Las fotos se suben al momento, pero **no cuentan hasta «Guardar cambios»**. Si se descarta la edición, las subidas en esa edición se borran.

**Ventana «Ajustar foto»**

- Texto: «Lo que queda dentro del círculo es tu foto de perfil. Arrastra para moverla y usa el zoom para acercarla. Con teclado: flechas para mover, + y − para el zoom.»
- **Controles:** «Alejar», barra de zoom, «Acercar», «Cancelar» y «Guardar foto».
- **Errores:** «No se pudo abrir la foto.» y «No se pudo guardar la foto. Inténtalo de nuevo.».

**Bloque «Secciones» — «Las páginas de tu perfil: lo que quieras contar a tus oyentes.»**

- Sin secciones: «Las secciones son las páginas de tu perfil. Puedes empezar con una de estas o crear la tuya.».
- **Para añadir:**
  - botones con plantillas: «Acerca de mí», «Cómo trabajo», «Formación», «Preguntas frecuentes», «Otros servicios» (cada plantilla desaparece cuando ya se ha usado);
  - «Sección en blanco».
- **Cada sección:**
  - «Título de la sección» (120 caracteres);
  - «Texto» (10.000 caracteres; «Texto sencillo: los saltos de línea se respetan.»);
  - «Fotos de esta sección (opcional)»: se marcan fotos del propio perfil.
- **Botones de cada sección:** «Subir sección», «Bajar sección», «Ocultar a tus oyentes» / «Mostrar a tus oyentes» y «Borrar sección». Una sección oculta muestra «Oculta: tus oyentes no la ven».
- **Límite:** 30 secciones. Al llegar, los botones de añadir se desactivan.

**Bloque «Para tus oyentes»**

- **«Mensaje de bienvenida»:** hasta 4.000 caracteres. Ayuda del campo: «Lo ve el oyente la primera vez que entra.».
- **«Cuándo suelo responder»:**
  - opciones: «Sin indicar», «El mismo día», «En 1 o 2 días», «En 3 a 5 días»;
  - ayuda: «Se muestra en tu perfil para que sepan qué esperar.».

**Al guardar, si algo no vale**

- Arriba: «Revisa los campos marcados en rojo.».
- En cada campo, su error. Por ejemplo:
  - «Máximo 80 caracteres.»
  - «Máximo 9 fotos.»
  - «El texto alternativo admite 200 caracteres.»
  - «Máximo 30 secciones.»
  - «Cada sección admite un título de 120 caracteres y un texto de 10000.»
- Si falla la conexión: «No se pudieron guardar los cambios. Revisa tu conexión e inténtalo de nuevo.».

**Salir con cambios sin guardar**

- Al pulsar «Cancelar», cualquier enlace del panel o «Panel del oyente» sale el aviso «¿Salir sin guardar?»:
  - texto: «Tienes cambios en tu perfil que todavía no has guardado. Si sales ahora, se perderán.»;
  - botones: «Salir sin guardar» y «Seguir editando».
- Al cerrar o recargar la pestaña, avisa el propio navegador.
- **No avisa** si se usa el botón «atrás» del navegador.

### Vista previa

- Ventana «Así te ve un oyente», con dos partes: «En su inicio» y «Al abrir tu perfil».
- Si se abre mientras se edita, añade «Incluye los cambios que aún no has guardado.».

### Errores de carga

- «No se pudo cargar tu perfil. Revisa tu conexión y vuelve a entrar en la página.»
- Sin sesión: «Inicia sesión para editar tu perfil.»

### Qué ve el oyente

El perfil guardado, en su inicio (foto principal, nombre, frase) y al abrirlo (secciones visibles, enlaces, bienvenida, tiempo de respuesta). Sin foto principal, ve las iniciales.

---

## Oyentes

**Para qué sirve:** ver a las personas vinculadas, su estado y lo que tiene cada una.

Subtítulo: «Las personas que te siguen. Mientras su vínculo esté activo, ven tus audios generales y los que les envías.»

### Lista

- **Buscador** «Buscar por nombre o correo» y filtro «Estado»: «Todos», «Activos», «En pausa».
- **Recuento:** «{N} oyentes · {N} activos».
- **Cada fila:**
  - nombre (si no lo hay, «Oyente» y cuatro caracteres de su identificador) y su estado, «Activo» o «En pausa»;
  - «Fecha de entrada»;
  - «Audios de Biblioteca que tiene».
  - Pulsar la fila abre su ficha.
- **Vacía:** «Todavía no tienes oyentes» / «Cuando alguien se una a ti, aparecerá aquí.».
- **Sin resultados:** «Nadie coincide con la búsqueda.».
- **Límite:** muestra 500 como mucho. A partir de ahí: «El panel muestra como mucho 500 oyentes a la vez. Si tienes más, algunos no aparecen en esta lista.».
- **Errores:** «No se pudieron cargar tus oyentes. Revisa tu conexión.» con «Reintentar».

**A medias:** no hay ningún botón para invitar o añadir oyentes. Los vínculos hoy no se crean desde la app. Tampoco hay forma de borrar un vínculo, solo de pausarlo.

### Ficha de una persona

Enlace «Volver a tus oyentes». Arriba: nombre, estado, «Fecha de entrada» y, si está en pausa, «En pausa desde {fecha}».

**Pausar / Reanudar**

- **«Pausar»** pide confirmación:
  - título: «¿Pausar a {nombre}?»;
  - texto: «Dejará de ver tus audios (los generales, los de Biblioteca y los hechos para esta persona) hasta que reanudes su vínculo. No se borra nada: al reanudar, lo vuelve a ver todo.»;
  - botones: «Cancelar» y «Pausar».
  - Después: «{nombre} está en pausa. Ya no ve tus audios.».
- **«Reanudar»** no pide confirmación. Después: «El vínculo con {nombre} vuelve a estar activo. Ya ve tus audios otra vez.».
- **Error:** «No se pudo cambiar el estado. Inténtalo de nuevo.».

**«Audios de Biblioteca»** (los audios de Biblioteca que se le han enviado)

- **«Enviar desde Biblioteca»** abre una ventana para elegir audios:
  - buscador «Buscar por título o etiqueta» y filtro por etiqueta;
  - como mucho 20 de una vez («Puedes enviar 20 audios de una vez.»);
  - el botón muestra cuántos se van a enviar, «Enviar ({N})».
  - Si la Biblioteca está vacía: «Aún no tienes audios en Biblioteca. Sube el primero y podrás enviárselo.».
  - Si ya los tiene todos: «Ya tiene todos los audios de Biblioteca.».
- **Al enviar:**
  - «Le has enviado {títulos}. Ya lo tiene en «Para ti».» (o «Le has enviado {N} audios. Ya los tiene en «Para ti».»);
  - el oyente lo ve en su sección «Para ti».
- **Cada audio enviado:**
  - muestra «Enviado el {fecha}»;
  - **«Cambiar por…»:** elegir otro audio que lo sustituye. Primero se envía el nuevo y después se retira el viejo. Mensajes:
    - «Cambiado: ahora tiene «{nuevo}» en lugar de «{viejo}».»;
    - si falla: «No se pudo enviar «{nuevo}», así que sigue teniendo «{viejo}»…» o «Le has enviado «{nuevo}», pero no se pudo retirar «{viejo}». Retíralo de nuevo.».
  - **«Retirar»:** sin confirmación. Mensaje: «Le has retirado «{título}». Ya no lo ve.».
- **Sin envíos:** «Todavía no le has enviado ningún audio de Biblioteca.».
- **En pausa:**
  - «Está en pausa: ahora no ve estos audios. Los volverá a ver cuando reanudes su vínculo.»;
  - no se le puede enviar: «Está en pausa: reanuda su vínculo para enviarle audios.».

**«Hechos para esta persona»** (audios para una persona)

- **«Crear audio para esta persona»:** abre la ventana de audio con la persona ya fijada (ver Audios).
  - Si está en pausa, no se puede: «Está en pausa: reanuda su vínculo para crear audios para ella.».
- **Menú de cada audio:** «Editar», «Publicar» / «Despublicar» y «Borrar».
  - «Despublicar» y «Borrar» piden confirmación:
    - «¿Despublicar este audio?» — «{nombre} dejará de ver «{título}». Podrás volver a publicarlo cuando quieras.»;
    - «¿Borrar este audio?» — «Vas a borrar «{título}». {nombre} dejará de verlo y no se puede deshacer.».
- **Sin audios:** «Todavía no has creado ningún audio solo para esta persona.».

**Recordatorio y nota privada**

- Debajo, un recordatorio: «Los audios generales los ve mientras el vínculo esté activo.».
- **«Nota privada»:**
  - «Solo la ves tú. Esta persona no puede leerla.»;
  - hasta 2.000 caracteres;
  - botones «Descartar» y «Guardar nota»;
  - muestra «Cambios sin guardar» o «Guardada el {fecha}»;
  - si se guarda vacía, se borra («Nota borrada.»);
  - errores: «No se pudo cargar la nota.» y «No se pudo guardar la nota. Inténtalo de nuevo.»;
  - si hay cambios sin guardar y se sale, avisa: «Tienes cambios en la nota privada que todavía no has guardado. Si sales ahora, se perderán.».

**Errores de la ficha**

- «No se pudieron cargar los datos de esta persona. Revisa tu conexión.»
- «Esta persona no está entre tus oyentes.»

---

## Biblioteca

**Para qué sirve:** guardar audios privados para enviárselos a personas concretas.

Subtítulo: «Tu biblioteca privada: sube un audio una vez y envíalo a las personas que lo necesiten. Nadie lo ve hasta que se lo envías.»

### Lo que se puede hacer

- **«Subir audio»:** abre «Subir a Biblioteca» (ver «Ventana de audio» en Audios).
  - En Biblioteca no hay borrador ni publicado: se guarda con «Guardar en Biblioteca».
  - Mensaje: «Guardado en Biblioteca. Nadie lo ve hasta que lo envíes.».
- **Buscar y ordenar:**
  - buscador «Buscar por título o etiqueta»;
  - filtro por etiqueta («Todas»);
  - orden «Más recientes», «Más antiguos», «Título (A-Z)».
- **Cada audio muestra:**
  - sus etiquetas;
  - «Salud» si se marcó que tiene contenido de salud;
  - «En Audios» si también se añadió a Audios;
  - el botón «Enviado a {N} personas» o «Sin enviar», que abre la ventana de envíos.
- **Menú de cada audio:** «Enviar…», «Editar» y «Borrar».

### Ventana de envíos (de un audio)

- Lista de a quién se le ha enviado, con «Retirar a {nombre}» (sin confirmación). Mensaje: «Se lo has retirado a {nombre}. Ya no lo ve.».
- Si la persona tiene el vínculo en pausa: «Vínculo en pausa: no lo ve». Si ya no tiene vínculo: «Sin vínculo: no lo ve».
- **«Enviar a»:**
  - buscador «Buscar persona»;
  - como mucho 20 personas de una vez («Puedes enviarlo a 20 personas de una vez.»);
  - botón «Enviar ({N})» y «Cerrar».
- **Mensajes:**
  - «Enviado a {nombre}. Ya lo tiene en «Para ti».» o «Enviado a {N} personas. Ya lo tienen en «Para ti».»;
  - «Aún no se lo has enviado a nadie.»;
  - «Todavía no tienes oyentes. Cuando alguien se una a ti, podrás enviarles audios.»;
  - «Ya lo tienen todos tus oyentes.».
- **Errores:**
  - «No se pudo enviar a {nombres}. Comprueba que su vínculo sigue activo e inténtalo de nuevo.»
  - «No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.»
  - «No se pudo retirar. Inténtalo de nuevo.»

### Borrar un audio de Biblioteca

- **Confirmación** «¿Borrar este audio?». El texto depende del caso:
  - «Vas a borrar «{título}» de tu biblioteca. No se puede deshacer.»;
  - si se ha enviado: «Vas a borrar «{título}». Se lo quitarás a {N} personas que lo tienen en «Para ti». No se puede deshacer.»;
  - si también está en Audios: «También está en Audios; se quitará de allí y de tus listas.»;
  - si está en programas: «Está en el programa «{título}»; se quitará de él.» (o «Está en {N} programas; se quitará de ellos.») y «Quien lo tenga conserva lo que ya completó.».
- **Después:** ««{título}» borrado.». Si falla: «No se pudo borrar el audio. Inténtalo de nuevo.».

### Límites

- **200 audios.** Al llegar: «Tu biblioteca está llena (200 audios). Borra alguno para subir otro.» y no deja subir más.
- **Etiquetas:** hasta 5 por audio, de 30 caracteres cada una. Se guardan en minúsculas.

### Mensajes de la página

- Vacía: «Tu biblioteca está vacía» / «Sube aquí los audios que usas con varias personas. Después podrás enviárselos a quien los necesite sin volver a subirlos.», con el botón «Subir tu primer audio».
- Sin resultados: «Ningún audio coincide con la búsqueda.».
- Error de carga: «No se pudieron cargar tus audios. Revisa tu conexión.» con «Reintentar».

### Qué ve el oyente

Solo los audios que se le han enviado, en su sección «Para ti», mientras su vínculo esté activo. Las etiquetas no las ve, pero puede encontrar el audio por ellas en su buscador.

---

## Audios

**Para qué sirve:** los audios que ven todos los oyentes (generales) y los audios hechos para una persona.

- Subtítulo: «Tus audios publicados los escuchan las personas que tienen acceso a ti.»
- Junto al subtítulo hay una etiqueta «Cuota de acceso: por decidir». **A medias:** no hace nada; indica que el cobro aún no está decidido.
- Dos pestañas: «Audios generales» y «Para una persona».

### Pestaña «Audios generales»

- **Botones:** «Subir audio» y «Añadir desde Biblioteca».
- **Buscar y filtrar:** buscador «Buscar por título» y filtro «Todos», «Publicados», «Borradores».
- **Orden:**
  - en el menú de cada audio, «Subir» y «Bajar» lo mueven en la lista;
  - es el mismo orden en que los ve el oyente;
  - con búsqueda o filtro puestos no se puede reordenar: «Para cambiar el orden, quita la búsqueda y el filtro.».
- **Menú de cada audio:** «Editar», «Publicar» / «Despublicar», «Subir», «Bajar» y «Borrar». Si viene de Biblioteca, en lugar de «Borrar» pone «Quitar de Audios».
  - **Publicar / despublicar** no pide confirmación:
    - ««{título}» publicado. Ya lo ven tus oyentes con acceso.»;
    - ««{título}» despublicado. Tus oyentes ya no lo ven.».
  - **Borrar:** «¿Borrar este audio?» — «Vas a borrar «{título}». Tus oyentes dejarán de verlo y no se puede deshacer.».
  - **Quitar de Audios:** «¿Quitar de Audios?» — «Vas a quitar «{título}» de Audios. Tus oyentes dejarán de verlo aquí y en tus listas. Sigue en Biblioteca.». Después: ««{título}» quitado de Audios. Sigue en Biblioteca.».
- **Los que vienen de Biblioteca** llevan la etiqueta «De Biblioteca».
- **«Añadir desde Biblioteca»:**
  - texto: «Se añaden publicados, al final de la lista. Siguen también en Biblioteca: título, descripción, imagen y salud serán los mismos en los dos sitios.»;
  - hasta 20 de una vez.
  - Mensajes: ««{título}» añadido a Audios y publicado.» o «{N} audios añadidos a Audios y publicados.».
  - Si ya están todos: «Ya están en Audios todos los audios de Biblioteca.».
- **Vacía:** «Aún no has subido audios» / «Los audios generales que publiques los escucharán todas las personas que tienen acceso a ti.», con «Subir tu primer audio».
- **Errores:**
  - «No se pudieron cargar tus audios. Revisa tu conexión y vuelve a entrar.»
  - «No se pudo guardar el nuevo orden. Inténtalo de nuevo.»
  - «No se pudo cambiar el estado. Inténtalo de nuevo.»
  - «No se pudo borrar el audio. Inténtalo de nuevo.»
  - «No se pudieron añadir. Revisa tu conexión e inténtalo de nuevo.»
  - «No se pudo cargar tu Biblioteca. Inténtalo de nuevo.»

### Pestaña «Para una persona»

- **Buscar y filtrar:** buscador «Buscar por título», filtro por persona («Todas») y filtro de estado («Todos», «Publicados», «Borradores»). Botón «Subir audio».
- **Cada audio:** dice para quién es. Si esa persona está en pausa: «Vínculo en pausa: no lo ve».
- **Menú de cada audio:** «Editar», «Publicar» / «Despublicar» y «Borrar». Despublicar y borrar piden confirmación, con los mismos textos que en la ficha del oyente.
- **Sin oyentes activos:**
  - no se pueden crear audios nuevos: «Ahora no tienes oyentes con vínculo activo: no puedes crear audios nuevos para una persona.» y «Necesitas al menos un oyente con vínculo activo.»;
  - vacía y sin oyentes: «Todavía no tienes oyentes» / «Cuando alguien se una a ti, podrás crearle audios.».
- **Vacía con oyentes:** «Aún no has creado audios para una persona» / «Un audio para una persona solo lo ve y lo escucha ella.», con «Crear un audio para una persona».

### Ventana de audio (subir o editar; la misma en Audios, Biblioteca y la ficha del oyente)

- **Título de la ventana:** «Subir audio», «Subir audio para una persona», «Subir a Biblioteca» o «Editar audio».
- **«¿Para quién es?»** (solo en audios para una persona):
  - se elige la persona;
  - aviso: «Solo esta persona lo verá y lo escuchará. Después no se puede cambiar.»;
  - al editar: «No se puede cambiar la persona: si te has equivocado, borra este audio y crea otro.».
- **Archivo:**
  - «Arrastra aquí tu audio o pulsa para elegirlo»;
  - formatos MP3, M4A o WAV, hasta 100 MB;
  - mientras sube, se ve el progreso y el botón «Cancelar subida»;
  - después, una «Vista previa» para escucharlo.
  - **Al editar no se puede cambiar el archivo.**
  - Errores:
    - «El archivo está vacío.»
    - «El audio pesa más de 100 MB.»
    - «El archivo no es un audio MP3, M4A o WAV.»
    - «No se pudo subir el audio. Inténtalo de nuevo.»
    - «No se pudo cargar el audio para escucharlo.»
- **Campos:**
  - «Título»: obligatorio, 120 caracteres; se rellena con el nombre del archivo;
  - «Descripción»: opcional, 2.000 caracteres; «Para qué sirve, cuándo escucharlo… (opcional)».
- **«Etiquetas»** (solo en Biblioteca):
  - «Escribe un tema y pulsa Intro»;
  - «Por ejemplo «ansiedad» o «sueño». Hasta 5.»;
  - tiene un botón «Qué son las etiquetas» que explica: «Palabras cortas para organizar tus audios por tema, como «sueño» o «calma». Puedes poner hasta 5. Te ayudan a encontrarlos con el buscador y el filtro. Son opcionales. Las personas a las que envías el audio no las ven, pero pueden encontrarlo por ellas en su buscador.».
- **«Contiene contenido de salud»:** casilla. «Por ejemplo, si habla de diagnósticos, tratamientos o medicación. Tus oyentes verán un aviso junto al audio.».
- **«Imagen»:**
  - opciones «Por defecto», «Foto del profesional» y «Otra imagen»;
  - «Otra imagen» abre «Ajustar imagen», un recorte cuadrado: «Lo que queda dentro del cuadrado es la imagen del audio…», con el botón «Guardar imagen»;
  - después se puede usar «Cambiar imagen»;
  - si se elige «Foto del profesional» sin tener foto principal: «Aún no tienes foto principal en tu perfil: se verá la imagen de NeuroAudio.».
  - Error: «No se pudo subir la imagen. Inténtalo de nuevo.».
- **Si el audio está en Audios y en Biblioteca a la vez**, avisa de que título, descripción, imagen y salud se guardan en los dos sitios:
  - «Este audio viene de Biblioteca: …»;
  - «Este audio también está en Audios: …».
- **Botones:**
  - Siempre: «Cancelar».
  - En Biblioteca: «Guardar en Biblioteca» (nuevo) o «Guardar cambios» (al editar).
  - Nuevo, o borrador al editar: «Guardar borrador» y «Publicar».
  - Publicado al editar: «Despublicar» y «Guardar cambios».
  - Los botones de guardar no se activan hasta que haya título, el audio haya terminado de subir, haya persona elegida (en los personales) y haya imagen (si se eligió «Otra imagen»).
- **Mensajes al guardar:**
  - «Audio publicado. Ya lo ven tus oyentes con acceso.»
  - «Guardado como borrador. Tus oyentes no lo ven.»
  - «Audio publicado. Ya lo ve {nombre}.»
  - «Guardado como borrador. {nombre} no lo ve.»
  - «Cambios guardados.»
  - Si falla: «No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.»

### Qué ve el oyente

- **Generales publicados:** los ven todos los oyentes con vínculo activo, en el orden de la lista. Los borradores no se ven.
- **Para una persona:** solo esa persona, y solo si está publicado y su vínculo está activo.
- **Salud:** si está marcado, el oyente ve un aviso junto al audio.

### Puede confundir

- Un mismo audio puede estar a la vez en Biblioteca y en Audios: es el mismo archivo, y los cambios de título, descripción, imagen y salud se aplican en los dos sitios.
- «Quitar de Audios» no borra el audio de Biblioteca. «Borrar» en Biblioteca sí lo quita también de Audios, de las listas y de los programas.

---

## Listas y programas

Subtítulo: «Agrupa tus audios en listas. Las publicadas las ven las personas que tienen acceso a ti.» Dos pestañas: «Listas» y «Programas».

### Pestaña «Listas»

**Para qué sirve:** agrupar audios generales en listas.

- **«Nueva lista»** abre una ventana con dos caminos:
  - **«Empezar desde una lista ya hecha»** — «Con el nombre y la imagen de una de las listas de NeuroAudio. Solo tienes que añadir tus audios.»
    - Hay 8: Meditación, Hipnosis, Reprogramación, Visualización, Subliminales, Mantras, Para dormir y Motivación.
    - Cada una se puede usar una vez: «El nombre y la imagen son los de la lista. Cada una se puede usar una vez; las que ya has creado se abren para editarlas.».
    - Botones de cada tarjeta: «Usar esta lista» o «Ya creada · Editar».
  - **«Crear desde cero»** — «Con tu propio nombre e imagen.»
    - Como mucho 30 listas propias. Al llegar: «Has llegado al máximo de listas propias. Borra alguna para crear otra.».
- **Página principal:**
  - buscador «Buscar por nombre» y filtro «Todas», «Publicadas», «Borradores»;
  - cada tarjeta muestra el número de audios;
  - vacía: «Aún no has creado listas» / «Una lista agrupa tus audios en un recorrido. Empieza desde una de las listas de NeuroAudio o crea la tuya.», con «Crear tu primera lista».

**Editor de una lista** (página propia, con «Volver a tus listas»)

- **«Nombre»** (80 caracteres) e **imagen** («Subir imagen» / «Cambiar imagen» / «Quitar», con recorte cuadrado).
  - En las listas ya hechas, nombre e imagen son fijos: «El nombre y la imagen son los de esta lista de NeuroAudio.».
- **«Descripción (opcional)»:** 2.000 caracteres. «Para quién es y para quién no es esta lista.».
- **«Audios»:**
  - **«Añadir audios»:** elige entre los **audios generales** (no los de Biblioteca ni los personales).
    - Botón «Añadir ({N})»; los que ya están dicen «Ya está en la lista».
    - Sin audios: «Aún no has subido audios.» con «Ir a Audios».
  - Cada audio de la lista se puede subir, bajar o quitar («Quitar de la lista»). Los que están en borrador llevan «Borrador».
  - Aviso: ««{título}» está en borrador: tus oyentes no lo verán en la lista hasta que lo publiques.».
  - Vacía: «Aún no hay audios en esta lista.».
  - Límite: 100 audios («Una lista puede tener 100 audios como mucho.»).
- **Botones:**
  - lista nueva o en borrador: «Guardar borrador» y «Publicar»;
  - lista publicada: «Despublicar» y «Guardar cambios»;
  - si ya existe: «Borrar lista».
- **Mensajes:**
  - «Borrador guardado.»
  - «Lista publicada. Ya la ven tus oyentes con acceso.»
  - «Cambios guardados. Tus oyentes ya los ven.»
  - «Lista despublicada. Tus oyentes ya no la ven.»
- **Errores al guardar:**
  - «Añade al menos un audio para publicar la lista.»
  - «Ponle un nombre a la lista.»
  - «No se pudo guardar la lista. Inténtalo de nuevo.»
  - «No se pudo subir la imagen. Inténtalo de nuevo.»
- **Confirmaciones:**
  - «¿Despublicar esta lista?» — «Tus oyentes dejarán de ver «{nombre}». Podrás volver a publicarla cuando quieras.»
  - «¿Borrar esta lista?» — «Vas a borrar «{nombre}». Sus audios no se borran, pero tus oyentes dejarán de ver la lista y no se puede deshacer.»
- **Salir sin guardar:** «Tienes cambios en esta lista que todavía no has guardado. Si sales ahora, se perderán.».
- **Errores de carga:**
  - «Esta lista no existe o se ha borrado.»
  - «No se pudieron cargar tus listas. Revisa tu conexión y vuelve a entrar.»

**Qué ve el oyente:** las listas publicadas, con sus audios generales publicados. Los audios en borrador no aparecen dentro de la lista.

### Pestaña «Programas»

**Para qué sirve:** una secuencia de audios **de Biblioteca** para seguir paso a paso, con un ritmo recomendado.

- **Página principal:**
  - vacía: «Aún no has creado programas» / «Un programa es una lista de audios de tu Biblioteca para seguir paso a paso, con un ritmo recomendado.», con «Crear tu primer programa»;
  - botón «Nuevo programa»;
  - cada programa muestra cuántos pasos tiene y para quién es: «Para todos», «Para 1 persona» o «Para {N} personas».
  - Límite: 30 programas. «Puedes tener 30 programas como mucho. Borra alguno para crear otro.».
  - Error: «No se pudieron cargar tus programas. Revisa tu conexión y vuelve a entrar.».

**Ventana «Crear programa» / «Editar programa»**

- **«Nombre»** (80 caracteres) y **«Descripción»** (2.000 caracteres; «Para qué es y cómo seguirlo (opcional)»).
- **«Cómo se abre»:**
  - **Libre:** «Todos los pasos abiertos desde el principio.»
  - **En orden** (la opción por defecto): «El siguiente paso se abre al completar el anterior.»
  - **Por calendario:** «Se abre un paso según el ritmo, contando desde el día en que cada persona recibe el programa.»
- **«Ritmo recomendado»:**
  - opciones «Diario», «Semanal», «Mensual» y «N días» (con «Cada cuántos días», de 1 a 365);
  - en «Por calendario» marca cuándo se abre cada paso («Abre un paso con este ritmo.»);
  - en los demás modos: «Se muestra como recomendación; no cierra nada.».
- **Pasos:**
  - «Añadir audio de Biblioteca». «Cada audio es un paso.»;
  - se suben, bajan o quitan («Quitar del programa»);
  - límite: 50 pasos («Un programa puede tener 50 pasos como mucho.»);
  - al añadir: «Solo caben {N} pasos más…» y hasta 20 de una vez;
  - si un audio se borró de Biblioteca, el paso muestra «Audio borrado de Biblioteca».
- **«¿Para quién es?»:**
  - **«Todos mis oyentes»:** «Lo ven todos tus oyentes con vínculo activo, también los que lleguen después, cada uno desde el paso 1.»
  - **«Personas concretas»:** «Solo las que elijas. Podrás añadir o quitar personas más adelante.»
    - Se eligen con un buscador («Buscar oyente…»).
    - Como mucho 100 personas: «Has llegado al máximo de personas para este programa.».
- **Botones:** «Cancelar» y «Crear en borrador» / «Guardar cambios».
  - Un programa nuevo **siempre se crea en borrador**: «Programa creado en borrador. Publícalo cuando esté listo.».
  - Error: «No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.».

**Página de un programa** (con «Volver a tus programas»)

- **Muestra:**
  - cómo se abre, por ejemplo «En orden: el siguiente paso se abre al completar el anterior.»;
  - el ritmo, por ejemplo «1 audio al día» o «1 audio cada 3 días»;
  - los pasos en orden.
- **Botones:** «Editar», «Publicar» o «Pasar a borrador», y «Borrar».
  - **Publicar** necesita al menos un audio: «Añade al menos un audio para publicarlo.». Mensajes:
    - «Programa publicado. Ya lo ven tus oyentes con vínculo activo.»;
    - en uno de personas concretas: «Programa publicado. Añade personas para que lo vean.» o un mensaje con cuántas personas lo ven.
  - **«Pasar a borrador»:** «¿Pasar a borrador?» — «{quiénes} dejarán de verlo hasta que lo vuelvas a publicar. Su progreso se conserva.». Después: «Programa en borrador. Nadie lo ve hasta que lo publiques.».
  - **«Borrar»:** «¿Borrar este programa?» — «Vas a borrar «{título}». {Tus oyentes lo perderán / Nadie lo tiene todavía / {quiénes} lo perderán}. No se puede deshacer.».
  - Sin audios: «Aún no tiene audios. Añádelos con «Editar».».
- **En los de personas concretas, la lista de personas:**
  - vacía: «Aún no se lo has dado a nadie.»;
  - cada persona tiene «Quitar a {nombre}», que pide confirmación: «¿Quitar a esta persona?» — «{nombre} dejará de ver «{título}». Si se lo vuelves a dar, conserva lo que ya completó.»;
  - si está en pausa: «Vínculo en pausa: no lo ve».
  - **«Añadir persona»:** «Si entra alguien nuevo, lo añades aquí: no hace falta crear otro programa.» y «Cada persona empieza desde el paso 1 el día que se lo das.». Botón «Añadir ({N})». Mensajes:
    - «Añadida 1 persona» / «Añadidas {N} personas»;
    - «{nombre} ya tiene el programa.»;
    - «No se pudo dar a {nombres}. Comprueba que su vínculo sigue activo e inténtalo de nuevo.».
  - Límite: «Un programa puede tener 100 personas como mucho.».
- **Errores de carga:** «Este programa ya no existe.» y «No se pudo cargar el programa. Revisa tu conexión y vuelve a entrar.».

**Qué ve el oyente**

- El programa publicado, si es para todos (con vínculo activo) o si se le ha dado.
- Lo sigue paso a paso: «Paso 2 de 7» o «Completado».
- Su progreso es suyo y se conserva aunque el programa pase a borrador o se le quite y se le vuelva a dar.

### Puede confundir

- **Las listas usan audios generales; los programas, audios de Biblioteca.** No se mezclan.
- **Un programa nuevo nunca se publica al crearlo:** hay que entrar en él y pulsar «Publicar».
- **El día 1 de cada persona:**
  - en «Para todos», cuenta desde la publicación o desde que se vinculó (lo más tardío);
  - en personas concretas, desde el día en que se le dio.

---

## Mensajes

**A medias: no existe todavía.** La página muestra «Aquí podrás hablar con tus clientes.» y «Próximamente».

## Estadísticas

**A medias: no existe todavía.** La página muestra «Aquí podrás ver cómo escuchan tus clientes tus audios.» y «Próximamente».

---

## Ajustes

Cuatro apartados: «General», «Cuenta», «Privacidad» y «Plan y uso». Al entrar se abre «General».

### General

- **Foto de perfil y «Nombre completo»:** vienen de la cuenta de Google y no se pueden cambiar aquí («Viene de tu cuenta de Google y no se puede editar aquí.»).
- **«¿Cómo quieres que te llamemos?»:**
  - un nombre para saludarte, con el botón «Guardar»;
  - ayuda: «Lo usaremos para saludarte, por ejemplo en la pantalla de Inicio.»;
  - al guardar: «Guardado. Así te saludaremos a partir de ahora.»; si falla: «No se pudo guardar. Inténtalo de nuevo.».
  - Es el nombre de la app de oyente, **no** el del Perfil profesional.
- **«Apariencia»:** «Sistema», «Claro» y «Oscuro». Funciona y es lo mismo que el botón de la luna de la barra derecha.
  - «Sistema» sigue el modo del dispositivo y cambia solo si el dispositivo cambia. Ayuda del campo: «Sigue el modo de tu dispositivo: ahora, {claro / oscuro}.».
  - Con «Claro» u «Oscuro»: «También puedes cambiarlo con el botón de la luna, a la derecha.».
  - Pulsar la luna pasa al otro modo y deja de seguir al sistema.
  - Por defecto, «Claro». Se recuerda en ese navegador.
- **«Reducir animaciones»:** interruptor que funciona. Se guarda en este dispositivo.
- **«Idioma»:** solo «Español».
- **«Reproducción» → «Continuar donde lo dejaste»:** interruptor que funciona, desactivado por defecto. «Al volver a un audio que dejaste a medias, te preguntamos si quieres continuar o empezar de nuevo.» Se guarda en este dispositivo.
  - Con él activado, al pulsar un audio dejado a medias sale «¿Continuar donde lo dejaste?» con «Continuar desde {mm:ss}» y «Empezar de nuevo». No pregunta en los primeros 30 s, en los últimos 30 s ni si se terminó.
- **Desactivado, con «Próximamente»:** «Avisos por email».

### Cuenta

- **Datos:** «Nombre» y «Correo electrónico» de la cuenta de Google.
- **«Cerrar sesión»:** funciona. Si falla: «No se pudo cerrar la sesión. Inténtalo de nuevo.».
- **«Eliminar cuenta»:**
  - texto: «Esta acción borrará tu cuenta, tus audios, tus listas y todos tus datos de forma permanente. No se puede deshacer.»;
  - pide confirmación: «¿Seguro que quieres eliminar tu cuenta? Esta acción es permanente y no se puede deshacer.», con «Cancelar» y «Sí, eliminar mi cuenta».
  - **A medias:** al confirmar no se borra nada; sale «La eliminación de cuenta todavía no está disponible. Se implementará próximamente, con borrado en cascada de todos tus datos.».

### Privacidad

- «Términos y condiciones», «Política de privacidad» y «Política de cookies».
- **A medias:** son solo nombres, sin enlace: «Aquí podrás consultar los documentos legales de NeuroAudio. De momento son solo referencia: próximamente estarán disponibles para leer directamente desde la app.».

### Plan y uso

- **«Tu plan»:** siempre «Free» con la etiqueta «Gratis».
  - **A medias:** «Gestión de suscripción próximamente.»; el botón «Cambiar de plan» está desactivado.
- **«Uso»:** cifras reales.
  - «Audios guardados» («Generales, para una persona y de Biblioteca»);
  - «Listas creadas»;
  - «Espacio usado» («Solo audios, sin fotos ni portadas»).
  - Vacío: «Todavía no has subido audios ni creado listas.». Error: «No se pudo cargar tu uso. Revisa tu conexión.» con «Reintentar».
- **«Facturación»:**
  - **A medias:** «Todavía no has añadido un método de pago.» («Cambiar método de pago» desactivado) y «Todavía no tienes facturas.».

---

## Resumen: lo que está a medias o no existe

1. **Invitar o añadir oyentes:** no se puede desde el panel. Los vínculos se crean fuera de la app. Tampoco se pueden borrar vínculos, solo pausarlos.
2. **Mensajes y Estadísticas:** páginas vacías con «Próximamente».
3. **Soporte:** el formulario está hecho, pero los mensajes no se guardan hasta publicar sus reglas (hoy sale «No se pudo enviar…»), y aún no llegan por correo.
4. **Eliminar cuenta:** pide confirmación pero no borra nada.
5. **Plan, pago y facturas:** solo diseño; el plan es siempre «Free».
6. **Documentos legales en Ajustes:** sin enlace.
7. **«Cuota de acceso: por decidir»** en Audios: solo un aviso.
8. **Avatar de la barra derecha:** no tiene menú.
9. **Aviso de cambios sin guardar:** el botón «atrás» del navegador no lo activa.

## Resumen: lo que puede confundir a alguien nuevo

- **Tres tipos de audio en dos páginas:**
  - Audios tiene los generales y los de una persona;
  - Biblioteca, los privados que se envían.
- **Los audios de Biblioteca** pueden estar también en Audios (mismo audio, cambios compartidos).
- **Listas y programas usan audios distintos:** las listas, audios generales; los programas, audios de Biblioteca.
- **Cada página usa su propio vocabulario:**
  - Audios y Listas hablan de «Publicar» / «Despublicar»;
  - Biblioteca, de «Enviar» / «Retirar»;
  - Programas, de «Publicar» / «Pasar a borrador» y de «dar» o «quitar» a personas.
- **Un vínculo en pausa:** la persona deja de ver todo (generales, enviados, personales y programas), pero nada se borra.
- **Los números del Dashboard** no cuentan la Biblioteca ni los borradores, pero los «Primeros pasos» sí.
- **Dos nombres distintos:**
  - el del Perfil es el que ven los oyentes;
  - el de Ajustes → General es para el saludo de la app de oyente.
 