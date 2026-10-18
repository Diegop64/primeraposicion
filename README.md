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
| `fonts/` | Bricolage Grotesque, Atkinson Hyperlegible y Noto Music (licencia SIL OFL) |
| `herramientas-dev/generar_modulos.py` | Genera las páginas de módulo |

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
