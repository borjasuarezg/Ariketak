// --- EGOERA ALDAGAIAK ---
let helburuHitza = "";
let gehienezkoSaiakerak = 6;
let hitzLuzera = 5;
let unekoSaiakera = 0;
let unekoProposamena = "";

// --- DOM ELEMENTUAK ---
const konfigInprimakia = document.getElementById("konfig-inprimakia");
const jokoEremua = document.getElementById("joko-eremua");
const taula = document.getElementById("taula");
const teklatua = document.getElementById("teklatua");
const historiaEremua = document.getElementById("historia-eremua");
const historiaZerrenda = document.getElementById("historia-zerrenda");
const btnBerriroJolastu = document.getElementById("btn-berriro-jolastu");

// --- HASIERATZEA ETA EVENTOAK ---

konfigInprimakia.addEventListener("submit", async (e) => {
  e.preventDefault();

  gehienezkoSaiakerak = parseInt(document.getElementById("saiakerak").value);
  hitzLuzera = parseInt(document.getElementById("luzera").value);

  // APIari hitza eskatu
  helburuHitza = await lortuHitza(hitzLuzera);
  console.log("Helburu hitza (pruebas):", helburuHitza);

  // Pantailen ikusgaitasuna aldatu
  konfigInprimakia.classList.add("hidden");
  jokoEremua.classList.remove("hidden");

  // Jokoaren interfazea sortu
  hasieratuTaula();
  hasieratuTeklatua();
});

// Teklatu fisikoa entzun
document.addEventListener("keydown", (e) => {
  if (jokoEremua.classList.contains("hidden")) return;

  const tekla = e.key;

  if (tekla === "Enter") {
    prozesatuTeklaPultsaketa("Enter");
  } else if (tekla === "Backspace" || tekla === "Delete") {
    prozesatuTeklaPultsaketa("Del");
  } else if (/^[a-zA-ZñÑáéíóúÁÉÍÓÚ]$/.test(tekla)) {
    prozesatuTeklaPultsaketa(tekla.toUpperCase());
  }
});

btnBerriroJolastu.addEventListener("click", () => {
  unekoSaiakera = 0;
  unekoProposamena = "";
  historiaEremua.classList.add("hidden");
  konfigInprimakia.classList.remove("hidden");
});

// --- JOKOAREN FUNTZIOAK ---

async function lortuHitza(luzera) {
  try {
    const erantzuna = await fetch(`https://words-api-sy2x.onrender.com/api/word?lang=eu&length=${luzera}&number=1`);
    if (!erantzuna.ok) throw new Error("Errorea eskaeran");
    
    const datuak = await erantzuna.json();
    const hitza = Array.isArray(datuak) ? datuak[0] : (datuak.word || datuak[0]);
    return hitza.toUpperCase();
  } catch (errorea) {
    console.error("Hutsegitea APIan, ordezko hitza erabiltzen:", errorea);
    const ordezkoHitzak = ["CASAS", "PERRO", "GATOS", "PLAZA", "LIBRO"];
    return ordezkoHitzak[0].substring(0, luzera).padEnd(luzera, "A").toUpperCase();
  }
}

function hasieratuTaula() {
  taula.innerHTML = "";
  
  for (let i = 0; i < gehienezkoSaiakerak; i++) {
    const errenkada = document.createElement("div");
    errenkada.classList.add("row");

    for (let j = 0; j < hitzLuzera; j++) {
      const laukia = document.createElement("div");
      laukia.classList.add("tile");
      laukia.id = `laukia-${i}-${j}`;
      errenkada.appendChild(laukia);
    }
    taula.appendChild(errenkada);
  }
}

function hasieratuTeklatua() {
  teklatua.innerHTML = "";
  const diseinua = [
    ["Á", "É", "Í", "Ó", "Ú"],
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"],
    ["Enter", "Z", "X", "C", "V", "B", "N", "M", "Del"]
  ];

  diseinua.forEach((errenkadaTeklak) => {
    const errenkada = document.createElement("div");
    errenkada.classList.add("keyboard-row");

    errenkadaTeklak.forEach((tekla) => {
      const botoia = document.createElement("button");
      botoia.textContent = tekla;
      botoia.classList.add("key");
      botoia.dataset.key = tekla;

      botoia.addEventListener("click", () => prozesatuTeklaPultsaketa(tekla));
      errenkada.appendChild(botoia);
    });

    teklatua.appendChild(errenkada);
  });
}

function prozesatuTeklaPultsaketa(tekla) {
  if (tekla === "Enter") {
    if (unekoProposamena.length === hitzLuzera) {
      balioztatuProposamena();
    }
  } else if (tekla === "Del") {
    if (unekoProposamena.length > 0) {
      unekoProposamena = unekoProposamena.slice(0, -1);
      eguneratuErrenkada();
    }
  } else {
    if (unekoProposamena.length < hitzLuzera) {
      unekoProposamena += tekla;
      eguneratuErrenkada();
    }
  }
}

function eguneratuErrenkada() {
  for (let j = 0; j < hitzLuzera; j++) {
    const laukia = document.getElementById(`laukia-${unekoSaiakera}-${j}`);
    laukia.textContent = unekoProposamena[j] || "";
  }
}

// --- FUNTZIO AMATUAK ETA BALIOZTAPENA ---

function balioztatuProposamena() {
  const helburuArray = helburuHitza.split("");
  const proposamenArray = unekoProposamena.split("");
  const egoeraEmaitza = new Array(hitzLuzera).fill("no");

  // 1. Posizio zuzenak aztertu ('ok' / berdea)
  for (let i = 0; i < hitzLuzera; i++) {
    if (proposamenArray[i] === helburuArray[i]) {
      egoeraEmaitza[i] = "ok";
      helburuArray[i] = null;
    }
  }

  // 2. Beste posiziotan dauden hizkiak aztertu ('existe' / horia)
  for (let i = 0; i < hitzLuzera; i++) {
    if (egoeraEmaitza[i] !== "ok") {
      const indeksea = helburuArray.indexOf(proposamenArray[i]);
      if (indeksea !== -1) {
        egoeraEmaitza[i] = "existe";
        helburuArray[indeksea] = null;
      }
    }
  }

  // 3. Koloreak aplikatu laukiei eta teklatuari
  for (let i = 0; i < hitzLuzera; i++) {
    const laukia = document.getElementById(`laukia-${unekoSaiakera}-${i}`);
    const hizkia = proposamenArray[i];
    const egoera = egoeraEmaitza[i];

    laukia.classList.add(egoera);

    const teklaBotoia = document.querySelector(`.key[data-key="${hizkia}"]`);
    if (teklaBotoia) {
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

  // 4. Egiaztatu garaipena edo saiakera amaiera
  if (unekoProposamena === helburuHitza) {
    amaituJokoa(true);
  } else {
    unekoSaiakera++;
    unekoProposamena = "";
    if (unekoSaiakera >= gehienezkoSaiakerak) {
      amaituJokoa(false);
    }
  }
}

function amaituJokoa(irabaziDu) {
  setTimeout(() => {
    alert(irabaziDu ? "Irabazi duzu!" : `Galduta. Hitza hau zen: ${helburuHitza}`);

    gordeLocalStorage(irabaziDu ? "irabazi" : "galdu");
    marraztuHistoria();

    // Erakutsi historia eta "Berriro jolastu" botoia
    jokoEremua.classList.add("hidden");
    historiaEremua.classList.remove("hidden");
  }, 200);
}

function gordeLocalStorage(emaitza) {
  const historia = JSON.parse(localStorage.getItem("wordle_historia")) || [];

  const erregistroa = {
    hitza: helburuHitza,
    saiakerak: unekoSaiakera + (emaitza === "irabazi" ? 1 : 0),
    data: new Date().toLocaleDateString(),
    emaitza: emaitza
  };

  historia.unshift(erregistroa);
  if (historia.length > 10) historia.pop();

  localStorage.setItem("wordle_historia", JSON.stringify(historia));
}

function marraztuHistoria() {
  historiaZerrenda.innerHTML = "";
  const historia = JSON.parse(localStorage.getItem("wordle_historia")) || [];

  historia.forEach((elementua) => {
    const li = document.createElement("li");
    li.textContent = `[${elementua.data}] Hitza: ${elementua.hitza} | Saiakerak: ${elementua.saiakerak} | Emaitza: ${elementua.emaitza}`;
    historiaZerrenda.appendChild(li);
  });
}