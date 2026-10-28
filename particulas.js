export class Particula {
  constructor(x, y, tamaño, tipo, celebracion = false) {
    this.x = x;
    this.y = y;
    this.tamaño = tamaño;
    this.tipo = tipo;
    this.celebracion = celebracion;
    this.duracion = celebracion ? 3 : 1.8;

    this.velX = (Math.random() - 0.5) * 2.8;
    this.velY = -0.7 - Math.random() * 1.7;

    if (celebracion) {
      this.velX = (Math.random() - 0.5) * 12;
      this.velY = -3 - Math.random() * 8;
    }
    this.vida = 1;
    this.giro = Math.random() * Math.PI * 2;
    this.velGiro = (Math.random() - 0.5) * 0.08;
  }

  actualizar(delta) {
    const paso = delta * 30;
    this.x += this.velX * paso;
    this.y += this.velY * paso;
    this.velX *= Math.pow(0.99, paso);
    this.velY += (this.celebracion ? 0.1 : -0.008) * paso;
    this.giro += this.velGiro * paso;
    this.vida -= delta / this.duracion;
  }

  dibujar(p) {
    const ctx = p.drawingContext;

    ctx.save();

    ctx.translate(this.x, this.y);
    ctx.rotate(this.giro);
    ctx.globalAlpha = Math.max(0, this.vida);

    if (this.tipo === "hoja") {
      this.dibujarHoja(ctx);
    } else if (this.tipo === "estrella") {
      this.dibujarEstrella(ctx);
    } else if (this.tipo === "huella") {
      this.dibujarHuella(ctx);
    } else if (this.tipo === "fantasma") {
      this.dibujarFantasma(ctx);
    }

    ctx.restore();
  }

  dibujarHoja(ctx) {
    const r = this.tamaño / 2;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(r * 1.4, -r * 0.15, 0, r);
    ctx.quadraticCurveTo(-r * 1.1, r * 0.1, 0, -r);
    ctx.fillStyle = "#dc8056";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.65);
    ctx.lineTo(0, r * 1.25);
    ctx.strokeStyle = "#633b24";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  dibujarEstrella(ctx) {
    const puntas = 4;
    const radioExterior = this.tamaño / 2;
    const radioInterior = this.tamaño * 0.12;

    ctx.beginPath();

    for (let i = 0; i < puntas * 2; i++) {
      const angulo = -Math.PI / 2 + (i * Math.PI) / puntas;
      const radio = i % 2 === 0 ? radioExterior : radioInterior;

      const x = Math.cos(angulo) * radio;
      const y = Math.sin(angulo) * radio;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();

    ctx.fillStyle = "#f5eacb";

    ctx.fill();
  }

  dibujarHuella(ctx) {
    const r = this.tamaño / 2;
    ctx.fillStyle = "#f0dba2";
    ctx.beginPath();
    ctx.ellipse(0, r * 0.3, r * 0.48, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const [x, y] of [
      [-0.65, -0.05],
      [-0.25, -0.55],
      [0.25, -0.55],
      [0.65, -0.05],
    ]) {
      ctx.beginPath();
      ctx.ellipse(x * r, y * r, r * 0.2, r * 0.27, x * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  dibujarFantasma(ctx) {
    const r = this.tamaño / 2;

    ctx.beginPath();
    ctx.moveTo(-r, r);
    ctx.lineTo(-r, -r * 0.1);
    ctx.arc(0, -r * 0.1, r, Math.PI, 0);
    ctx.lineTo(r, r);
    ctx.lineTo(r * 0.5, r * 0.7);
    ctx.lineTo(0, r);
    ctx.lineTo(-r * 0.5, r * 0.7);
    ctx.closePath();
    ctx.fillStyle = "#b8d4bf";
    ctx.fill();
    ctx.fillStyle = "#233d34";

    for (const x of [-r * 0.3, r * 0.3]) {
      ctx.beginPath();
      ctx.arc(x, -r * 0.1, r * 0.11, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function crearParticulas(
  particulas,
  x,
  y,
  intensidad = 1,
  anchoBoca = 80,
) {
  const cantidad = Math.min(4, Math.ceil(intensidad * 2));
  const dispersion = Math.max(25, anchoBoca * 1.3);

  for (let i = 0; i < cantidad; i++) {
    const aleatorio = Math.random();

    let tipo;

    if (aleatorio < 0.4) {
      tipo = "hoja";
    } else if (aleatorio < 0.72) {
      tipo = "estrella";
    } else if (aleatorio < 0.94) {
      tipo = "huella";
    } else {
      tipo = "fantasma";
    }

    particulas.push(
      new Particula(
        x + (Math.random() - 0.5) * dispersion,
        y + (Math.random() - 0.5) * 24,
        9 + Math.random() * 15,
        tipo,
      ),
    );
  }

  // Evita que se acumulen demasiadas partículas
  if (particulas.length > 140) {
    particulas.splice(0, particulas.length - 140);
  }
}

export function dibujarParticulas(p, particulas) {
  const delta = Math.min((p.deltaTime || 33) / 1000, 0.05);
  for (let i = particulas.length - 1; i >= 0; i--) {
    const particula = particulas[i];

    particula.actualizar(delta);
    particula.dibujar(p);

    if (particula.vida <= 0) {
      particulas.splice(i, 1);
    }
  }
}

export function crearCelebracion(particulas, ancho, alto) {
  particulas.length = 0;
  for (let i = 0; i < 110; i++) {
    particulas.push(
      new Particula(
        ancho * (0.2 + Math.random() * 0.6),
        alto * 0.6,
        10 + Math.random() * 18,
        i % 9 === 0 ? "fantasma" : i % 3 === 0 ? "hoja" : "estrella",
        true,
      ),
    );
  }
}
