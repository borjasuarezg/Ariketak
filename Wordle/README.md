// ==========================================
// 1. EGOERA ALDAGAIAK (Variables de Estado)
// Guardan la información actual de la partida
// ==========================================

// Guardará la palabra secreta que hay que adivinar (ej: "ZANAHORIA")
let helburuHitza = "";

// Número máximo de intentos permitidos (por defecto 6)
let gehienezkoSaiakerak = 6;

// Longitud de la palabra a adivinar (por defecto 5 letras)
let hitzLuzera = 5;

// Contador de intentos: 0 es la primera fila, 1 la segunda, etc.
let unekoSaiakera = 0;

// Lo que el jugador lleva escrito en el intento actual (ej: "CASA")
let unekoProposamena = "";


// ==========================================
// 2. DOM ELEMENTUAK (Elementos HTML)
// Seleccionamos las partes de la página para manipularlas con JS
// ==========================================

// Formulario inicial de configuración (intentos y longitud)
const konfigInprimakia = document.getElementById("konfig-inprimakia");

// Contenedor principal del juego (tablero + teclado)
const jokoEremua = document.getElementById("joko-eremua");

// El contenedor donde crearemos las filas y casillas
const taula = document.getElementById("taula");

// El contenedor donde crearemos las teclas en pantalla
const teklatua = document.getElementById("teklatua");

// Pantalla final donde se muestra el historial
const historiaEremua = document.getElementById("historia-eremua");

// Lista <ul> donde insertaremos las partidas pasadas
const historiaZerrenda = document.getElementById("historia-zerrenda");

// Botón para volver a jugar tras terminar una partida
const btnBerriroJolastu = document.getElementById("btn-berriro-jolastu");


// ==========================================
// 3. HASIERATZEA ETA EVENTOAK (Eventos)
// Escuchan las acciones del usuario (clicks, escribir...)
// ==========================================

// Evento al enviar el formulario (hacer clic en "Jolastu")
konfigInprimakia.addEventListener("submit", async (e) => {
  // Evitamos que la página se recargue al enviar el formulario
  e.preventDefault();

  // Leemos los valores introducidos por el usuario en los <input>
  gehienezkoSaiakerak = parseInt(document.getElementById("saiakerak").value);
  hitzLuzera = parseInt(document.getElementById("luzera").value);

  // Pedimos la palabra a la API de forma asíncrona (esperamos a que responda con `await`)
  helburuHitza = await lortuHitza(hitzLuzera);
  
  // Mostramos la respuesta en la consola del navegador para pruebas/depuración
  console.log("Helburu hitza (pruebas):", helburuHitza);

  // Ocultamos el formulario agregando la clase CSS .hidden
  konfigInprimakia.classList.add("hidden");
  
  // Mostramos el área de juego quitando la clase CSS .hidden
  jokoEremua.classList.remove("hidden");

  // Creamos visualmente las cuadrículas y el teclado táctil
  hasieratuTaula();
  hasieratuTeklatua();
});

// Evento para detectar cuando el usuario pulsa teclas físicas en su teclado
document.addEventListener("keydown", (e) => {
  // Si la pantalla del juego está oculta, ignoramos lo que escriba
  if (jokoEremua.classList.contains("hidden")) return;

  // Guardamos la tecla pulsada
  const tekla = e.key;

  if (tekla === "Enter") {
    // Si pulsa Enter, enviamos la palabra enviando la señal "Enter"
    prozesatuTeklaPultsaketa("Enter");
  } else if (tekla === "Backspace" || tekla === "Delete") {
    // Si pulsa Borrar, enviamos la señal "Del"
    prozesatuTeklaPultsaketa("Del");
  } else if (/^[a-zA-ZñÑáéíóúÁÉÍÓÚ]$/.test(tekla)) {
    // Expresión regular: Si es una letra válida (incluye ñ y tildes), la convertimos a mayúscula
    prozesatuTeklaPultsaketa(tekla.toUpperCase());
  }
});

// Evento al hacer clic en el botón "Berriro jolastu" (Volver a jugar)
btnBerriroJolastu.addEventListener("click", () => {
  // Reiniciamos las variables de control
  unekoSaiakera = 0;
  unekoProposamena = "";
  
  // Ocultamos la pantalla de historial y volvemos a mostrar el formulario inicial
  historiaEremua.classList.add("hidden");
  konfigInprimakia.classList.remove("hidden");
});


// ==========================================
// 4. JOKOAREN FUNTZIOAK (Lógica General)
// Funciones secundarias necesarias para montar el juego
// ==========================================

// Función para obtener la palabra objetivo desde internet
async function lortuHitza(luzera) {
  try {
    // Hacemos una petición HTTP a la API enviando la longitud deseada
    const erantzuna = await fetch(`https://words-api-sy2x.onrender.com/api/word?lang=eu&length=${luzera}&number=1`);
    
    // Si el servidor da error (ej. error 404 o 500), lanzamos una excepción
    if (!erantzuna.ok) throw new Error("Errorea eskaeran");
    
    // Convertimos la respuesta del servidor a un objeto/JSON de JavaScript
    const datuak = await erantzuna.json();
    
    // La API puede devolver ["PALABRA"] o { word: "PALABRA" }, contemplamos ambos casos:
    const hitza = Array.isArray(datuak) ? datuak[0] : (datuak.word || datuak[0]);
    
    // Devolvemos la palabra limpia en mayúsculas
    return hitza.toUpperCase();
  } catch (errorea) {
    // Si no hay internet o falla la API, mostramos error por consola
    console.error("Hutsegitea APIan, ordezko hitza erabiltzen:", errorea);
    
    // Lista de palabras de emergencia/respaldo para que el juego no se rompa
    const ordezkoHitzak = ["CASAS", "PERRO", "GATOS", "PLAZA", "LIBRO"];
    
    // Ajustamos la palabra de reserva a la longitud solicitada por el usuario
    return ordezkoHitzak[0].substring(0, luzera).padEnd(luzera, "A").toUpperCase();
  }
}

// Función que dibuja el tablero (cuadrícula de casillas)
function hasieratuTaula() {
  // Limpiamos el contenido anterior del tablero
  taula.innerHTML = "";
  
  // Bucle para crear tantas filas como intentos permitidos
  for (let i = 0; i < gehienezkoSaiakerak; i++) {
    const errenkada = document.createElement("div");
    errenkada.classList.add("row"); // Le aplicamos clase CSS para diseño flexbox/grid

    // Bucle interno para crear cada casilla (letra) de la fila
    for (let j = 0; j < hitzLuzera; j++) {
      const laukia = document.createElement("div");
      laukia.classList.add("tile");
      
      // Asignamos un ID único a cada casilla (Ej: laukia-0-0 es intento 0, letra 0)
      laukia.id = `laukia-${i}-${j}`;
      errenkada.appendChild(laukia); // Metemos la casilla dentro de la fila
    }
    taula.appendChild(errenkada); // Metemos la fila dentro del tablero
  }
}

// Función que dibuja el teclado en pantalla
function hasieratuTeklatua() {
  teklatua.innerHTML = "";
  
  // Matriz con la distribución de teclas por filas
  const diseinua = [
    ["Á", "É", "Í", "Ó", "Ú"],
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"],
    ["Enter", "Z", "X", "C", "V", "B", "N", "M", "Del"]
  ];

  // Recorremos cada fila del diseño
  diseinua.forEach((errenkadaTeklak) => {
    const errenkada = document.createElement("div");
    errenkada.classList.add("keyboard-row");

    // Recorremos cada tecla dentro de la fila
    errenkadaTeklak.forEach((tekla) => {
      const botoia = document.createElement("button");
      botoia.textContent = tekla;
      botoia.classList.add("key");
      
      // Guardamos la letra dentro de un atributo dataset para localizarla fácilmente en el DOM
      botoia.dataset.key = tekla;

      // Evento de clic para cuando el usuario pulsa botones del teclado en pantalla
      botoia.addEventListener("click", () => prozesatuTeklaPultsaketa(tekla));
      errenkada.appendChild(botoia);
    });

    teklatua.appendChild(errenkada);
  });
}

// Función central que maneja las pulsaciones (tanto físicas como virtuales)
function prozesatuTeklaPultsaketa(tekla) {
  if (tekla === "Enter") {
    // Solo permitimos validar si ha escrito exactamente todas las letras necesarias
    if (unekoProposamena.length === hitzLuzera) {
      balioztatuProposamena();
    }
  } else if (tekla === "Del") {
    // Borrar la última letra introducida
    if (unekoProposamena.length > 0) {
      unekoProposamena = unekoProposamena.slice(0, -1); // Elimina el último caracter
      eguneratuErrenkada();
    }
  } else {
    // Escribir una nueva letra (siempre que no hayamos alcanzado el límite)
    if (unekoProposamena.length < hitzLuzera) {
      unekoProposamena += tekla; // Añade la letra a la cadena
      eguneratuErrenkada();
    }
  }
}

// Actualiza el texto visual dentro de las casillas mientras el usuario escribe o borra
function eguneratuErrenkada() {
  for (let j = 0; j < hitzLuzera; j++) {
    const laukia = document.getElementById(`laukia-${unekoSaiakera}-${j}`);
    // Pone la letra correspondiente o deja la casilla vacía ""
    laukia.textContent = unekoProposamena[j] || "";
  }
}


// ==========================================
// 5. BALIOZTAPENA ETA AMATIERA (Validación)
// Comprobar letras acertadas/falladas y terminar el juego
// ==========================================

function balioztatuProposamena() {
  // Convertimos las cadenas de texto a Arrays (listas) para poder analizarlas letra por letra
  const helburuArray = helburuHitza.split("");
  const proposamenArray = unekoProposamena.split("");
  
  // Array para guardar el estado de cada posición: "ok" (verde), "existe" (amarillo) o "no" (gris)
  const egoeraEmaitza = new Array(hitzLuzera).fill("no");

  // PRIMERA PASADA: Buscar aciertos exactos ('ok' -> Posición y letra correctas)
  for (let i = 0; i < hitzLuzera; i++) {
    if (proposamenArray[i] === helburuArray[i]) {
      egoeraEmaitza[i] = "ok";
      helburuArray[i] = null; // Tachamos la letra usada para no repetirla en amarillos
    }
  }

  // SEGUNDA PASADA: Buscar letras existentes en otras posiciones ('existe' -> Letra correcta, sitio mal)
  for (let i = 0; i < hitzLuzera; i++) {
    // Solo revisamos las letras que no se hayan marcado ya como "ok"
    if (egoeraEmaitza[i] !== "ok") {
      const indeksea = helburuArray.indexOf(proposamenArray[i]);
      if (indeksea !== -1) {
        egoeraEmaitza[i] = "existe";
        helburuArray[indeksea] = null; // Tachamos la letra para controlar letras repetidas
      }
    }
  }

  // TERCERA PASADA: Colorear las casillas y pintar las teclas del teclado en pantalla
  for (let i = 0; i < hitzLuzera; i++) {
    const laukia = document.getElementById(`laukia-${unekoSaiakera}-${i}`);
    const hizkia = proposamenArray[i];
    const egoera = egoeraEmaitza[i];

    // Añadimos la clase CSS ("ok", "existe", "no") a la casilla para aplicarle el color
    laukia.classList.add(egoera);

    // Buscamos el botón del teclado en pantalla correspondiente a esta letra
    const teklaBotoia = document.querySelector(`.key[data-key="${hizkia}"]`);
    if (teklaBotoia) {
      // Prioridades de color: El verde ("ok") nunca se sobrescribe con amarillo ni gris
      if (!teklaBotoia.classList.contains("ok")) {
        if (egoera === "ok") {
          teklaBotoia.className = "key ok";
        } else if (egoera === "existe" && !teklaBotoia.classList.contains("existe")) {
          teklaBotoia.className = "key existe";
        } else if (egoera === "no" && !teklaBotoia.classList.contains("existe")) {
          teklaBotoia.classList.add("no");
        }
      }
    }
  }

  // CUARTA PASADA: Comprobar condición de victoria o avance de intento
  if (unekoProposamena === helburuHitza) {
    // Ha acertado la palabra completa -> Victoria
    amaituJokoa(true);
  } else {
    unekoSaiakera++; // Avanzamos a la siguiente fila
    unekoProposamena = ""; // Limpiamos la propuesta actual
    
    // Si hemos agotado todos los intentos -> Derrota
    if (unekoSaiakera >= gehienezkoSaiakerak) {
      amaituJokoa(false);
    }
  }
}

// Función que se ejecuta cuando finaliza la partida (por ganar o perder)
function amaituJokoa(irabaziDu) {
  // Ponemos un pequeño retardo (200ms) para que dé tiempo a ver la animación/color de las casillas
  setTimeout(() => {
    // Muestra una ventana de alerta informando del resultado
    alert(irabaziDu ? "Irabazi duzu!" : `Galduta. Hitza hau zen: ${helburuHitza}`);

    // Guarda el resultado en la memoria persistente del navegador
    gordeLocalStorage(irabaziDu ? "irabazi" : "galdu");
    
    // Renderiza la lista con los datos actualizados
    marraztuHistoria();

    // Oculta el juego y muestra la pantalla del historial
    jokoEremua.classList.add("hidden");
    historiaEremua.classList.remove("hidden");
  }, 200);
}

// Guarda la información de la partida en el almacenamiento local del navegador (LocalStorage)
function gordeLocalStorage(emaitza) {
  // Leemos el historial previo o inicializamos un array vacío si es la primera vez
  const historia = JSON.parse(localStorage.getItem("wordle_historia")) || [];

  // Objeto con la estructura de la partida finalizada
  const erregistroa = {
    hitza: helburuHitza,
    saiakerak: unekoSaiakera + (emaitza === "irabazi" ? 1 : 0), // Si gana, cuenta el intento actual
    data: new Date().toLocaleDateString(), // Fecha actual
    emaitza: emaitza // "irabazi" o "galdu"
  };

  // Añadimos el nuevo registro al principio del array (el más reciente primero)
  historia.unshift(erregistroa);
  
  // Guardamos un máximo de 10 partidas guardadas (eliminamos las más antiguas)
  if (historia.length > 10) historia.pop();

  // Guardamos la lista convertida a texto JSON en LocalStorage
  localStorage.setItem("wordle_historia", JSON.stringify(historia));
}

// Dibuja la lista HTML (<li>) leyendo los datos desde LocalStorage
function marraztuHistoria() {
  historiaZerrenda.innerHTML = "";
  const historia = JSON.parse(localStorage.getItem("wordle_historia")) || [];

  // Creamos un elemento <li> por cada registro guardado
  historia.forEach((elementua) => {
    const li = document.createElement("li");
    li.textContent = `[${elementua.data}] Hitza: ${elementua.hitza} | Saiakerak: ${elementua.saiakerak} | Emaitza: ${elementua.emaitza}`;
    historiaZerrenda.appendChild(li);
  });
}