// Coordenadas de MediaPipe adaptadas al vídeo
export function obtenerPunto(puntos, indice, ancho, alto) {
  const punto = puntos?.[indice];

  if (!punto) return null;

  return {
    x: ancho * (1 - punto.x),
    y: alto * punto.y,
  };
}

function anguloHorizontal(a, b) {
  return a.x < b.x
    ? Math.atan2(b.y - a.y, b.x - a.x)
    : Math.atan2(a.y - b.y, a.x - b.x);
}

function dibujarOreja(ctx, lado, ancho) {
  ctx.save();

  ctx.translate(lado * ancho * 0.43, 0);

  ctx.rotate(lado * 0.12);

  ctx.scale(lado, 1);

  const tamaño = ancho;

  ctx.beginPath();
  ctx.moveTo(-tamaño * 0.16, tamaño * 0.06);

  ctx.bezierCurveTo(
    -tamaño * 0.3,
    -tamaño * 0.12,
    -tamaño * 0.48,
    -tamaño * 0.43,
    -tamaño * 0.44,
    -tamaño * 0.59,
  );

  ctx.bezierCurveTo(
    -tamaño * 0.22,
    -tamaño * 0.69,
    tamaño * 0.1,
    -tamaño * 0.43,
    tamaño * 0.15,
    -tamaño * 0.15,
  );

  ctx.bezierCurveTo(
    tamaño * 0.19,
    -tamaño * 0.03,
    tamaño * 0.08,
    tamaño * 0.1,
    -tamaño * 0.16,
    tamaño * 0.06,
  );

  ctx.closePath();

  ctx.fillStyle = "#4d2b6f";
  ctx.strokeStyle = "#23143b";
  ctx.lineWidth = tamaño * 0.025;

  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-tamaño * 0.12, -tamaño * 0.03);

  ctx.bezierCurveTo(
    -tamaño * 0.24,
    -tamaño * 0.2,
    -tamaño * 0.38,
    -tamaño * 0.42,
    -tamaño * 0.35,
    -tamaño * 0.52,
  );

  ctx.bezierCurveTo(
    -tamaño * 0.17,
    -tamaño * 0.57,
    tamaño * 0.02,
    -tamaño * 0.34,
    tamaño * 0.06,
    -tamaño * 0.12,
  );

  ctx.closePath();

  ctx.fillStyle = "#c964a2";
  ctx.fill();

  ctx.restore();
}

function dibujarOrejas(ctx, frente, ancho, inclinacion) {
  ctx.save();

  ctx.translate(frente.x, frente.y - ancho * 0.08);

  ctx.rotate(inclinacion);

  const tamañoOreja = ancho * 0.85;

  dibujarOreja(ctx, -1, tamañoOreja);
  dibujarOreja(ctx, 1, tamañoOreja);

  ctx.restore();
}

function dibujarHocico(ctx, nariz, ancho, inclinacion) {
  ctx.save();

  ctx.translate(nariz.x, nariz.y);
  ctx.rotate(inclinacion);

  const a = ancho * 0.42;

  ctx.fillStyle = "rgba(149, 103, 174, 0.88)";

  ctx.beginPath();
  ctx.ellipse(-a * 0.25, a * 0.17, a * 0.315, a * 0.175, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(a * 0.25, a * 0.17, a * 0.315, a * 0.175, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-a * 0.23, -a * 0.08);

  ctx.bezierCurveTo(
    -a * 0.18,
    -a * 0.23,
    a * 0.18,
    -a * 0.23,
    a * 0.23,
    -a * 0.08,
  );

  ctx.bezierCurveTo(a * 0.22, a * 0.06, a * 0.05, a * 0.17, 0, a * 0.18);

  ctx.bezierCurveTo(
    -a * 0.05,
    a * 0.17,
    -a * 0.22,
    a * 0.06,
    -a * 0.23,
    -a * 0.08,
  );

  ctx.closePath();

  ctx.fillStyle = "#2d1d38";
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(-a * 0.07, -a * 0.09, a * 0.05, a * 0.02, 0, 0, Math.PI * 2);

  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.fill();

  ctx.restore();
}

function dibujarColmillos(ctx, puntos, ancho, alto, abierta) {
  if (!abierta) return;

  const izquierda = obtenerPunto(puntos, 61, ancho, alto);
  const derecha = obtenerPunto(puntos, 291, ancho, alto);
  const superior = obtenerPunto(puntos, 13, ancho, alto);
  const inferior = obtenerPunto(puntos, 14, ancho, alto);

  if (!izquierda || !derecha || !superior || !inferior) return;

  const anchoBoca = Math.hypot(
    derecha.x - izquierda.x,
    derecha.y - izquierda.y,
  );

  const apertura = Math.hypot(inferior.x - superior.x, inferior.y - superior.y);

  const altoColmillo = Math.min(anchoBoca * 0.44, apertura * 0.92);

  if (anchoBoca < 8 || altoColmillo < 2) return;

  const angulo = anguloHorizontal(izquierda, derecha);

  ctx.save();

  ctx.translate(superior.x, superior.y);
  ctx.rotate(angulo);

  ctx.fillStyle = "#fffbe8";

  for (const lado of [-1, 1]) {
    const centro = lado * anchoBoca * 0.28;
    const mitad = anchoBoca * 0.11;

    ctx.beginPath();

    ctx.moveTo(centro - mitad, 0);
    ctx.lineTo(centro + mitad, 0);

    ctx.bezierCurveTo(
      centro + mitad * 0.6,
      altoColmillo * 0.55,
      centro,
      altoColmillo * 0.9,
      centro,
      altoColmillo,
    );

    ctx.bezierCurveTo(
      centro - mitad * 0.35,
      altoColmillo * 0.55,
      centro - mitad * 0.6,
      altoColmillo * 0.2,
      centro - mitad,
      0,
    );

    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

export function dibujarPerro(p, puntos, abierta) {
  if (!puntos || puntos.length < 455) return;

  const frente = obtenerPunto(puntos, 10, p.width, p.height);
  const izquierda = obtenerPunto(puntos, 234, p.width, p.height);
  const derecha = obtenerPunto(puntos, 454, p.width, p.height);
  const nariz = obtenerPunto(puntos, 1, p.width, p.height);

  if (!frente || !izquierda || !derecha || !nariz) return;

  const anchoCara = Math.hypot(
    derecha.x - izquierda.x,
    derecha.y - izquierda.y,
  );

  if (!Number.isFinite(anchoCara) || anchoCara < 25) return;

  const inclinacion = anguloHorizontal(izquierda, derecha);

  const ctx = p.drawingContext;

  dibujarOrejas(ctx, frente, anchoCara, inclinacion);
  dibujarHocico(ctx, nariz, anchoCara, inclinacion);
  dibujarColmillos(ctx, puntos, p.width, p.height, abierta);
}
