# Colmillín – La sonrisa encantada

Aplicación interactiva desarrollada para la asignatura **Desarrollo de Aplicaciones Interactivas** de la Universitat Oberta de Catalunya (UOC).

## Descripción

Colmillín es una pequeña experiencia interactiva de temática Halloween dirigida a un público infantil. Mediante la cámara y un sistema de detección facial, el usuario se transforma en un perro vampiro y participa en una limpieza mágica de sus colmillos.

El objetivo consiste en acumular diez segundos con la boca abierta. Durante ese tiempo aparecen partículas animadas de hojas y huellas, mientras una barra de progreso indica cuánto falta para completar la actividad.

Si el usuario cierra la boca, el contador se detiene y conserva el progreso conseguido.

## Características

- Reconocimiento facial mediante MediaPipe Face Landmarker.
- Filtro de perro vampiro con orejas, hocico y colmillos.
- Detección de apertura de boca.
- Contador de diez segundos acumulados y barra de progreso.
- Partículas animadas de hojas y huellas.
- Efectos de sonido generados con Web Audio API.
- Control para ajustar la sensibilidad de apertura de la boca.
- Interfaz desarrollada con HTML, CSS y JavaScript.
- Versión de escritorio para Windows mediante Tauri 2.
- Presentación a pantalla completa y botón para salir de la aplicación.

## Tecnologías utilizadas

- **p5.js 2.x:** dibujo y animación.
- **MediaPipe Face Landmarker:** detección de puntos faciales.
- **JavaScript:** lógica e interacción.
- **HTML y CSS:** estructura y diseño de la interfaz.
- **Web Audio API:** generación de efectos de sonido.
- **Tauri 2:** creación de la aplicación de escritorio.

## Ejecución de la versión web

Para ejecutar el proyecto en un navegador, es recomendable utilizar un servidor local en lugar de abrir directamente el archivo HTML.

Desde la carpeta raíz del proyecto:

```bash
python -m http.server 8000
```

Después, abrir:

http://localhost:8000/

El navegador solicitará permiso para utilizar la cámara.

## Ejecución con Tauri

Para trabajar con la versión de escritorio es necesario disponer de Node.js, Rust y las dependencias de compilación de Tauri para Windows.

Instalar las dependencias de JavaScript:

```bash
npm install
```

Iniciar un servidor local desde la raíz del proyecto:

```bash
python -m http.server 8000
```

En otra terminal, ejecutar:

```bash
npx tauri dev
```

La aplicación se abrirá en una ventana de escritorio.

## Compilación

Para generar el ejecutable de Windows, la carpeta `dist` debe contener la versión actualizada de los archivos web.

Ejecutar:

```bash
npx tauri build --no-bundle
```

El ejecutable generado se encontrará normalmente en:

```text
src-tauri/target/release/
```

No es necesario generar un instalador para ejecutar el proyecto.

## Consideraciones

La aplicación necesita acceso a una cámara y permiso del usuario para utilizarla.

Actualmente se cargan recursos de MediaPipe desde servicios externos, por lo que puede ser necesaria una conexión a Internet.

La experiencia está diseñada para una presentación a pantalla completa, tomando como referencia una resolución de 1920 × 1080 píxeles.

## Licencia

Consultar el archivo `LICENSE` del repositorio para conocer las condiciones de uso y distribución.
