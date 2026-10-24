# Primera Posición

Curso de violín para empezar desde cero: 13 módulos con explicaciones, ejercicios interactivos que suenan, juegos para aprender el pentagrama, entrenamiento auditivo y herramientas (afinador y metrónomo). Funciona sin conexión y sin instalar nada: es HTML, CSS y JavaScript sin dependencias.

## Cómo abrirla

- **Lo más rápido:** doble clic en `index.html`.
- **Con servidor local (recomendado para el micrófono):** doble clic en `Abrir Primera Posicion.bat`. Sirve la carpeta en `http://localhost:8080` usando PowerShell.

El progreso (objetivos, récords, estrellas, insignias) se guarda en el `localStorage` del navegador, con el prefijo `pp:`. No sale del equipo.

## Estructura

| Ruta | Qué es |
|---|---|
| `index.html` | Portada, mapa de módulos y progreso |
| `modulo-01.html` … `modulo-13.html` | Lecciones (generadas, ver más abajo) |
| `practicar.html` | Panel de práctica con todos los ejercicios |
| `juegos.html` | Defiende la clave, Parejas e insignias |
| `herramientas.html` | Afinador, metrónomo, mapa del mástil |
| `como-estudiar.html` | Método de estudio y bibliografía |
| `css/estilo.css` | Estilos y tokens de diseño (colores de las cuerdas, tipografía) |
| `js/nucleo.js` | Datos de notas, audio, progreso, cabecera, volumen |
| `js/notacion.js` | Pentagrama SVG, mástil (de frente y al tocar), chuleta |
| `js/ejercicios.js` | Ejercicios base: lectura, asociación, ritmo, partituras, micrófono… |
| `js/practica.js` | Cancionero, ejercicios añadidos y panel de práctica |
| `js/oido.js` | Módulo 13: entrenamiento auditivo |
| `js/juegos.js` | Juegos e insignias |
| `js/version.js` | Número de versión y novedades (lo genera `herramientas-dev/nueva_version.py`) |
| `js/voz.js` | Respuestas con la voz en los juegos. Reconocimiento 100 % local en el navegador: no graba ni envía audio; solo guarda (si lo permites) unos números de calibración |
| `fonts/` | Bricolage Grotesque, Atkinson Hyperlegible y Noto Music (licencia SIL OFL) |
| `herramientas-dev/generar_modulos.py` | Genera las páginas de módulo |

## Versiones

La versión actual se ve en la esquina inferior izquierda de todas las páginas; al pulsarla aparecen las novedades. El historial completo está en `CHANGELOG.md`.

Los números siguen el formato `mayor.menor.parche`:

- **parche** (1.5.0 → 1.5.1): arreglos pequeños.
- **menor** (1.5.0 → 1.6.0): algo nuevo, como un ejercicio o un juego.
- **mayor** (1.5.0 → 2.0.0): un cambio grande en toda la web.

Para publicar una versión nueva, desde esta carpeta:

```
python herramientas-dev/nueva_version.py menor "Qué cambia" "Otro cambio"
```

El script sube el número, apunta los cambios con la fecha en `herramientas-dev/versiones.json` y `CHANGELOG.md`, regenera `js/version.js` y pone `?v=X.Y.Z` en todas las páginas para que los navegadores descarguen los archivos nuevos. Si añades `--git` al final, hace también el commit. La versión se sube cada vez que se publica (antes de cada push); no se usan etiquetas de git. Después, súbelo con GitHub Desktop.

## Editar las lecciones

El contenido de los módulos está en `herramientas-dev/generar_modulos.py`. Tras editarlo:

```
python herramientas-dev/generar_modulos.py
```

Las páginas generadas llevan `?v=AAAAMMDDhhmm` en los enlaces a CSS y JS para evitar la caché del navegador. Si cambias un `.js` o el `.css`, actualiza también ese número en `index.html`, `practicar.html` y `juegos.html`.

## Publicarla con HTTPS (para usarla en el móvil)

El micrófono solo funciona en páginas `https://` o en `localhost`. Para usar la web en el móvil con todas sus funciones:

- **GitHub Pages:** sube este repositorio a GitHub y activa Pages en *Settings → Pages* (rama `main`, carpeta raíz).
- **Netlify Drop:** arrastra la carpeta a `app.netlify.com/drop`.
