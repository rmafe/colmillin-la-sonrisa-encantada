import {
  FaceLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/+esm";
import { dibujarPerro, obtenerPunto } from "./perro.js";
import {
  crearParticulas,
  dibujarParticulas,
  crearCelebracion,
} from "./particulas.js";

const DURACION = 10;
const INTERVALO_DETECCION = 90; // 11 detecciones por segundo aproximadamente
const elementos = {
  inicio: document.getElementById("pantalla-inicio"),
  carga: document.getElementById("pantalla-carga"),
  final: document.getElementById("pantalla-final"),
  botonInicio: document.getElementById("boton-inicio"),
  botonRepetir: document.getElementById("boton-repetir"),
  botonReiniciar: document.getElementById("boton-reiniciar"),
  botonDetener: document.getElementById("boton-detener"),
  mensajeCarga: document.getElementById("mensaje-carga"),
  mensajeJuego: document.getElementById("mensaje-juego"),
  contador: document.getElementById("contador"),
  barra: document.getElementById("barra-progreso"),
  relleno: document.getElementById("relleno-progreso"),
  sensibilidad: document.getElementById("sensibilidad"),
  valorSensibilidad: document.getElementById("valor-sensibilidad"),
  sonido: document.getElementById("activar-sonido"),
  estado: document.getElementById("estado"),
};

let lienzo;
let camara = null;
let detector = null;
let puntosCara = [];
let puntosSuavizados = [];
let ultimaCara = 0;
let ultimoResultado = 0;
let bocaAbierta = false;
let tiempoCepillado = 0;
let ultimoFotograma = -1;
let ultimaDeteccion = 0;
let ultimaActualizacion = 0;
let ultimoSonido = 0;
let ultimoEfecto = 0;
let iniciando = false;
let jugando = false;
let terminado = false;
let contextoAudio = null;
const particulas = [];

function mostrarPantalla(nombre) {
  for (const clave of ["inicio", "carga", "final"]) {
    elementos[clave].classList.toggle(
      "juego__pantalla--oculta",
      clave !== nombre,
    );
  }
}
function mostrarMensaje(texto, visible = true) {
  if (elementos.mensajeJuego.textContent !== texto)
    elementos.mensajeJuego.textContent = texto;
  elementos.mensajeJuego.classList.toggle("juego__mensaje--oculto", !visible);
}

function actualizarMarcador() {
  elementos.contador.textContent = `${tiempoCepillado.toFixed(1).replace(".", ",")} / ${DURACION} s`;
  const porcentaje = Math.min(
    100,
    Math.round((tiempoCepillado / DURACION) * 100),
  );
  elementos.relleno.style.width = `${porcentaje}%`;
  elementos.barra.setAttribute("aria-valuenow", String(porcentaje));
  elementos.barra.setAttribute(
    "aria-valuetext",
    `${porcentaje}% · ${tiempoCepillado.toFixed(1)} de 10 segundos`,
  );
  elementos.barra.classList.toggle(
    "juego__progreso--activo",
    jugando && bocaAbierta && !terminado,
  );
}

function reiniciarPartida() {
  tiempoCepillado = 0;
  terminado = false;
  bocaAbierta = false;
  puntosCara = [];
  puntosSuavizados = [];
  ultimaCara = 0;
  ultimoResultado = 0;
  particulas.length = 0;
  ultimaActualizacion = performance.now();
  actualizarMarcador();
  mostrarPantalla(null);
  mostrarMensaje("¡Abre la boca para limpiar los colmillos!");
  jugando = true;
  elementos.estado.textContent = "Mira a la cámara y abre la boca.";
}

async function cargarDetector() {
  if (detector) return;
  elementos.mensajeCarga.textContent = "Cargando MediaPipe...";
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm",
  );
  const opciones = {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: false,
  };

  try {
    detector = await FaceLandmarker.createFromOptions(vision, opciones);
  } catch (error) {
    console.warn("GPU no disponible, probando CPU:", error);
    opciones.baseOptions.delegate = "CPU";
    detector = await FaceLandmarker.createFromOptions(vision, opciones);
  }
}
async function iniciarCamara() {
  elementos.mensajeCarga.textContent = "Solicitando acceso a la cámara...";
  const flujo = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 960 },
      height: { ideal: 540 },
      facingMode: "user",
    },
    audio: false,
  });
  const video = document.createElement("video");
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.srcObject = flujo;
  try {
    await video.play();
    if (video.readyState < 2)
      await new Promise((resolve) =>
        video.addEventListener("loadeddata", resolve, { once: true }),
      );
  } catch (error) {
    flujo.getTracks().forEach((pista) => pista.stop());
    throw error;
  }
  camara = video;
}

async function iniciarExperiencia() {
  if (iniciando) return;
  iniciando = true;
  elementos.botonInicio.disabled = true;
  mostrarPantalla("carga");
  elementos.estado.textContent = "Preparando la experiencia...";
  try {
    // Pedir permiso desde el clic, antes de cualquier descarga prolongada.
    const promesaCamara = iniciarCamara();
    const resultados = await Promise.allSettled([
      promesaCamara,
      cargarDetector(),
    ]);
    const error = resultados.find(
      (resultado) => resultado.status === "rejected",
    );
    if (error) throw error.reason;
    elementos.botonDetener.disabled = false;
    elementos.botonReiniciar.disabled = false;
    ultimoFotograma = -1;
    ultimaDeteccion = 0;
    reiniciarPartida();
  } catch (error) {
    console.error("Error de inicio:", error);
    detenerCamara();
    mostrarPantalla("inicio");
    elementos.estado.textContent = `No se pudo iniciar: ${error.message || "revisa los permisos y la consola"}`;
  } finally {
    iniciando = false;
    elementos.botonInicio.disabled = false;
  }
}

function detenerCamara() {
  jugando = false;
  terminado = false;
  bocaAbierta = false;
  if (camara?.srcObject)
    camara.srcObject.getTracks().forEach((pista) => pista.stop());
  if (camara) {
    camara.pause();
    camara.srcObject = null;
  }
  camara = null;
  puntosCara = [];
  particulas.length = 0;
  elementos.botonDetener.disabled = true;
  elementos.botonReiniciar.disabled = true;
  mostrarMensaje("", false);
  mostrarPantalla("inicio");
  elementos.estado.textContent =
    "Cámara detenida. Pulsa «¡Empezar!» para continuar.";
}

function detectarCara(tiempoActual) {
  if (!camara || !detector || camara.readyState < 2) return;
  if (tiempoActual - ultimaDeteccion < INTERVALO_DETECCION) return;
  if (camara.currentTime === ultimoFotograma) return;
  ultimaDeteccion = tiempoActual;
  ultimoFotograma = camara.currentTime;

  try {
    const resultados = detector.detectForVideo(camara, tiempoActual);
    puntosCara = resultados.faceLandmarks?.[0] || [];
    ultimoResultado = tiempoActual;
    if (puntosCara.length) {
      ultimaCara = tiempoActual;
      puntosSuavizados = puntosCara.map((punto, indice) => {
        const anterior = puntosSuavizados[indice];
        return anterior
          ? {
              x: anterior.x + (punto.x - anterior.x) * 0.65,
              y: anterior.y + (punto.y - anterior.y) * 0.65,
            }
          : { x: punto.x, y: punto.y };
      });
    } else puntosSuavizados = [];
    if (puntosCara.length) {
      const arriba = puntosCara[13],
        abajo = puntosCara[14];
      const izquierda = puntosCara[61],
        derecha = puntosCara[291];
      const apertura = Math.hypot(
        (abajo.x - arriba.x) * camara.videoWidth,
        (abajo.y - arriba.y) * camara.videoHeight,
      );
      const anchura = Math.hypot(
        (derecha.x - izquierda.x) * camara.videoWidth,
        (derecha.y - izquierda.y) * camara.videoHeight,
      );
      const proporcion = anchura > 0 ? apertura / anchura : 0;
      const umbral = Number(elementos.sensibilidad.value);
      // Histéresis para evitar parpadeos cerca del umbral.
      bocaAbierta = bocaAbierta
        ? proporcion > umbral * 0.82
        : proporcion > umbral;
    } else bocaAbierta = false;
  } catch (error) {
    console.error("Fallo en detección:", error);
    jugando = false;
    bocaAbierta = false;
    puntosCara = [];
    puntosSuavizados = [];
    actualizarMarcador();
    elementos.estado.textContent =
      "Error de reconocimiento facial. Detén la cámara y vuelve a iniciar.";
    mostrarMensaje("Reconocimiento detenido");
  }
}

function reproducirSonido(frecuencia = 550) {
  if (!elementos.sonido.checked) return;
  try {
    contextoAudio ||= new (window.AudioContext || window.webkitAudioContext)();
    if (contextoAudio.state === "suspended") contextoAudio.resume();
    const oscilador = contextoAudio.createOscillator();
    const volumen = contextoAudio.createGain();
    oscilador.type = "sine";
    oscilador.frequency.setValueAtTime(frecuencia, contextoAudio.currentTime);
    oscilador.frequency.exponentialRampToValueAtTime(
      frecuencia * 1.35,
      contextoAudio.currentTime + 0.11,
    );
    volumen.gain.setValueAtTime(0.035, contextoAudio.currentTime);
    volumen.gain.exponentialRampToValueAtTime(
      0.001,
      contextoAudio.currentTime + 0.14,
    );
    oscilador.connect(volumen).connect(contextoAudio.destination);
    oscilador.start();
    oscilador.stop(contextoAudio.currentTime + 0.15);
  } catch (error) {
    console.warn("Sonido no disponible:", error);
  }
}

function terminarPartida(p) {
  tiempoCepillado = DURACION;
  terminado = true;
  jugando = false;
  actualizarMarcador();
  mostrarPantalla("final");
  mostrarMensaje("", false);
  crearCelebracion(particulas, p.width, p.height);
  reproducirSonido(850);
  elementos.estado.textContent =
    "¡Enhorabuena! Tus colmillos ya tienen una sonrisa encantada.";
}

function actualizarJuego(p, ahora) {
  const diferencia = ultimaActualizacion
    ? Math.min((ahora - ultimaActualizacion) / 1000, 0.1)
    : 0;
  ultimaActualizacion = ahora;
  if (!jugando) return;
  if (
    document.hidden ||
    !puntosCara.length ||
    ahora - ultimaCara > 350 ||
    ahora - ultimoResultado > 350
  ) {
    bocaAbierta = false;
    actualizarMarcador();
    mostrarMensaje("Busca tu cara en la cámara · La magia está en pausa");
    return;
  }
  if (!bocaAbierta) {
    actualizarMarcador();
    mostrarMensaje(
      tiempoCepillado > 0
        ? "Magia en pausa · Abre la boca para continuar"
        : "¡Abre la boca para activar la magia!",
    );
    return;
  }
  mostrarMensaje(
    tiempoCepillado < 3
      ? "¡La magia está limpiando tus colmillos!"
      : tiempoCepillado < 7
        ? "¡Sigue así! Tus colmillos ya brillan"
        : "¡Un poquito más para la sonrisa encantada!",
  );
  tiempoCepillado = Math.min(DURACION, tiempoCepillado + diferencia);
  actualizarMarcador();
  const boca = obtenerPunto(puntosSuavizados, 13, p.width, p.height);

  if (boca && ahora - ultimoEfecto > 65) {
    const a = obtenerPunto(puntosSuavizados, 61, p.width, p.height);
    const b = obtenerPunto(puntosSuavizados, 291, p.width, p.height);
    crearParticulas(
      particulas,
      boca.x,
      boca.y + 10,
      1 + tiempoCepillado / 5,
      Math.hypot(b.x - a.x, b.y - a.y),
    );
    ultimoEfecto = ahora;
  }

  if (ahora - ultimoSonido > 1200) {
    reproducirSonido(480 + tiempoCepillado * 18);
    ultimoSonido = ahora;
  }
  if (tiempoCepillado >= DURACION) terminarPartida(p);
}

const programa = (p) => {
  p.setup = () => {
    lienzo = p.createCanvas(960, 540);
    lienzo.parent("contenedor-canvas");
    p.pixelDensity(1);
    lienzo.elt.setAttribute(
      "aria-label",
      "Vídeo reflejado con filtro de perro vampiro",
    );
    p.frameRate(30);
  };
  p.draw = () => {
    p.background(24, 14, 40);
    const ahora = performance.now();
    if (camara && camara.readyState >= 2) {
      const ctx = p.drawingContext;
      ctx.save();
      try {
        ctx.translate(p.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(camara, 0, 0, p.width, p.height);
      } finally {
        ctx.restore();
      }
      if (jugando) detectarCara(ahora);

      if (puntosSuavizados.length && ahora - ultimaCara < 350)
        dibujarPerro(p, puntosSuavizados, bocaAbierta);
      actualizarJuego(p, ahora);
      dibujarParticulas(p, particulas);
    } else {
      p.noStroke();
      p.fill(145, 111, 171);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(22);
      p.text("🎃 Colmillín", p.width / 2, p.height / 2);
    }
  };
};
new window.p5(programa);

elementos.botonInicio.addEventListener("click", iniciarExperiencia);
elementos.botonDetener.addEventListener("click", detenerCamara);
elementos.botonReiniciar.addEventListener("click", () => {
  if (camara) reiniciarPartida();
});

elementos.botonRepetir.addEventListener("click", () => {
  if (camara) reiniciarPartida();
});

elementos.sensibilidad.addEventListener("input", () => {
  elementos.valorSensibilidad.textContent = Number(elementos.sensibilidad.value)
    .toFixed(2)
    .replace(".", ",");
});

window.addEventListener("pagehide", () => {
  if (camara?.srcObject)
    camara.srcObject.getTracks().forEach((pista) => pista.stop());
});

document.addEventListener("visibilitychange", () => {
  bocaAbierta = false;
  puntosCara = [];
  puntosSuavizados = [];
  ultimaActualizacion = performance.now();
  actualizarMarcador();
});

const botonSalir = document.getElementById("boton-salir");
if (window.__TAURI__) {
  botonSalir.hidden = false;
  botonSalir.addEventListener("click", async () => {
    botonSalir.disabled = true;
    detenerCamara();
    try {
      await window.__TAURI__.window.getCurrentWindow().close();
    } catch (error) {
      console.error("No se pudo cerrar la aplicación:", error);
      elementos.estado.textContent = "No se pudo cerrar la aplicación. Pulsa Alt + F4 para salir.";
      botonSalir.disabled = false;
    }
  });
}
