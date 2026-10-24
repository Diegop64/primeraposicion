"""Crea una versión nueva de Primera Posición.

Uso (desde la carpeta de la web):
    python herramientas-dev/nueva_version.py menor "Qué cambia" ["Otro cambio" ...]
    python herramientas-dev/nueva_version.py parche "Arreglo pequeño"
    python herramientas-dev/nueva_version.py mayor "Cambio grande"
    python herramientas-dev/nueva_version.py --solo-aplicar      (regenera los archivos sin subir la versión)

Añade --git al final para hacer también el commit.

Qué hace:
  1. Sube el número de versión (mayor.menor.parche) en herramientas-dev/versiones.json
     y apunta los cambios con la fecha de hoy.
  2. Escribe js/version.js (lo que muestra la esquina de la página) y CHANGELOG.md.
  3. Pone ?v=X.Y.Z en los enlaces a css y js de todas las páginas, para que el
     navegador descargue los archivos nuevos y no use copias antiguas.
"""
import json, os, re, sys, datetime, subprocess, glob

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATOS = os.path.join(RAIZ, 'herramientas-dev', 'versiones.json')


def cargar():
    with open(DATOS, encoding='utf-8') as f:
        return json.load(f)


def subir(v, tipo):
    ma, me, pa = (int(x) for x in v.split('.'))
    if tipo == 'mayor': return f'{ma + 1}.0.0'
    if tipo == 'menor': return f'{ma}.{me + 1}.0'
    if tipo == 'parche': return f'{ma}.{me}.{pa + 1}'
    sys.exit('El tipo debe ser mayor, menor o parche.')


def aplicar(d):
    v = d['version']
    with open(DATOS, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=2); f.write('\n')
    js = ('/* Generado por herramientas-dev/nueva_version.py: no lo edites a mano */\n'
          'window.PP_VERSION = ' + json.dumps({'version': v, 'fecha': d['historial'][0]['fecha'],
                                               'historial': d['historial'][:8]}, ensure_ascii=False) + ';\n')
    with open(os.path.join(RAIZ, 'js', 'version.js'), 'w', encoding='utf-8') as f:
        f.write(js)
    md = ['# Novedades de Primera Posición', '']
    for h in d['historial']:
        md += [f"## {h['version']} ({h['fecha']})", ''] + [f'- {c}' for c in h['cambios']] + ['']
    with open(os.path.join(RAIZ, 'CHANGELOG.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(md))
    for p in glob.glob(os.path.join(RAIZ, '*.html')):
        with open(p, encoding='utf-8') as f: t = f.read()
        n = re.sub(r'(\.(?:css|js))\?v=[^"\']*', r'\1?v=' + v, t)
        if n != t:
            with open(p, 'w', encoding='utf-8') as f: f.write(n)
    print(f'Versión {v} lista.')


def main(args):
    git = '--git' in args
    args = [a for a in args if a != '--git']
    d = cargar()
    if args and args[0] == '--solo-aplicar':
        aplicar(d); return
    if len(args) < 2:
        sys.exit(__doc__)
    nueva = subir(d['version'], args[0])
    d['version'] = nueva
    d['historial'].insert(0, {'version': nueva, 'fecha': datetime.date.today().isoformat(), 'cambios': args[1:]})
    aplicar(d)
    if git:
        subprocess.run(['git', 'add', '-A'], cwd=RAIZ, check=True)
        subprocess.run(['git', 'commit', '-m', f'Versión {nueva}: ' + args[1]], cwd=RAIZ, check=True)
        print(f'Commit de la versión {nueva} creado. Súbelo con GitHub Desktop (Push origin).')


if __name__ == '__main__':
    main(sys.argv[1:])
