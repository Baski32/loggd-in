// =========================================
// Logg'd In - lógica de la aplicación
// =========================================

// Nombres con los que guardamos cosas en el navegador (localStorage)
const CLAVE_GUARDADO = "loggdin-elementos";
const CLAVE_TEMA = "loggdin-tema";

// Textos para enseñar en pantalla.
// En los datos guardamos la versión corta (ej.: "peliculas")
// y aquí la traducimos a la versión para leer (ej.: "Películas").
const NOMBRES_APARTADOS = {
  todos: "Todo",
  musica: "Música",
  videojuegos: "Videojuegos",
  libros: "Libros",
  series: "Series",
  peliculas: "Películas",
  manga: "Manga",
};

const NOMBRES_ESTADOS = {
  pendiente: "Pendiente",
  "en-curso": "En curso",
  terminado: "Terminado",
};

// ----- ESTADO DE LA APP -----
// Estas variables recuerdan cómo está la app en cada momento.
let elementos = cargarElementos(); // todos los elementos
let apartadoActual = "todos";      // pestaña elegida
let estadoActual = "todos";        // filtro de estado elegido
let idEditando = null;             // id del que editamos (null = estamos añadiendo)
let ultimoBorrado = null;          // lo último que se borró, para poder deshacer
let temporizadorAviso = null;      // para esconder el aviso pasados unos segundos

// Lo que está elegido ahora mismo en el panel
let eleccion = { apartado: "musica", estado: "pendiente", nota: null, portada: null };
let temporizadorBusqueda = null;   // espera un poco a que dejes de escribir antes de buscar
let numeroBusqueda = 0;            // para ignorar respuestas de búsquedas antiguas

// ----- PARTES DEL HTML QUE VAMOS A USAR -----
const pestanas = document.getElementById("pestanas");
const filtroEstado = document.getElementById("filtro-estado");
const lista = document.getElementById("lista");
const vacio = document.getElementById("vacio");
const vacioTitulo = document.getElementById("vacio-titulo");
const botonAnadir = document.getElementById("boton-anadir");
const botonTema = document.getElementById("boton-tema");

const hoja = document.getElementById("hoja");
const formulario = document.getElementById("formulario");
const hojaTitulo = document.getElementById("hoja-titulo");
const campoTitulo = document.getElementById("campo-titulo");
const campoFecha = document.getElementById("campo-fecha");
const bloqueFecha = document.getElementById("bloque-fecha");
const opcionesApartado = document.getElementById("opciones-apartado");
const opcionesEstado = document.getElementById("opciones-estado");
const opcionesNota = document.getElementById("opciones-nota");
const botonGuardar = document.getElementById("boton-guardar");
const botonBorrar = document.getElementById("boton-borrar");
const botonCerrar = document.getElementById("boton-cerrar");

const contenedorPortadas = document.getElementById("portadas");
const estadoPortadas = document.getElementById("portadas-estado");

const aviso = document.getElementById("aviso");
const avisoTexto = document.getElementById("aviso-texto");
const avisoDeshacer = document.getElementById("aviso-deshacer");

// =========================================
// GUARDAR Y CARGAR (localStorage)
// "try" evita que la app se rompa si el navegador no deja guardar
// (por ejemplo, en una ventana de incógnito).
// =========================================

function guardarElementos() {
  try {
    localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(elementos));
  } catch (error) {}
}

function cargarElementos() {
  try {
    const texto = localStorage.getItem(CLAVE_GUARDADO);
    return texto ? JSON.parse(texto) : [];
  } catch (error) {
    return []; // si lo guardado está estropeado, empezamos de cero
  }
}

// =========================================
// PEQUEÑAS AYUDAS
// =========================================

// Fecha de hoy en formato "AAAA-MM-DD" (el que usa <input type="date">)
function fechaDeHoy() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return hoy.getFullYear() + "-" + mes + "-" + dia;
}

// Convierte "2026-10-22" en "22 oct 2026"
function formatearFecha(fecha) {
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const partes = fecha.split("-");
  return Number(partes[2]) + " " + meses[Number(partes[1]) - 1] + " " + partes[0];
}

// Id único con la hora actual y un número aleatorio
function crearId() {
  return Date.now().toString() + Math.random().toString(16).slice(2);
}

// Marca como elegido (aria-pressed="true") el botón con ese valor dentro de un grupo
function marcarOpcion(grupo, valor) {
  grupo.querySelectorAll("button").forEach(function (boton) {
    boton.setAttribute("aria-pressed", String(boton.dataset.valor === String(valor)));
  });
}

// =========================================
// PINTAR LA LISTA
// =========================================

function pintarLista() {
  // 1. Nos quedamos con los que encajan en los dos filtros
  const filtrados = elementos.filter(function (e) {
    const encajaApartado = apartadoActual === "todos" || e.apartado === apartadoActual;
    const encajaEstado = estadoActual === "todos" || e.estado === estadoActual;
    return encajaApartado && encajaEstado;
  });

  // 2. Lo último que has tocado, arriba del todo
  filtrados.sort(function (a, b) {
    return (b.actualizado || 0) - (a.actualizado || 0);
  });

  // 3. Vaciamos la lista y la volvemos a llenar
  lista.innerHTML = "";
  filtrados.forEach(function (e) {
    lista.appendChild(crearFila(e));
  });

  // 4. Si no hay nada, enseñamos el mensaje de vacío
  vacio.hidden = filtrados.length > 0;
  const hayEnApartado = elementos.some(function (e) {
    return apartadoActual === "todos" || e.apartado === apartadoActual;
  });
  if (elementos.length === 0) {
    vacioTitulo.textContent = "Tu registro está vacío";
  } else if (hayEnApartado) {
    vacioTitulo.textContent = "No hay nada con este estado";
  } else {
    vacioTitulo.textContent = "Aún no hay nada en " + NOMBRES_APARTADOS[apartadoActual];
  }
}

// Crea la fila de un elemento.
// Usamos textContent (y no innerHTML) para los textos que escribes tú:
// así, si un título lleva "<b>", se ve tal cual y no rompe la página.
function crearFila(e) {
  const li = document.createElement("li");

  // Toda la tarjeta es un botón: al tocarla, se abre para editar
  const fila = document.createElement("button");
  fila.type = "button";
  fila.className = "fila";
  fila.addEventListener("click", function () {
    abrirPanel(e.id);
  });

  // La portada a la izquierda (cuadrada en música, vertical en el resto)
  fila.appendChild(crearPortada(e.portada, e.apartado));

  const info = document.createElement("span");
  info.className = "fila-info";

  const titulo = document.createElement("span");
  titulo.className = "fila-titulo";
  titulo.textContent = e.titulo;
  info.appendChild(titulo);

  const datos = document.createElement("span");
  datos.className = "fila-datos";

  const estado = document.createElement("span");
  estado.className = "estado " + e.estado;
  estado.textContent = NOMBRES_ESTADOS[e.estado];
  datos.appendChild(estado);

  // En "Todo" enseñamos el apartado; dentro de un apartado ya se sabe
  if (apartadoActual === "todos") {
    const apartado = document.createElement("span");
    apartado.textContent = NOMBRES_APARTADOS[e.apartado];
    datos.appendChild(apartado);
  }

  // La fecha solo tiene sentido si está terminado
  if (e.estado === "terminado" && e.fecha) {
    const fecha = document.createElement("span");
    fecha.textContent = formatearFecha(e.fecha);
    datos.appendChild(fecha);
  }

  info.appendChild(datos);
  fila.appendChild(info);

  // La nota, grande a la derecha (un guion si no tiene)
  const nota = document.createElement("span");
  nota.className = "fila-nota" + (e.nota ? "" : " sin-nota");
  nota.textContent = e.nota ? e.nota : "–";
  nota.setAttribute("aria-label", e.nota ? "Nota " + e.nota + " de 10" : "Sin nota");
  fila.appendChild(nota);

  li.appendChild(fila);
  return li;
}

// Crea el hueco de la portada: la imagen si la hay, o un recuadro vacío
function crearPortada(url, apartado) {
  const caja = document.createElement("span");
  caja.className = "portada" + (apartado === "musica" ? " cuadrada" : "");
  if (url) {
    const img = document.createElement("img");
    img.src = url;
    img.alt = "";
    img.loading = "lazy"; // solo se descarga cuando va a verse
    // Si la imagen no carga (sin internet, enlace roto), dejamos el recuadro vacío
    img.addEventListener("error", function () {
      img.remove();
    });
    caja.appendChild(img);
  }
  return caja;
}

// =========================================
// EL PANEL (añadir y editar)
// =========================================

// Abre el panel. Sin id = añadir uno nuevo; con id = editar ese.
function abrirPanel(id) {
  idEditando = id || null;

  if (idEditando) {
    const e = elementos.find(function (x) { return x.id === idEditando; });
    campoTitulo.value = e.titulo;
    eleccion = { apartado: e.apartado, estado: e.estado, nota: e.nota, portada: e.portada || null };
    campoFecha.value = e.fecha || fechaDeHoy();
    hojaTitulo.textContent = "Editar";
    botonGuardar.textContent = "Guardar";
    botonBorrar.hidden = false;
  } else {
    campoTitulo.value = "";
    eleccion = {
      // si estás en una pestaña, te propone ese apartado
      apartado: apartadoActual === "todos" ? "musica" : apartadoActual,
      estado: "pendiente",
      nota: null,
      portada: null,
    };
    campoFecha.value = fechaDeHoy();
    hojaTitulo.textContent = "Añadir";
    botonGuardar.textContent = "Añadir";
    botonBorrar.hidden = true;
  }

  pintarEleccion();
  // Al editar, enseñamos la portada que ya tenía (y no buscamos hasta que cambies algo)
  numeroBusqueda++;
  clearTimeout(temporizadorBusqueda);
  if (eleccion.portada) {
    pintarPortadas([{ titulo: campoTitulo.value, extra: "Actual", portada: eleccion.portada }]);
    estadoPortadas.textContent = "Cambia el título o el apartado para buscar otras.";
  } else {
    pintarPortadas([]);
    estadoPortadas.textContent = idEditando ? "Sin portada. Cambia el título para buscar." : "Escribe el título para buscar portadas.";
    if (idEditando) buscarPortadasPronto(0);
  }
  hoja.showModal();
  // Al añadir, ponemos el cursor en el título para escribir directamente
  if (!idEditando) {
    campoTitulo.focus();
  }
}

// Refleja en los botones lo que está elegido
function pintarEleccion() {
  marcarOpcion(opcionesApartado, eleccion.apartado);
  marcarOpcion(opcionesEstado, eleccion.estado);
  marcarOpcion(opcionesNota, eleccion.nota);
  bloqueFecha.hidden = eleccion.estado !== "terminado";
  botonGuardar.disabled = campoTitulo.value.trim() === "";
}

function cerrarPanel() {
  hoja.close();
}

// Clic en los botones de apartado
opcionesApartado.addEventListener("click", function (evento) {
  const boton = evento.target.closest("button");
  if (!boton) return;
  eleccion.apartado = boton.dataset.valor;
  pintarEleccion();
  buscarPortadasPronto(0); // cada apartado busca en un sitio distinto
});

// Clic en los botones de estado
opcionesEstado.addEventListener("click", function (evento) {
  const boton = evento.target.closest("button");
  if (!boton) return;
  eleccion.estado = boton.dataset.valor;
  pintarEleccion();
});

// Clic en las notas. Si tocas la que ya estaba elegida, se quita.
opcionesNota.addEventListener("click", function (evento) {
  const boton = evento.target.closest("button");
  if (!boton) return;
  const valor = Number(boton.dataset.valor);
  eleccion.nota = eleccion.nota === valor ? null : valor;
  pintarEleccion();
});

// Al escribir el título: activamos el botón de guardar y buscamos portadas
campoTitulo.addEventListener("input", function () {
  pintarEleccion();
  buscarPortadasPronto(600);
});

// Clic en una portada: la elegimos (o la quitamos si ya estaba elegida)
contenedorPortadas.addEventListener("click", function (evento) {
  const boton = evento.target.closest("button");
  if (!boton) return;
  if (eleccion.portada === boton.dataset.portada) {
    eleccion.portada = null;
  } else {
    eleccion.portada = boton.dataset.portada;
    // Ponemos el título oficial (lo puedes cambiar después)
    if (boton.dataset.titulo) campoTitulo.value = boton.dataset.titulo;
  }
  marcarPortada();
  pintarEleccion();
});

// Guardar (Añadir o Guardar cambios)
formulario.addEventListener("submit", function (evento) {
  evento.preventDefault(); // evita que la página se recargue

  const titulo = campoTitulo.value.trim();
  if (titulo === "") return;

  const datos = {
    titulo: titulo,
    apartado: eleccion.apartado,
    estado: eleccion.estado,
    nota: eleccion.nota,
    portada: eleccion.portada,
    // solo guardamos fecha si está terminado
    fecha: eleccion.estado === "terminado" ? (campoFecha.value || fechaDeHoy()) : null,
    actualizado: Date.now(),
  };

  if (idEditando) {
    const e = elementos.find(function (x) { return x.id === idEditando; });
    Object.assign(e, datos);
  } else {
    datos.id = crearId();
    elementos.push(datos);
  }

  guardarElementos();
  cerrarPanel();
  pintarLista();
});

// Borrar: se borra al momento y sale un aviso con "Deshacer"
botonBorrar.addEventListener("click", function () {
  const posicion = elementos.findIndex(function (x) { return x.id === idEditando; });
  ultimoBorrado = { elemento: elementos[posicion], posicion: posicion };
  elementos.splice(posicion, 1);
  guardarElementos();
  cerrarPanel();
  pintarLista();
  mostrarAviso("Borrado");
});

botonCerrar.addEventListener("click", cerrarPanel);

// Tocar fuera del panel (en la zona oscura) también lo cierra
hoja.addEventListener("click", function (evento) {
  if (evento.target === hoja) cerrarPanel();
});

botonAnadir.addEventListener("click", function () {
  abrirPanel();
});

// =========================================
// BUSCAR PORTADAS
// Cada apartado pregunta a un servicio gratuito distinto.
// Todos devuelven una lista con: titulo, extra (año, autor...) y portada (dirección de la imagen).
// =========================================

// Algunos servicios (iTunes) no dejan pedir datos con fetch desde otra web.
// "JSONP" es un truco antiguo: cargamos la respuesta como si fuera un <script>.
function pedirJsonp(url) {
  return new Promise(function (resolver, fallar) {
    const nombre = "respuesta" + Date.now() + Math.floor(Math.random() * 1000);
    const script = document.createElement("script");
    const limite = setTimeout(function () { limpiar(); fallar(new Error("Tiempo agotado")); }, 8000);
    function limpiar() {
      clearTimeout(limite);
      delete window[nombre];
      script.remove();
    }
    window[nombre] = function (datos) { limpiar(); resolver(datos); };
    script.onerror = function () { limpiar(); fallar(new Error("No se pudo cargar")); };
    script.src = url + "&callback=" + nombre;
    document.body.appendChild(script);
  });
}

// fetch normal: pide la dirección y convierte la respuesta en datos
async function pedirJson(url) {
  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error("Error " + respuesta.status);
  return respuesta.json();
}

// El año a partir de una fecha tipo "2023-05-12"
function anio(fecha) {
  return fecha ? String(fecha).slice(0, 4) : "";
}

const BUSCADORES = {
  // Música: discos de iTunes
  musica: async function (texto) {
    const datos = await pedirJsonp("https://itunes.apple.com/search?media=music&entity=album&country=es&limit=10&term=" + encodeURIComponent(texto));
    return datos.results.map(function (r) {
      return { titulo: r.collectionName, extra: r.artistName, portada: r.artworkUrl100.replace("100x100bb", "300x300bb") };
    });
  },

  // Películas: iTunes
  peliculas: async function (texto) {
    const datos = await pedirJsonp("https://itunes.apple.com/search?media=movie&entity=movie&country=es&limit=10&term=" + encodeURIComponent(texto));
    return datos.results.map(function (r) {
      return { titulo: r.trackName, extra: anio(r.releaseDate), portada: r.artworkUrl100.replace("100x100bb", "300x450bb") };
    });
  },

  // Series: TVmaze
  series: async function (texto) {
    const datos = await pedirJson("https://api.tvmaze.com/search/shows?q=" + encodeURIComponent(texto));
    return datos
      .filter(function (r) { return r.show.image; })
      .map(function (r) {
        return { titulo: r.show.name, extra: anio(r.show.premiered), portada: r.show.image.medium.replace("http:", "https:") };
      });
  },

  // Libros: Open Library
  libros: async function (texto) {
    const datos = await pedirJson("https://openlibrary.org/search.json?limit=12&fields=title,author_name,first_publish_year,cover_i&q=" + encodeURIComponent(texto));
    return datos.docs
      .filter(function (r) { return r.cover_i; })
      .map(function (r) {
        return {
          titulo: r.title,
          extra: r.author_name ? r.author_name[0] : anio(r.first_publish_year),
          portada: "https://covers.openlibrary.org/b/id/" + r.cover_i + "-M.jpg",
        };
      });
  },

  // Manga: Jikan (los datos de MyAnimeList)
  manga: async function (texto) {
    const datos = await pedirJson("https://api.jikan.moe/v4/manga?limit=10&q=" + encodeURIComponent(texto));
    return datos.data.map(function (r) {
      return { titulo: r.title, extra: r.published && r.published.prop.from.year ? String(r.published.prop.from.year) : "", portada: r.images.jpg.image_url };
    });
  },

  // Videojuegos: Wikipedia (no hay servicio de portadas de juegos gratis sin registrarse)
  videojuegos: async function (texto) {
    const url = "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrlimit=10" +
      "&prop=pageimages|description&piprop=thumbnail&pithumbsize=300&pilicense=any&gsrsearch=" +
      encodeURIComponent(texto + " video game");
    const datos = await pedirJson(url);
    if (!datos.query) return [];
    return Object.values(datos.query.pages)
      .sort(function (a, b) { return a.index - b.index; }) // en el orden de relevancia
      .filter(function (p) { return p.thumbnail; })
      .map(function (p) {
        return { titulo: p.title.replace(/ \((\d{4} )?video game\)$/, ""), extra: anio((p.description || "").match(/\d{4}/)), portada: p.thumbnail.source };
      });
  },
};

// Espera a que dejes de escribir un momento antes de buscar (para no buscar en cada letra)
function buscarPortadasPronto(espera) {
  clearTimeout(temporizadorBusqueda);
  temporizadorBusqueda = setTimeout(buscarPortadas, espera);
}

async function buscarPortadas() {
  const texto = campoTitulo.value.trim();
  const miBusqueda = ++numeroBusqueda;

  if (texto.length < 2) {
    pintarPortadas(eleccion.portada ? [{ titulo: texto, extra: "Elegida", portada: eleccion.portada }] : []);
    estadoPortadas.textContent = "Escribe el título para buscar portadas.";
    return;
  }

  estadoPortadas.textContent = "Buscando…";
  try {
    let resultados = await BUSCADORES[eleccion.apartado](texto);
    if (miBusqueda !== numeroBusqueda) return; // ya hay una búsqueda más nueva
    resultados = resultados.slice(0, 10);

    // Si ya tenías una portada elegida y no sale en los resultados, la dejamos la primera
    const yaEsta = resultados.some(function (r) { return r.portada === eleccion.portada; });
    if (eleccion.portada && !yaEsta) {
      resultados.unshift({ titulo: "", extra: "Elegida", portada: eleccion.portada });
    }

    pintarPortadas(resultados);
    estadoPortadas.textContent = resultados.length ? "" : "No he encontrado portadas. Prueba con otro título.";
  } catch (error) {
    if (miBusqueda !== numeroBusqueda) return;
    estadoPortadas.textContent = "No se han podido buscar portadas. Revisa tu conexión.";
  }
}

// Pinta la fila de portadas para elegir
function pintarPortadas(resultados) {
  contenedorPortadas.innerHTML = "";
  resultados.forEach(function (r) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "portada-opcion";
    boton.dataset.portada = r.portada;
    boton.dataset.titulo = r.titulo || "";
    boton.setAttribute("aria-label", (r.titulo || "Portada") + (r.extra ? ", " + r.extra : ""));

    boton.appendChild(crearPortada(r.portada, eleccion.apartado));

    const pie = document.createElement("span");
    pie.className = "portada-pie";
    pie.textContent = r.extra || r.titulo;
    boton.appendChild(pie);

    contenedorPortadas.appendChild(boton);
  });
  contenedorPortadas.hidden = resultados.length === 0;
  marcarPortada();
}

// Marca la portada elegida
function marcarPortada() {
  contenedorPortadas.querySelectorAll("button").forEach(function (boton) {
    boton.setAttribute("aria-pressed", String(boton.dataset.portada === eleccion.portada));
  });
}

// =========================================
// AVISO CON DESHACER
// =========================================

function mostrarAviso(texto) {
  avisoTexto.textContent = texto;
  aviso.hidden = false;
  botonAnadir.hidden = true; // que no se solapen
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(esconderAviso, 5000);
}

function esconderAviso() {
  aviso.hidden = true;
  botonAnadir.hidden = false;
  ultimoBorrado = null;
}

avisoDeshacer.addEventListener("click", function () {
  if (ultimoBorrado) {
    elementos.splice(ultimoBorrado.posicion, 0, ultimoBorrado.elemento);
    guardarElementos();
    pintarLista();
  }
  clearTimeout(temporizadorAviso);
  esconderAviso();
});

// =========================================
// FILTROS
// =========================================

// Pestañas de apartado
pestanas.addEventListener("click", function (evento) {
  const boton = evento.target.closest(".pestana");
  if (!boton) return;

  apartadoActual = boton.dataset.apartado;
  document.querySelectorAll(".pestana").forEach(function (p) {
    p.classList.toggle("activa", p === boton);
  });
  // que la pestaña elegida se vea entera si estaba medio escondida
  boton.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  pintarLista();
});

// Filtro de estado
filtroEstado.addEventListener("click", function (evento) {
  const boton = evento.target.closest("button");
  if (!boton) return;

  estadoActual = boton.dataset.estado;
  filtroEstado.querySelectorAll("button").forEach(function (b) {
    b.setAttribute("aria-pressed", String(b === boton));
  });
  pintarLista();
});

// =========================================
// MODO CLARO / OSCURO
// =========================================

// ¿Se está viendo en oscuro ahora mismo?
function esOscuro() {
  const elegido = document.documentElement.dataset.theme;
  if (elegido) return elegido === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

botonTema.addEventListener("click", function () {
  const nuevo = esOscuro() ? "light" : "dark";
  document.documentElement.dataset.theme = nuevo;
  try {
    localStorage.setItem(CLAVE_TEMA, nuevo);
  } catch (error) {}
});

// =========================================
// ARRANQUE
// =========================================
pintarLista();
