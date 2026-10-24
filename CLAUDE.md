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
- Cada elemento tiene: título, apartado, estado (pendiente, en curso, terminado), nota del 1 al 10 (opcional) y fecha de terminado (solo si está terminado).
- Filtrar por apartado y por estado.

## Diseño
- Pensado primero para el móvil. Minimalista y moderno, que no parezca hecho por IA (referencias: Letterboxd, Notion, Serializd).
- Modo claro y oscuro.
- La lista es lo principal; se añade con el botón + y se edita tocando una fila (panel que sube desde abajo).
- Al borrar sale un aviso con "Deshacer" (nada de alert/confirm).

## Más adelante
- Registro e inicio de sesión, solo para mí, para tener los mismos datos en el móvil y en el ordenador.

## Cómo probarla
Abrir `index.html` con doble clic en el navegador. No hace falta servidor.
