# Logg'd In — contexto del proyecto

Logg'd In es una app web para llevar un registro de lo que consumo (media tracker).

## Sobre mí y cómo quiero que trabajes
- Estoy aprendiendo y recuerdo poco de HTML, CSS y JavaScript.
- Explícame lo que hagas de forma sencilla y **en castellano**.
- Antes de escribir código, explícame el plan en pocas líneas y espera a que te dé el OK.
- No añadas funciones que no he pedido: ciñete a la versión actual.

## Requisitos técnicos
- Solo HTML, CSS y JavaScript "puro" (vanilla): sin frameworks, librerías ni nada que instalar.
- Los datos se guardan en `localStorage` del navegador.
- El código va separado en tres archivos: `index.html`, `style.css` y `app.js`.
- Código sencillo y con comentarios en castellano.
- Diseño responsive: debe verse bien en móvil y en ordenador.

## Versión 1 (alcance actual)
- Seis apartados: música, videojuegos, libros, series, películas y manga.
- Añadir, editar y borrar elementos en cada apartado.
- Cada elemento tiene: título, apartado, portada (opcional), estado (pendiente, en curso, terminado), valoración de 0,5 a 5 estrellas (opcional), reseña corta (opcional, máx. 500 caracteres) y fecha de terminado (solo si está terminado).
- Portadas automáticas al escribir el título: música → iTunes (JSONP), películas y videojuegos → Wikipedia, series → TVmaze, libros → Google Books, manga → AniList. Se guarda solo la dirección de la imagen.
- Filtrar por apartado y por estado.

## Diseño
- Pensado primero para el móvil. Minimalista y moderno, que no parezca hecho por IA (referencias: Letterboxd, Notion, Serializd).
- Modo claro y oscuro.
- La lista es lo principal: tarjetas a todo lo ancho con la portada a la izquierda. Se añade con el botón + y se edita tocando una tarjeta (panel que sube desde abajo).
- Logo: una L hecha con una tira de película. En el título, la L de "Logg'd In" es ese dibujo.
- Al borrar sale un aviso con "Deshacer" (nada de alert/confirm).

## Más adelante
- Registro e inicio de sesión, solo para mí, para tener los mismos datos en el móvil y en el ordenador.

## Cómo probarla
Abrir `index.html` con Live Server en VS Code.
