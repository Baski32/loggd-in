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
let eleccion = { apartado: "musica", estado: "pendiente", nota: null };

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

  // Toda la fila es un botón: al tocarla, se abre para editar
  const fila = document.createElement("button");
  fila.type = "button";
  fila.className = "fila";
  fila.addEventListener("click", function () {
    abrirPanel(e.id);
  });

  const info = document.createElement("span");

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

// =========================================
// EL PANEL (añadir y editar)
// =========================================

// Abre el panel. Sin id = añadir uno nuevo; con id = editar ese.
function abrirPanel(id) {
  idEditando = id || null;

  if (idEditando) {
    const e = elementos.find(function (x) { return x.id === idEditando; });
    campoTitulo.value = e.titulo;
    eleccion = { apartado: e.apartado, estado: e.estado, nota: e.nota };
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
    };
    campoFecha.value = fechaDeHoy();
    hojaTitulo.textContent = "Añadir";
    botonGuardar.textContent = "Añadir";
    botonBorrar.hidden = true;
  }

  pintarEleccion();
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

// Al escribir el título, activamos o apagamos el botón de guardar
campoTitulo.addEventListener("input", pintarEleccion);

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
