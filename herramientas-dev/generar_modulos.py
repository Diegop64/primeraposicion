# Genera las páginas de módulo de Primera Posición a partir de una plantilla común.
import os, html
OUT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

HEAD = '''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="stylesheet" href="css/estilo.css?v=__V__">
</head>
<body data-page="{page}"{extra}>
<div data-header></div>
'''
FOOT = '''<div data-footer></div>
<script src="js/nucleo.js?v=__V__"></script>
<script src="js/notacion.js?v=__V__"></script>
<script src="js/ejercicios.js?v=__V__"></script>
<script src="js/practica.js?v=__V__"></script>
<script src="js/oido.js?v=__V__"></script>
<script src="js/juegos.js?v=__V__"></script>
<script src="js/voz.js?v=__V__"></script>
</body>
</html>
'''

def ex(kind, **attrs):
    a = ''.join(f' data-{k.rstrip("_").replace("_","-")}="{v}"' for k, v in attrs.items())
    return f'<div data-ex="{kind}"{a}></div>'

def call(title, text, kind=''):
    return f'<div class="callout {kind}"><b>{title}</b>{text}</div>'

def checklist(items):
    return '<ul class="checklist">' + ''.join(f'<li>{i}</li>' for i in items) + '</ul>'

def steps(items):
    return '<ol class="steps">' + ''.join(f'<li><div>{i}</div></li>' for i in items) + '</ol>'

def table(head, rows):
    h = ''.join(f'<th>{c}</th>' for c in head)
    r = ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in row) + '</tr>' for row in rows)
    return f'<div class="table-wrap"><table><thead><tr>{h}</tr></thead><tbody>{r}</tbody></table></div>'

def prose(*ps):
    block = ('<ul', '<ol', '<div', '<table', '<p')
    return '<div class="prose">' + ''.join(p if p.startswith(block) else f'<p>{p}</p>' for p in ps) + '</div>'

S = lambda s: f'<span class="str {s.lower()}">{s}</span>'

BOW_SVG = '''<figure class="figure"><div class="scroll"><svg viewBox="0 0 760 120" width="100%" style="min-width:560px" role="img" aria-label="Partes del arco">
<path d="M70 52 Q 400 34 720 48" fill="none" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/>
<line x1="80" y1="74" x2="718" y2="58" stroke="var(--gut)" stroke-width="6"/>
<rect x="62" y="48" width="44" height="30" rx="4" fill="var(--ebony)"/><rect x="40" y="46" width="22" height="12" rx="3" fill="var(--la)"/>
<path d="M712 44 L736 46 L724 64 L714 62 Z" fill="var(--ink)"/>
<g font-size="14" fill="var(--ink)"><text x="14" y="30">Tornillo</text><text x="64" y="106">Nuez, en el talón</text><text x="360" y="28">Vara de madera</text><text x="330" y="98">Crin: lo único que toca la cuerda</text><text x="690" y="98">Punta</text></g>
<g font-size="12" fill="var(--muted)"><text x="150" y="18">mitad inferior</text><text x="520" y="18">mitad superior</text></g></svg></div>
<figcaption>El arco se sujeta por el talón. La crin se tensa con el tornillo: lo justo para que entre un lápiz entre la crin y la vara en el centro del arco.</figcaption></figure>'''

ELBOW_SVG = '''<figure class="figure"><svg viewBox="0 0 520 230" role="img" aria-label="Ángulo del arco para cada cuerda" style="max-width:520px">
<path d="M90 170 Q 260 70 430 170" fill="none" stroke="var(--rule)" stroke-width="14" stroke-linecap="round"/>
<circle cx="170" cy="128" r="9" fill="var(--sol)"/><circle cx="230" cy="112" r="9" fill="var(--re)"/><circle cx="290" cy="112" r="9" fill="var(--la)"/><circle cx="350" cy="128" r="9" fill="var(--mi)"/>
<line x1="60" y1="64" x2="290" y2="195" stroke="var(--sol)" stroke-width="3"/>
<line x1="80" y1="45" x2="370" y2="185" stroke="var(--re)" stroke-width="3" stroke-dasharray="7 5"/>
<line x1="150" y1="40" x2="440" y2="190" stroke="var(--la)" stroke-width="3" stroke-dasharray="2 5"/>
<line x1="230" y1="50" x2="470" y2="200" stroke="var(--mi)" stroke-width="3" stroke-dasharray="12 4 2 4"/>
<g font-size="13" font-weight="700"><text x="20" y="80" fill="var(--sol)">Sol: codo alto</text><text x="410" y="222" fill="var(--mi)">Mi: codo bajo</text></g>
<text x="210" y="222" font-size="12" fill="var(--muted)">puente visto desde el talón del arco</text></svg>
<figcaption>El puente es curvo. Cada cuerda tiene su propio ángulo de arco, y ese ángulo lo da la altura del codo derecho: Sol arriba, Mi abajo. La muñeca acompaña, no decide.</figcaption></figure>'''

LANES_SVG = '''<figure class="figure"><svg viewBox="0 0 340 170" role="img" aria-label="Cinco carriles entre el puente y el diapasón" style="max-width:420px">
<rect x="20" y="10" width="300" height="16" rx="3" fill="var(--la)"/><text x="170" y="22" text-anchor="middle" font-size="11" fill="var(--paper)" font-weight="700">puente</text>
<g font-size="11" fill="var(--muted)"><text x="4" y="45">1</text><text x="4" y="69">2</text><text x="4" y="93">3</text><text x="4" y="117">4</text><text x="4" y="141">5</text></g>
<rect x="20" y="81" width="300" height="18" rx="4" fill="var(--ok-bg)" stroke="var(--ok)"/>
<rect x="20" y="150" width="300" height="16" rx="3" fill="var(--ebony)"/><text x="170" y="162" text-anchor="middle" font-size="11" fill="var(--ebony-ink)">diapasón</text>
<line x1="80" y1="10" x2="80" y2="166" stroke="var(--sol)" stroke-width="2"/><line x1="140" y1="10" x2="140" y2="166" stroke="var(--re)" stroke-width="2"/><line x1="200" y1="10" x2="200" y2="166" stroke="var(--la)" stroke-width="2"/><line x1="260" y1="10" x2="260" y2="166" stroke="var(--mi)" stroke-width="2"/></svg>
<figcaption>Entre el puente y el diapasón hay cinco carriles imaginarios. Para empezar, el arco va por el carril 3.</figcaption></figure>'''

PATTERN_SVG = lambda which: f'''<figure class="figure"><svg viewBox="0 0 520 130" role="img" aria-label="Patrón de dedos {which}" style="max-width:520px">
<line x1="20" y1="60" x2="500" y2="60" stroke="var(--la)" stroke-width="3"/>
<rect x="14" y="44" width="10" height="32" fill="var(--gut)"/>
{''.join(f'<circle cx="{x}" cy="60" r="18" fill="{"var(--paper)" if t=="0" else "var(--ebony)"}" stroke="var(--la)" stroke-width="2.5"/><text x="{x}" y="66" text-anchor="middle" font-size="16" font-weight="700" fill="{"var(--ink)" if t=="0" else "var(--ebony-ink)"}">{t}</text>' for x,t in ([(40,'0'),(150,'1'),(260,'2'),(300,'3')] if which=='0-1-23' else [(40,'0'),(150,'1'),(190,'2'),(300,'3')]))}
{''.join(f'<text x="{x}" y="108" text-anchor="middle" font-size="13" fill="var(--muted)">{t}</text>' for x,t in ([(95,'tono'),(205,'tono'),(280,'semitono')] if which=='0-1-23' else [(95,'tono'),(170,'semitono'),(245,'tono')]))}
<text x="420" y="66" font-size="14" fill="var(--ink)" font-weight="700">{'2 alto, pegado al 3' if which=='0-1-23' else '2 bajo, pegado al 1'}</text></svg>
<figcaption>{'Patrón 0‑1‑23: entre 1 y 2 hay un tono (cabe un dedo), y el 2 toca al 3.' if which=='0-1-23' else 'Patrón 0‑12‑3: el 2 toca al 1, y entre 2 y 3 hay un tono.'}</figcaption></figure>'''

MODS = {}

# ---------------------------------------------------------------- 1
MODS[1] = dict(title='Conoce tu violín', lead='Antes de tocar, conoce tu instrumento: cómo se llama cada parte, cómo se cuida y cómo suenan sus cuatro cuerdas. Un violín bien cuidado y bien afinado hace que todo lo demás sea más fácil.', lessons=[
 ('partes', 'Las partes del violín', prose(
   'Tu profesor va a nombrar estas partes constantemente: "apoya el pulgar junto a la cejilla", "el arco paralelo al puente". Conocerlas te ahorra tiempo en cada clase.') + ex('partes-violin') ),
 ('arco', 'El arco', prose(
   'El arco tiene una vara de madera y una cinta de crin de caballo. Lo único que toca la cuerda es la crin. La madera nunca debe rozar la cuerda.') + BOW_SVG + checklist([
   'Antes de tocar, tensa la crin girando el tornillo hacia la derecha hasta que entre un lápiz entre la crin y la vara en el centro.',
   'Al guardar el arco, aflójala siempre girando a la izquierda. Una crin tensa todo el día deforma la vara.',
   'No toques la crin con los dedos: la grasa de la piel hace que deje de agarrar la cuerda.'])),
 ('colofonia', 'La colofonia', prose(
   'La crin sola resbala sobre la cuerda y no suena. La colofonia es una resina que crea fricción: la crin "agarra" la cuerda, la arrastra un poco, la suelta, y así cientos de veces por segundo. Esa vibración es el sonido del violín.',
   '<ul><li>Pasa la colofonia a lo largo de toda la crin, del talón a la punta, tres o cuatro veces.</li><li>Un arco nuevo necesita mucha más la primera vez, hasta que suene.</li><li>Si el sonido se vuelve débil y silbante, probablemente le falta colofonia.</li><li>Después de tocar, limpia el polvo blanco de las cuerdas y de la tapa con un paño seco y suave.</li></ul>')),
 ('cuerdas', 'Las cuatro cuerdas y la afinación', prose(
   f'De la más grave a la más aguda: {S("Sol")}, {S("Re")}, {S("La")} y {S("Mi")}. Están separadas por intervalos de quinta. En toda la web cada cuerda tiene su color, el mismo en los dibujos del mástil y en los números de dedo de las partituras.',
   'Para afinar se usa primero el La y después las demás. Los tensores del cordal sirven para la afinación fina, y son los que vas a usar tú. Las clavijas se mueven solo para cambios grandes. Al principio, que las mueva un adulto o tu profesor: una cuerda tensada de más se rompe, y un puente que se inclina puede caerse.') +
   ex('afinador') + call('Truco de profesor', 'Si al afinar con el tensor la cuerda sube y sube sin llegar, para: el tensor puede estar al final de su recorrido. Desenróscalo un poco y pide a un adulto que ajuste la clavija.', 'teacher')),
 ('cuidados', 'Cuidar el violín', checklist([
   'Guárdalo siempre en su estuche y cerrado. La mayoría de los violines rotos se caen de una silla.',
   'Evita el calor y los cambios bruscos de temperatura: nunca en el coche al sol ni junto a un radiador.',
   'Mira el puente de vez en cuando desde un lado. Debe estar recto, perpendicular a la tapa. Si se inclina hacia el diapasón, pide ayuda.',
   'Cógelo por el mástil o por los aros, no por el puente ni por las cuerdas.',
   'Limpia la colofonia después de cada sesión.']))
])

# ---------------------------------------------------------------- 2
MODS[2] = dict(title='Postura y sujeción', lead='El violín se sujeta con el cuerpo en equilibrio, no con fuerza. Una buena postura evita dolores, libera los brazos y hace que el sonido salga más fácil.', lessons=[
 ('porque', 'Por qué importa la postura', prose(
   'Casi todos los grandes pedagogos del violín coinciden en una idea: el movimiento debe ser libre y sin tensiones innecesarias. Paul Rolland construyó todo su método alrededor de esa idea, y Ivan Galamian hablaba de la "correlación entre mente y músculo": el cuerpo solo hace bien lo que la cabeza le pide si no está bloqueado.',
   'Si aprietas el cuello, el hombro o el pulgar, el brazo pierde movilidad, el sonido se vuelve duro y al rato duele. Por eso empezamos aquí, aunque todavía no suene ninguna nota.')),
 ('cuerpo', 'De pie y en equilibrio', checklist([
   'Pies separados al ancho de los hombros, el izquierdo un poco adelantado. El peso, repartido entre los dos.',
   'Rodillas sueltas, nunca bloqueadas hacia atrás.',
   'Espalda alta y relajada, como si un hilo tirara de tu cabeza hacia el techo.',
   'Si tocas sentado: en el borde de la silla, los dos pies en el suelo, sin apoyarte en el respaldo.'])),
 ('colocar', 'Colocar el violín', steps([
   'Posición de descanso: sostén el violín bajo el brazo derecho, con las cuerdas mirando hacia fuera.',
   'Con la mano izquierda cógelo por el cuerpo y llévalo al hombro izquierdo.',
   'Apóyalo sobre la clavícula. Gira un poco la cabeza a la izquierda y deja caer la mandíbula sobre la mentonera, sin apretar los dientes.',
   'La voluta mira al frente y algo a la izquierda, más o menos a la altura de la nariz.',
   'El codo izquierdo queda debajo del violín, no pegado al cuerpo.']) +
   call('La prueba de soltar', 'Con el violín colocado, suelta la mano izquierda un segundo. Si se mantiene solo con la cabeza y el hombro, la mano queda libre para tocar. Si se cae o tienes que apretar mucho, revisa la altura de la almohadilla u hombrera con tu profesor.', 'teacher')),
 ('mano', 'La mano izquierda, sin pisar todavía', checklist([
   'Muñeca recta, siguiendo la línea del antebrazo. No la apoyes contra el mástil.',
   'Pulgar suelto, más o menos frente al dedo 1 o 2. El mástil no se aprieta: se acuna entre el pulgar y la base del índice.',
   'Dedos redondos, como si sujetaras una pelota pequeña, por encima de las cuerdas.',
   'Uñas de la mano izquierda cortas: se pisa con la yema.'])),
 ('pizzicato', 'Pizzicato: tus primeras notas', prose(
   'Pizzicato significa pellizcar la cuerda con el dedo en lugar de usar el arco. Es la mejor forma de oír las cuerdas mientras te acostumbras a la postura.',
   '<ul><li>Apoya el pulgar derecho en la esquina del diapasón, cerca del final.</li><li>Pellizca con la yema del índice, tirando de la cuerda un poco hacia un lado.</li><li>Di el nombre de cada cuerda en voz alta mientras la tocas.</li></ul>') +
   ex('rutina', rutina='postura')),
 ('errores', 'Errores frecuentes', table(['Lo que pasa', 'Por qué', 'Cómo arreglarlo'], [
   ['Duele el cuello o el hombro', 'Aprietas con la cabeza o subes el hombro', 'Para y sacude. Revisa la almohadilla. Sesiones de 10 minutos.'],
   ['La muñeca se dobla hacia dentro', 'La mano sostiene el violín', 'Haz la prueba de soltar: la cabeza sostiene, la mano solo toca.'],
   ['La voluta cae hacia el suelo', 'Cansancio del brazo izquierdo', 'Descansa más a menudo. La voluta, siempre a la altura de la nariz.'],
   ['El pulgar aprieta el mástil', 'Miedo a que se caiga', 'Mueve el pulgar arriba y abajo mientras tocas: si puede moverse, no aprieta.']]))
])

# ---------------------------------------------------------------- 3
MODS[3] = dict(title='La mano del arco', lead='El agarre del arco es lo que más tarda en sentirse natural, y lo que más influye en tu sonido. Lo vamos a construir primero con un lápiz y después con el arco.', lessons=[
 ('agarre', 'El agarre paso a paso', prose('Esta es la forma de sujetar el arco más extendida en la enseñanza actual, a veces llamada franco‑belga. La mano tiene que quedar redonda, blanda y equilibrada.') + steps([
   '<b>Pulgar:</b> doblado hacia fuera, con la punta entre la nuez y la vara. Nunca estirado.',
   '<b>Dedo medio:</b> frente al pulgar, al otro lado de la vara. Pulgar y medio forman un pequeño círculo.',
   '<b>Anular:</b> cuelga junto al medio, sobre la nuez.',
   '<b>Índice:</b> apoyado en la vara por la segunda falange, un poco separado de los demás. Por aquí pasará el peso del brazo.',
   '<b>Meñique:</b> curvado, con la punta encima de la vara. Equilibra el arco cuando tocas cerca del talón.']) +
   call('El conejito', 'Junta pulgar, medio y anular: es la boca. Estira índice y meñique: son las orejas. Ahora mete el lápiz en la boca y relaja las orejas sobre él. Esa es tu mano de arco.', 'teacher')),
 ('lapiz', 'Ejercicios con lápiz', prose('Con un lápiz pesa poco y puedes centrarte en la flexibilidad de los dedos. Son ejercicios clásicos de muchos métodos, entre ellos los de Simon Fischer en <i>Basics</i>.') + checklist([
   '<b>Limpiaparabrisas:</b> lápiz vertical; muévelo a izquierda y derecha solo con los dedos.',
   '<b>Arañita:</b> sube los dedos por el lápiz hasta arriba y bájalos sin que se caiga.',
   '<b>Pulgar flexible:</b> dobla y estira el pulgar diez veces mientras sujetas el lápiz.',
   '<b>Molinillo:</b> gira el lápiz de horizontal a vertical y vuelve, sin perder el agarre.']) + ex('rutina', rutina='arco')),
 ('arco', 'Del lápiz al arco', prose(
   'Pasa el mismo agarre al arco. Al principio es normal sentir que pesa y que se va hacia la punta: el meñique y el pulgar lo equilibran.',
   '<ul><li>Sostén el arco en vertical delante de ti, 30 segundos, con la mano blanda.</li><li>Apoya la vara sobre tu hombro izquierdo y desliza la mano del talón hacia el centro y vuelta, sin cambiar la forma de la mano.</li><li>Comprueba los nudillos: si están blancos, aprietas.</li></ul>')),
 ('errores', 'Errores frecuentes', table(['Lo que pasa', 'Cómo arreglarlo'], [
   ['Pulgar estirado y rígido', 'Vuelve al lápiz. El pulgar siempre doblado; si se bloquea, haz el ejercicio de pulgar flexible.'],
   ['Meñique estirado', 'Imagina que el meñique es un muelle: curvado y con la punta sobre la vara.'],
   ['Agarrar el arco por el centro de la vara', 'La mano va en el talón. Usa la nuez como guía para el dedo medio.'],
   ['Los dedos juntos y apretados', 'Separa un poco el índice de los demás: es el que transmite el peso.'],
   ['La muñeca cae hacia abajo', 'La muñeca sigue la línea del antebrazo, ni hundida ni levantada.']]))
])

# ---------------------------------------------------------------- 4
MODS[4] = dict(title='Primer sonido', lead='Sacar un sonido limpio es cuestión de equilibrar tres cosas: la velocidad del arco, el peso del brazo y el sitio donde el arco toca la cuerda. Todo el módulo es en cuerdas al aire, para que la mano izquierda no te distraiga.', lessons=[
 ('factores', 'Los tres factores del sonido', prose(
   'Ivan Galamian, uno de los profesores de violín más influyentes del siglo XX, explicó el sonido con tres factores que dependen unos de otros: la <b>velocidad</b> del arco, el <b>peso</b> (o presión) que pones sobre la cuerda y el <b>punto de contacto</b>, es decir, a qué distancia del puente pasa el arco.',
   'La regla es sencilla: cuanto más cerca del puente, más peso y menos velocidad necesitas. Cuanto más cerca del diapasón, menos peso y más velocidad. Si un factor cambia, los otros dos tienen que acompañar.') +
   LANES_SVG + ex('lab-sonido')),
 ('recto', 'Un arco recto', prose(
   'El arco debe ir paralelo al puente durante todo el recorrido. Para eso el brazo no se mueve en línea recta: se abre como una puerta.',
   '<ul><li><b>Arco abajo</b> (símbolo ⊓): del talón a la punta. El antebrazo se abre y, al llegar a la punta, se adelanta un poco.</li><li><b>Arco arriba</b> (símbolo V): de la punta al talón. El brazo se cierra.</li><li>Practica frente a un espejo, mirando que el arco no se vaya hacia el diapasón.</li><li>Empieza con arcos cortos en la mitad del arco y alárgalos poco a poco.</li></ul>')),
 ('cambio', 'Cambiar de cuerda', prose('Cambiar de cuerda es cambiar la altura del codo derecho. Antes de mover el arco, busca la altura exacta de cada cuerda con el arco quieto.') + ELBOW_SVG),
 ('practica', 'Ejercicios en cuerdas al aire', prose('Toca con el metrónomo a 60, cuatro pulsos por arco en las redondas. Cuenta en voz alta. Las notas debajo del pentagrama son el dedo: 0 significa cuerda al aire.') +
   ex('partitura', song='aire-1') + ex('partitura', song='aire-2') +
   call('Cómo saber si está bien', 'Grábate con el móvil y escucha. Un buen sonido en cuerda al aire es parejo de principio a fin del arco, sin chirridos al cambiar de dirección y sin que suene la cuerda de al lado.', 'teacher'))
])

# ---------------------------------------------------------------- 5
MODS[5] = dict(title='El pentagrama', lead='Leer música es como leer un mapa: cada línea y cada espacio es un sitio, y cada sitio es una nota. En este módulo aprendes a orientarte en ese mapa.', lessons=[
 ('mapa', 'Cinco líneas y cuatro espacios', prose(
   'El pentagrama tiene cinco líneas y cuatro espacios entre ellas. Siempre se cuentan de abajo arriba: la primera línea es la de abajo.',
   'Cuanto más arriba está una nota, más aguda suena. Cada salto de línea a espacio, o de espacio a línea, es una nota más: Do, Re, Mi, Fa, Sol, La, Si, y otra vez Do.',
   'El violín se escribe en <b>clave de sol</b>. La clave nace en la segunda línea y la rodea: le dice a esa línea que es Sol. Desde ahí se deduce todo lo demás.')),
 ('lineas', 'Líneas y espacios', table(['', 'De abajo arriba', 'Para recordarlo'], [
   ['Líneas', 'Mi, Sol, Si, Re, Fa', '"Mi Sol Siempre Respira Fuerte"'],
   ['Espacios', 'Fa, La, Do, Mi', '"FaLaDoMi" se lee casi como una palabra']]) + ex('linea-espacio')),
 ('adicionales', 'Líneas adicionales', prose(
   f'El violín baja más de lo que cabe en el pentagrama. Las notas de la cuerda {S("Sol")} se escriben por debajo, con pequeñas <b>líneas adicionales</b> que prolongan el pentagrama. Se leen igual: línea, espacio, línea...',
   'Debajo de la primera línea (Mi) está Re, en el espacio de debajo. Después Do en la primera línea adicional, Si debajo de ella, La en la segunda línea adicional y Sol debajo.')),
 ('aire', 'Tus cuatro puntos de referencia', prose(
   'Las cuatro cuerdas al aire son tus puntos fijos en el pentagrama. Apréndetelos de memoria y el resto de notas las encontrarás contando desde ellos.',
   f'<ul><li>{S("Sol")}: debajo del pentagrama, colgando de dos líneas adicionales.</li><li>{S("Re")}: justo debajo de la primera línea.</li><li>{S("La")}: segundo espacio.</li><li>{S("Mi")}: cuarto espacio, el de arriba del todo.</li></ul>') +
   ex('quiz-nota', pool='open', title='¿Qué cuerda al aire es?')),
 ('todas', 'Todas las notas, de Sol grave a Re agudo', prose(
   'Con la clave de sol, las líneas y los espacios, ya puedes leer cualquier nota que toques en el violín durante los primeros años. Aquí están todas las notas naturales, desde el Sol grave de la cuerda más gorda hasta el Re agudo de la cuerda Mi, con su nombre encima.',
   'Las dos más agudas, Do y Re, se tocan subiendo la mano a la tercera posición. Las verás escritas a menudo, así que conviene reconocerlas ya.') +
   ex('referencia', pool='naturales', title='Las notas naturales del violín') +
   ex('quiz-nota', pool='naturales') +
   prose('Ahora al revés: escucha y reconoce en el papel lo que has oído. Unir lo que oyes con lo que lees es la base de la lectura musical.') + ex('dictado', pool='naturales')),
 ('juega', 'A jugar', prose('Leer notas es como leer palabras: al principio se deletrea y con práctica se reconoce de un vistazo. Estos juegos están hechos para repetir mucho sin aburrirse. Empieza por el primer mundo de Defiende la clave y ve desbloqueando los demás.') + ex('defiende') + ex('parejas') + prose('Tienes más juegos e insignias en la página <a href="juegos.html">Juegos</a>.')),
 ('intervalos', 'Leer por saltos, no nota a nota', prose(
   'Los buenos lectores no nombran cada nota: miran la distancia con la anterior. Si la nota sube de una línea al espacio de encima, es la nota siguiente. Si salta de una línea a la línea de encima, se ha saltado una.',
   'Practica así: localiza una cuerda al aire que conozcas y cuenta los pasos desde ella. Con el tiempo, el ojo ve la forma de la melodía sin contar.') +
   ex('reto-60', pool='naturales'))
])

# ---------------------------------------------------------------- 6
MODS[6] = dict(title='Ritmo y pulso', lead='Una nota no es solo un sitio en el pentagrama: también es un tiempo. Aquí aprendes cuánto dura cada figura y a mantener el pulso sin correr.', lessons=[
 ('pulso', 'El pulso', prose(
   'El pulso es el latido regular de la música, como un reloj. Toda la música se mide en pulsos. El metrónomo marca ese pulso para que no corras ni te frenes.',
   'Antes de tocar, da palmas con el metrónomo a 60 (un pulso por segundo). Después camina por la habitación pisando en cada clic.') + ex('metronomo')),
 ('figuras', 'Las figuras', prose('Cada figura dura un número de pulsos. La forma de la nota te lo dice: hueca o rellena, con plica o sin ella.') +
   table(['Figura', 'Pulsos', 'Cómo es'], [['Redonda', '4', 'Hueca, sin plica'], ['Blanca', '2', 'Hueca, con plica'], ['Negra', '1', 'Rellena, con plica'], ['Silencio de negra', '1 sin sonar', 'Un rayo en zigzag']]) +
   ex('figuras', count='4')),
 ('compas', 'El compás', prose(
   'Los pulsos se agrupan en compases, separados por barras verticales. Los dos números al principio de la partitura son el compás: el de arriba dice cuántos pulsos tiene cada compás.',
   '<ul><li><b>4/4:</b> cuatro pulsos. Se cuenta "1, 2, 3, 4". El primero es el más fuerte.</li><li><b>3/4:</b> tres pulsos, como un vals. "1, 2, 3".</li></ul>',
   'Cuenta siempre en voz alta al principio. Parece infantil, pero es lo que hacen los músicos profesionales cuando un ritmo es difícil.') +
   ex('completa-compas', level='1') + ex('partitura', song='vals-aire')),
 ('palmas', 'Lee el ritmo y márcalo', ex('palmas', levels='1')),
 ('arco', 'Ritmo con el arco', prose('En los silencios el arco se para sobre la cuerda, sin levantarlo, y espera. Así estás preparado para la nota siguiente.') +
   ex('partitura', song='aire-3'))
])

# ---------------------------------------------------------------- 7
MODS[7] = dict(title='Dedos 1, 2 y 3', lead='Ahora la mano izquierda empieza a trabajar. Con tres dedos y un único patrón vas a poder tocar ocho notas nuevas.', lessons=[
 ('forma', 'La forma de la mano', checklist([
   'Los dedos caen sobre la cuerda desde el nudillo, como pequeños martillos, y pisan con la yema.',
   'La mano mantiene su forma redonda: no aplastes los dedos.',
   'La muñeca sigue recta y el pulgar suelto.',
   'Pisa lo justo para que la cuerda toque el diapasón. Más fuerza no da mejor sonido.']) +
   call('Las cintas del diapasón', 'Muchos profesores pegan cintas finas en el diapasón para marcar dónde va cada dedo. Ayudan al principio, pero la afinación la decide tu oído: escucha siempre si la nota suena bien, aunque el dedo esté sobre la cinta.', 'teacher')),
 ('patron', 'El patrón 0‑1‑23', prose(
   'En las cuerdas La y Mi, y también en Re, el primer patrón que se aprende es siempre el mismo: tono entre la cuerda al aire y el dedo 1, tono entre 1 y 2, y semitono entre 2 y 3. Es decir, el dedo 2 va <b>alto</b>, pegado al 3.') + PATTERN_SVG('0-1-23') +
   table(['Cuerda', '0', '1', '2 alto', '3'], [[S('La'), 'La', 'Si', 'Do♯', 'Re'], [S('Mi'), 'Mi', 'Fa♯', 'Sol♯', 'La'], [S('Re'), 'Re', 'Mi', 'Fa♯', 'Sol']])),
 ('base', 'Dedos de base', prose(
   'Cuando subes, deja los dedos puestos: si tocas el 3, el 1 y el 2 siguen en la cuerda. Se llaman dedos de base. Así la mano conserva su forma y la afinación es más estable.',
   'Cuando bajas, levanta solo el dedo que deja de sonar. Los de debajo ya están en su sitio.')),
 ('explora', 'Explora las notas', ex('explorador', pool='la_mi', title='Cuerdas La y Mi')),
 ('tocar', 'A tocar', ex('partitura', song='dedos-la') + ex('partitura', song='dedos-mi')),
 ('asocia', 'Del papel al dedo', ex('asociacion', pools='la_mi,re_la,sol_re')),
 ('afinar', 'Comprueba tu afinación', prose(
   f'El dedo 3 en la cuerda {S("La")} da Re, la misma nota que la cuerda {S("Re")} al aire, una octava más aguda. Si está bien afinado, la cuerda Re vibra sola por simpatía y el violín resuena más. Usa esa resonancia como guía.') +
   ex('toca-nota', pool='la_mi') + ex('dictado', pool='la_mi')),
 ('piezas', 'Tus primeras piezas', prose('Con el patrón 0‑1‑23 en dos cuerdas ya puedes tocar melodías completas. Aprende cada una por frases y usa el botón "Seguir con micrófono": la partitura solo avanza cuando la nota suena afinada.') +
   ex('partitura', song='mary') + ex('partitura', song='hanschen') + ex('partitura', song='estrellita'))
])

# ---------------------------------------------------------------- 8
MODS[8] = dict(title='Primera posición completa', lead='El mismo patrón de dedos funciona en las cuatro cuerdas. Al terminar este módulo sabrás dónde se escribe y dónde se toca cada nota de la primera posición.', lessons=[
 ('mapa', 'El mapa completo', prose(
   f'En la cuerda {S("Sol")} el dedo 2 también va alto: Sol, La, Si y Do. Con eso ya tienes dieciséis notas, de Sol grave a La agudo.') +
   table(['Cuerda', '0', '1', '2 alto', '3'], [[S('Sol'), 'Sol', 'La', 'Si', 'Do'], [S('Re'), 'Re', 'Mi', 'Fa♯', 'Sol'], [S('La'), 'La', 'Si', 'Do♯', 'Re'], [S('Mi'), 'Mi', 'Fa♯', 'Sol♯', 'La']]) +
   ex('explorador', pool='alto', start='B3', title='Primera posición, dedo 2 alto')),
 ('referencia', 'Partitura de referencia', ex('referencia', pool='alto')),
 ('juega', 'Juega en el mástil', prose('En Defiende la clave elige el modo "En el mástil": en lugar del nombre, pulsas dónde se toca cada nota. Y si tienes el violín a mano, el modo "Con mi violín" te deja destruir las notas tocándolas de verdad.') + ex('defiende') + ex('parejas')),
 ('lectura', 'Lectura rápida', prose('El objetivo es que nombrar una nota sea automático. Juega cinco minutos al día, mejor que media hora un solo día.') + ex('quiz-nota', pool='alto') + ex('reto-60', pool='alto')),
 ('asocia', 'Asociación con las cuatro cuerdas', ex('asociacion', pools='alto,sol_re,re_la,la_mi')),
 ('tocar', 'A tocar', ex('partitura', song='dedos-re') + ex('toca-nota', pool='alto')),
 ('oido', 'Oído y lectura juntos', prose('Un buen lector oye por dentro lo que ve escrito. Este ejercicio entrena justo eso: comparar lo que suena con lo que pone el papel.') + ex('encuentra-error', keys='Re,La')),
 ('piezas', 'Piezas en las cuerdas Re y La', ex('partitura', song='rhody') + ex('partitura', song='jingle'))
])

# ---------------------------------------------------------------- 9
MODS[9] = dict(title='Escalas y armaduras', lead='Las escalas son el ejercicio diario de todos los violinistas, desde el primer año hasta el último. Te enseñan afinación, forma de mano y tonalidad a la vez.', lessons=[
 ('mayor', 'Qué es una escala mayor', prose(
   'Una escala mayor son ocho notas seguidas con una distancia fija entre ellas: tono, tono, semitono, tono, tono, tono, semitono.',
   'Fíjate en algo útil: esa fórmula está hecha de dos mitades iguales (tono, tono, semitono), unidas por un tono. Y "tono, tono, semitono" es exactamente tu patrón 0‑1‑23. Por eso una escala de una octava en el violín es el mismo patrón en dos cuerdas seguidas.')),
 ('armadura', 'La armadura', prose(
   'Para que la fórmula funcione empezando en La, Re o Sol hacen falta sostenidos. En lugar de escribirlos en cada nota, se ponen una vez al principio de cada línea, junto a la clave: es la <b>armadura</b>, y vale para toda la pieza.',
   'Los sostenidos siempre aparecen en el mismo orden: Fa, Do, Sol, Re...') +
   table(['Tonalidad', 'Armadura', 'Dónde se nota en el violín'], [['Sol mayor', 'Fa♯', 'Dedo 2 alto en la cuerda Re'], ['Re mayor', 'Fa♯, Do♯', 'Dedo 2 alto en Re y en La'], ['La mayor', 'Fa♯, Do♯, Sol♯', 'Dedo 2 alto en La y en Mi']]) + ex('tonalidad')),
 ('tocar', 'Tres escalas', ex('partitura', song='la-mayor') + ex('partitura', song='re-mayor') + ex('partitura', song='sol-mayor-1') + ex('partitura', song='arpegios')),
 ('estudiar', 'Cómo estudiar una escala', checklist([
   'Primero lenta, una nota por arco, cuatro pulsos cada nota.',
   'Escucha el dedo 3: debe sonar igual que la cuerda al aire siguiente, una octava más aguda o igual.',
   'Pon la nota de referencia del afinador (la tónica) sonando de fondo y escucha cómo encaja cada nota sobre ella.',
   'Mantén los dedos de base al subir.',
   'Cuando salga limpia, sube el metrónomo de 4 en 4.'])),
 ('vista', 'Lee en estas tonalidades', ex('primera-vista', keys='La,Re')),
 ('piezas', 'Piezas con armadura', prose('Antes de tocar cada pieza, mira la armadura y di en voz alta qué dedo 2 vas a usar en cada cuerda.') + ex('partitura', song='canon') + ex('partitura', song='clair'))
])

# ---------------------------------------------------------------- 10
MODS[10] = dict(title='Dedo 2 bajo y cuarto dedo', lead='Dos novedades que abren muchas piezas nuevas: el dedo 2 pegado al 1, y el meñique.', lessons=[
 ('bajo', 'El patrón 0‑12‑3', prose(
   'Hasta ahora el dedo 2 iba alto, pegado al 3. En muchas tonalidades tiene que ir <b>bajo</b>, pegado al 1. Eso da notas naturales donde antes había sostenidos.') + PATTERN_SVG('0-12-3') +
   table(['Cuerda', '2 alto', '2 bajo'], [[S('Re'), 'Fa♯', 'Fa'], [S('La'), 'Do♯', 'Do'], [S('Mi'), 'Sol♯', 'Sol']]) +
   call('Mira la armadura antes de tocar', 'La armadura te dice qué dedo 2 usar. En Sol mayor solo Fa lleva sostenido: el dedo 2 va alto en la cuerda Re y bajo en La y en Mi.', 'teacher')),
 ('oir', 'Oye la diferencia', ex('partitura', song='alto-bajo') + ex('partitura', song='dedo2-bajo') + ex('encuentra-error', keys='Sol,Re')),
 ('asocia', 'Asociación con el dedo 2 bajo', ex('asociacion', pools='bajo,mezcla') + ex('quiz-nota', pool='mezcla', title='¿Qué nota es? Alto y bajo mezclados') + ex('reto-60', pool='todas')),
 ('sol', 'Sol mayor en dos octavas', prose('La primera octava usa el patrón 0‑1‑23 en Sol y Re. La segunda usa el 0‑12‑3 en La y Mi. Do mayor usa el dedo 2 bajo también en la cuerda Re: Fa natural.') + ex('partitura', song='sol-mayor') + ex('partitura', song='do-mayor')),
 ('cuarto', 'El cuarto dedo', prose(
   'El meñique pisa un tono por encima del dedo 3, y da la misma nota que la cuerda al aire siguiente. Sirve para no cambiar de cuerda, y más adelante será imprescindible para el vibrato y las posiciones.',
   '<ul><li>Mantenlo curvado: un meñique estirado no tiene fuerza.</li><li>Acerca un poco la mano al mástil para que llegue sin estirarse.</li><li>Comprueba siempre: el cuarto dedo y la cuerda al aire tienen que sonar idénticos.</li></ul>') +
   ex('explorador', pool='cuarto', start='A4f', title='Primera posición con cuarto dedo') + ex('partitura', song='cuarto-dedo'))
])

# ---------------------------------------------------------------- 11
MODS[11] = dict(title='Corcheas y arcos', lead='Partir el pulso en dos y controlar cuánto arco gastas en cada nota. Con esto ya puedes leer casi todo lo que aparece en las primeras piezas.', lessons=[
 ('corcheas', 'Corcheas: el pulso partido en dos', prose(
   'Una corchea dura medio pulso. Suelen ir en parejas unidas por una barra. Para contarlas se dice "1 y 2 y 3 y 4 y": el número cae en el pulso y la "y" en medio.',
   'Activa en el metrónomo la opción de corcheas para oír esa subdivisión.') + ex('metronomo')),
 ('puntillo', 'El puntillo', prose(
   'Un puntillo detrás de una nota le suma la mitad de lo que dura. Una blanca con puntillo dura 3 pulsos. Una negra con puntillo dura pulso y medio, y casi siempre va seguida de una corchea que completa el segundo pulso.') +
   ex('figuras') + ex('partitura', song='puntillo') + ex('completa-compas', level='2')),
 ('palmas', 'Lee el ritmo y márcalo', ex('palmas', levels='2,1')),
 ('arcos', 'Détaché y ligado', prose(
   '<b>Détaché</b> significa una nota en cada arco, con arcos iguales y sin cortar el sonido entre ellos. Es la articulación básica.',
   '<b>Ligado:</b> una línea curva sobre o bajo varias notas indica que se tocan en el mismo arco. La mano izquierda cambia de dedo y el arco sigue sin parar.',
   'En los ligados hay que repartir el arco: si ligas dos negras, cada una usa la mitad de lo que usarías para una sola.') +
   ex('partitura', song='ligados') + ex('partitura', song='corcheas')),
 ('piezas', 'Piezas con corcheas y puntillo', ex('partitura', song='martinillo') + ex('partitura', song='oda'))
])

# ---------------------------------------------------------------- 12
MODS[12] = dict(title='Repertorio y lectura', lead='Todo lo anterior junto: piezas completas y lectura a primera vista. Aquí empiezas a hacer música.', lessons=[
 ('aprender', 'Cómo aprender una pieza', steps([
   'Escúchala entera siguiendo la partitura con el dedo.',
   'Cántala diciendo el nombre de las notas.',
   'Da palmas con el ritmo, contando en voz alta.',
   'Solo mano izquierda: toca en pizzicato para comprobar los dedos.',
   'Solo arco: toca el ritmo en cuerdas al aire, cambiando de cuerda donde toque.',
   'Junta las dos manos frase a frase, despacio, con metrónomo.',
   'Une las frases y sube la velocidad poco a poco. Grábate y escúchate.']) +
   call('El modo seguir con micrófono', 'En cualquier partitura, pulsa "Seguir con micrófono" y toca. La nota que te toca se ilumina y solo avanza cuando suena afinada, así que puedes ir a tu ritmo. Cuando llegues al final, la pieza queda marcada como completada en el cancionero.', 'teacher')),
 ('minueto', 'Tu primera pieza clásica', prose('El Minueto en Sol es una de las piezas más tocadas por los estudiantes de violín. Está en compás de 3/4, usa corcheas y el dedo 2 bajo en las cuerdas La y Mi. Apréndelo por compases: los compases 1 a 8 y 9 a 16 empiezan igual.') + ex('partitura', song='minueto')),
 ('cancionero', 'Cancionero', ex('cancionero', kind_='all')),
 ('oido', 'Oído musical', ex('dictado', pool='alto', len='3') + ex('encuentra-error', keys='La,Re,Sol')),
 ('vista', 'Lectura a primera vista', prose(
   'Leer a primera vista es tocar una partitura que no conoces, sin parar. Es una habilidad que se entrena: unos minutos al día con música fácil hacen más que mucho rato con música difícil.') +
   ex('primera-vista', keys='La,Re,Sol', eighths='1')),
 ('despues', 'Y después', prose(
   'Si has llegado hasta aquí tocando con buen sonido y afinado, tienes una base sólida. Los siguientes pasos naturales son:',
   '<ul><li>Seguir con un método completo, como el primer volumen de Suzuki o de Essential Elements, idealmente con un profesor.</li><li>Más tonalidades y el dedo 1 bajo (Fa natural en la cuerda Mi, Si bemol en La).</li><li>Golpes de arco nuevos: staccato y martelé.</li><li>La tercera posición y, más adelante, el vibrato.</li><li>Tocar con otras personas: una orquesta de iniciación es la mejor motivación que existe.</li></ul>'))
])

# ---------------------------------------------------------------- 13
MODS[13] = dict(title='Reconocer notas de oído', lead='Saber qué nota suena solo con escucharla. Aquí entrenas las dos capacidades que lo hacen posible, el oído absoluto y el relativo, con ejercicios diseñados a partir de lo que ha funcionado en estudios científicos.', lessons=[
 ('ciencia', 'Qué dice la ciencia', prose(
   '<b>Oído absoluto</b> es reconocer una nota sin ninguna referencia: oyes un sonido y sabes que es un Mi. <b>Oído relativo</b> es reconocer la distancia entre notas: sabes que la segunda está una quinta por encima de la primera. Casi todos los músicos profesionales tienen un oído relativo excelente; el absoluto es mucho más raro.',
   'Durante décadas se pensó que el oído absoluto solo se podía adquirir en la primera infancia. Es más frecuente en quienes empezaron a estudiar música muy pronto y en hablantes de lenguas tonales como el chino mandarín (Deutsch y colaboradores, 2006).',
   'Pero casi todo el mundo tiene más memoria para la altura de lo que cree. Daniel Levitin (1994) pidió a personas sin formación musical que cantaran su canción pop favorita, y muchas la cantaron en el tono original o a un semitono de distancia. Schellenberg y Trehub (2003) comprobaron que la gente distingue la versión original de una sintonía de televisión de otra subida o bajada uno o dos semitonos.',
   'Y en adultos, el entrenamiento funciona. En el estudio de Van Hedger, Heald y Nusbaum (2019), seis adultos entrenaron unas 32 horas durante ocho semanas: dos alcanzaron un nivel comparable al de quienes tienen oído absoluto y lo mantenían cuatro meses después. En el de Wong y colaboradores (2020), 43 adultos entrenaron entre 12 y 40 horas añadiendo notas poco a poco: de media aprendieron a reconocer entre 7 y 9 notas, y 6 de ellos llegaron a las doce con un 90 % de acierto.',
   'La discriminación fina de la altura, la que necesitas para afinar, mejora todavía más deprisa. Micheyl y colaboradores (2006) encontraron que las personas sin formación musical empezaban con umbrales seis veces peores que los músicos clásicos, pero con entre 4 y 8 horas de entrenamiento llegaban a su nivel.') +
   call('Qué puedes esperar', 'Con práctica diaria, cualquier persona mejora mucho su oído relativo y su afinación. El oído absoluto completo lo consigue una minoría de adultos, pero aprender a reconocer varias notas, sobre todo las cuatro cuerdas del violín, es realista. Y lo que aprendas por el camino te sirve para afinar desde el primer día.', 'teacher')),
 ('metodo', 'Cómo están hechos estos ejercicios', table(['Principio', 'De dónde sale', 'Cómo se aplica aquí'], [
   ['Empezar con pocas notas e ir añadiendo', 'Wong y colaboradores (2020): de 3 a 12 notas', 'El entrenador de notas empieza con La, Re y Mi y tiene 10 niveles'],
   ['Avanzar solo con un 90 % sin ayudas', 'Wong y colaboradores (2020)', 'Cada nivel se desbloquea con una prueba de 20 notas sin respuesta'],
   ['Borrar la nota anterior de la memoria', 'Van Hedger y colaboradores (2019): 1 segundo de ruido entre notas', 'Antes de cada nota suena un segundo de ruido, así no puedes compararla con la anterior'],
   ['Variar el timbre y la octava', 'Van Hedger y colaboradores (2019)', 'Las notas suenan con violín, piano o flauta y en distintas octavas, para que aprendas la nota y no un sonido concreto'],
   ['Respuesta inmediata al entrenar', 'Ambos estudios', 'Si fallas, oyes lo que dijiste y después la nota correcta'],
   ['Insistir en lo que peor se te da', 'Wong y colaboradores (2020), experimento 3', 'El botón "Practicar mi nota más débil" pone esa nota la mitad de las veces'],
   ['Ajustar la dificultad a tu nivel', 'Método psicoacústico de escalera adaptativa', 'En la afinación fina, la diferencia se reduce cuando aciertas y crece cuando fallas'],
   ['Sesiones cortas y repartidas', 'Efecto del espaciado (Cepeda y colaboradores, 2006)', 'Mejor 10 o 15 minutos al día que una hora a la semana']])),
 ('memoria', 'Tu nota ancla: el La', prose(
   'Un violinista oye el La cada vez que afina. Esa nota, repetida día tras día, es el mejor punto de partida para la memoria de la altura. En este ejercicio la buscas sin ninguna referencia y el ordenador mide lo cerca que te has quedado.',
   'Hazlo al empezar la sesión, antes de afinar. Si un día te quedas a menos de 50 cents de forma constante, prueba con Re, Mi y Sol.') + ex('la-memoria')),
 ('absoluto', 'Entrenador de notas', prose(
   'El ejercicio central del módulo. Entrena con respuesta hasta que las notas del nivel te resulten familiares, y luego haz la prueba sin ayudas. Escucha el carácter de cada nota: muchas personas describen el La como brillante y el Re como más redondo. Las asociaciones personales ayudan a memorizarlas.') + ex('entrenador-absoluto')),
 ('intervalos', 'Intervalos', prose(
   'El oído relativo es lo que de verdad usa un violinista para afinar: la quinta entre cuerdas, el dedo 3 en octava con la cuerda de abajo, el semitono entre el 2 alto y el 3. Empieza por cuarta, quinta y octava, que son las distancias que más vas a oír en el violín.') + ex('intervalos')),
 ('tonal', 'Notas dentro de una tonalidad', prose(
   'En la música real nunca oyes una nota aislada: la oyes dentro de una tonalidad. Cada nota tiene entonces una función que se puede reconocer: la tónica descansa, la dominante sostiene y la sensible pide subir. Este tipo de entrenamiento, llamado oído funcional o tonal, es el que más se usa en los conservatorios para el dictado musical.') + ex('grados')),
 ('fino', 'Afinación fina', prose(
   'Para tocar afinado no basta con saber qué nota es: hay que oír si está un poco alta o un poco baja. Este ejercicio mide la diferencia más pequeña que eres capaz de distinguir y la va reduciendo a medida que mejoras.') + ex('afinacion-fina')),
 ('rutina', 'Una rutina de 15 minutos', table(['Minutos', 'Ejercicio', 'Para qué'], [
   ['2', 'Encuentra el La de memoria', 'Fijar tu nota ancla'],
   ['5', 'Entrenador de notas, con respuesta', 'Memoria de cada nota'],
   ['3', 'Intervalos', 'Oído relativo para afinar'],
   ['3', 'Notas dentro de una tonalidad', 'Oír la función de cada nota'],
   ['2', 'Afinación fina', 'Precisión']]) + prose(
   'Una vez por semana, haz la prueba sin ayudas del entrenador. Canta las notas además de escucharlas: cantar obliga a fijar la altura con más precisión. Y escucha mucha música para violín fijándote en qué cuerda suena.')),
 ('fuentes', 'Fuentes', '<ul class="refs">' + ''.join(f'<li><span>{r}</span></li>' for r in [
   'Van Hedger, S. C., Heald, S. L. M. y Nusbaum, H. C. (2019). Absolute pitch can be learned by some adults. <i>PLOS ONE</i>, 14(9), e0223047. <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6759182/" target="_blank" rel="noopener">Leer el artículo</a>',
   'Wong, Y. K., Lui, K. F. H., Yip, K. H. M. y Wong, A. C. N. (2020). Is it impossible to acquire absolute pitch in adulthood? <i>Attention, Perception, &amp; Psychophysics</i>, 82(3), 1407–1430. <a href="https://doi.org/10.3758/s13414-019-01869-3" target="_blank" rel="noopener">DOI</a>',
   'Micheyl, C., Delhommeau, K., Perrot, X. y Oxenham, A. J. (2006). Influence of musical and psychoacoustical training on pitch discrimination. <i>Hearing Research</i>, 219(1–2), 36–47. <a href="https://doi.org/10.1016/j.heares.2006.05.004" target="_blank" rel="noopener">DOI</a>',
   'Schellenberg, E. G. y Trehub, S. E. (2003). Good pitch memory is widespread. <i>Psychological Science</i>, 14(3), 262–266. <a href="https://pubmed.ncbi.nlm.nih.gov/12741751" target="_blank" rel="noopener">PubMed</a>',
   'Levitin, D. J. (1994). Absolute memory for musical pitch: Evidence from the production of learned melodies. <i>Perception &amp; Psychophysics</i>, 56(4), 414–423.',
   'Deutsch, D., Henthorn, T., Marvin, E. y Xu, H. (2006). Absolute pitch among American and Chinese conservatory students. <i>Journal of the Acoustical Society of America</i>, 119(2), 719–722.',
   'Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T. y Rohrer, D. (2006). Distributed practice in verbal recall tasks. <i>Psychological Bulletin</i>, 132(3), 354–380.']) + '</ul>')
])


def module_page(n, m):
    toc = ''.join(f'<a href="#{lid}">{t}</a>' for lid, t, _ in m['lessons']) + '<a href="#objetivos">Objetivos</a>'
    body = ''.join(f'<section class="lesson" id="{lid}"><h2><span class="lesson-num">{n}.{i+1}</span> {t}</h2>{content}</section>' for i, (lid, t, content) in enumerate(m['lessons']))
    out = HEAD.format(title=f"{m['title']} | Primera Posición", desc=html.escape(m['lead']), page='modulo', extra=f' data-module="{n}"')
    out += f'''<main class="wrap">
<header class="mod-hero"><div class="mod-meta" data-mod-meta></div><h1>{m['title']}</h1><p class="lead">{m['lead']}</p></header>
<div class="mod-layout"><nav class="mod-toc" aria-label="Lecciones del módulo">{toc}</nav>
<div class="mod-body">{body}
<section class="goals" id="objetivos" data-goals></section>
<nav class="mod-pager" data-pager aria-label="Otros módulos"></nav>
</div></div></main>
''' + FOOT
    with open(os.path.join(OUT, f'modulo-{n:02d}.html'), 'w') as f: f.write(out)

for n, m in MODS.items(): module_page(n, m)

# ---------------------------------------------------------------- herramientas
tools = HEAD.format(title='Afinador y metrónomo | Primera Posición', desc='Afinador con micrófono, notas de referencia, metrónomo y mapa del mástil.', page='herramientas', extra='') + f'''<main class="wrap">
<header class="mod-hero"><h1>Afinador y metrónomo</h1><p class="lead">Las herramientas que vas a usar en cada sesión de estudio. Funcionan sin conexión a internet.</p></header>
<div class="mod-body" style="gap:28px">
{ex('afinador')}
{ex('metronomo')}
{ex('explorador', pool='mezcla', title='Mapa del mástil')}
{ex('referencia', pool='alto')}
</div></main>
''' + FOOT
open(os.path.join(OUT, 'herramientas.html'), 'w').write(tools)

# ---------------------------------------------------------------- cómo estudiar
est = HEAD.format(title='Cómo estudiar | Primera Posición', desc='Cómo organizar el estudio del violín y en qué pedagogía se basa este curso.', page='estudiar', extra='') + f'''<main class="wrap">
<header class="mod-hero"><h1>Cómo estudiar</h1><p class="lead">Avanza a tu ritmo, módulo a módulo. Lo que marca la diferencia no es cuántas horas tocas, sino cómo las usas.</p></header>
<div class="mod-body">
<section class="lesson" id="principios"><h2>Seis reglas para estudiar bien</h2>
{steps([
 '<b>Poco y cada día.</b> Veinte o treinta minutos diarios rinden mucho más que dos horas el fin de semana. El cuerpo aprende los movimientos mientras descansas entre sesiones.',
 '<b>Con un objetivo concreto.</b> No "tocar un rato", sino "conseguir la escala de Re a 60 sin desafinar el Do♯". Es lo que la investigación sobre el aprendizaje llama práctica deliberada.',
 '<b>Despacio.</b> Si algo sale mal a una velocidad, sale mal porque es demasiado rápida. Baja el metrónomo hasta que salga limpio tres veces seguidas y sube de 4 en 4.',
 '<b>Por trozos.</b> Separa la parte difícil, trabájala sola y después únela a lo que va antes y después.',
 '<b>Escuchándote.</b> Grábate una vez por semana. Desde fuera se oyen cosas que mientras tocas pasan desapercibidas.',
 '<b>Sin dolor.</b> Si algo duele, para. Sacude los brazos y revisa la postura. Tocar el violín no debe doler nunca.'])}
</section>
<section class="lesson" id="sesion"><h2>Una sesión de 30 minutos</h2>
<p class="prose">Una estructura que funciona en cualquier módulo. Ajusta los tiempos a lo que estés trabajando.</p>
{table(['Minutos', 'Qué', 'Para qué'], [
 ['3', 'Afinar y rutina de postura', 'Empezar con el cuerpo suelto y el violín afinado'],
 ['5', 'Cuerdas al aire con arcos largos', 'Sonido: velocidad, peso y punto de contacto'],
 ['7', 'Técnica del módulo actual', 'Dedos, escalas o golpes de arco'],
 ['5', 'Lectura: juegos de notas y ritmo', 'Que leer sea automático'],
 ['7', 'Una pieza o un ejercicio con partitura', 'Juntarlo todo y hacer música'],
 ['3', 'Tocar algo que ya te salga bien', 'Terminar con buena sensación']])}
</section>
<section class="lesson" id="progreso"><h2>Cómo funciona el progreso</h2>
{prose('El curso tiene 13 módulos en 4 niveles. El módulo 13, de oído musical, se puede trabajar en paralelo a cualquier otro. Cada módulo termina con una lista de objetivos: márcalos cuando de verdad te salgan, no la primera vez que lo intentes. Cuando los cumplas todos, el módulo aparece como completado en el mapa.',
 'Puedes ir en orden o saltar a lo que necesites, volver atrás para repasar y dedicar a cada módulo el tiempo que te haga falta. Para la mayoría de principiantes, un módulo lleva entre una y tres semanas de estudio diario.',
 'El progreso se guarda en este navegador, en este ordenador. Si cambias de navegador o borras los datos de navegación, empezará de cero.')}
</section>
<section class="lesson" id="profesor"><h2>Este curso y tu profesor</h2>
{prose('Esta web te ayuda a practicar entre clases y a entender lo que haces, pero no sustituye a un profesor. Un buen profesor ve en un segundo cosas que una pantalla no puede ver: un pulgar rígido, un hombro levantado, un violín de tamaño equivocado. Si estudias por tu cuenta, intenta tener aunque sea una clase de vez en cuando para revisar la postura.')}
{table(['Tamaño de violín', 'Medida aproximada del brazo'], [['4/4 (adulto)', 'Más de 58 cm'], ['3/4', '53 a 58 cm'], ['1/2', '51 a 53 cm'], ['1/4', '47 a 51 cm'], ['1/8', '44 a 47 cm']])}
<p class="small muted" style="max-width:68ch">El brazo se mide extendido, desde el cuello hasta el centro de la palma. Es una guía orientativa: el tamaño correcto lo confirma un profesor o un luthier probando el instrumento.</p>
</section>
<section class="lesson" id="fuentes"><h2>En qué se basa este curso</h2>
{prose('La forma de enseñar de esta web recoge ideas compartidas por la pedagogía del violín de los últimos cien años. Estas son las obras de referencia, por si quieres profundizar o comentarlas con tu profesor.')}
<ul class="refs">
<li><span><b>Ivan Galamian</b>, <i>Principles of Violin Playing and Teaching</i> (1962). La relación entre velocidad, peso y punto de contacto en la producción del sonido, y la idea de que la técnica es control mental del movimiento.</span></li>
<li><span><b>Paul Rolland</b> y Marla Mutschler, <i>The Teaching of Action in String Playing</i> (1974). El movimiento libre y equilibrado, sin tensiones innecesarias, como base de la postura.</span></li>
<li><span><b>Simon Fischer</b>, <i>Basics</i> (1997). Ejercicios de flexibilidad para la mano del arco, forma de la mano izquierda y estudio de la afinación.</span></li>
<li><span><b>Shinichi Suzuki</b>, <i>Suzuki Violin School</i>, volumen 1. Aprender escuchando, el estudio diario y el repertorio de iniciación, empezando por las variaciones de Estrellita.</span></li>
<li><span><b>Carl Flesch</b>, <i>The Art of Violin Playing</i> (1923). Un tratado clásico sobre técnica y método de estudio.</span></li>
<li><span><b>K. Anders Ericsson</b> y colaboradores, "The role of deliberate practice in the acquisition of expert performance", <i>Psychological Review</i> (1993). La investigación sobre la práctica deliberada en músicos.</span></li>
</ul>
</section>
</div></main>
''' + FOOT
open(os.path.join(OUT, 'como-estudiar.html'), 'w').write(est)
print('ok', len(MODS))

# Versión de los archivos para que el navegador no use copias antiguas
import time, glob
VER = time.strftime('%Y%m%d%H%M')
for f in glob.glob(os.path.join(OUT, '*.html')):
    t = open(f).read()
    if '__V__' in t: open(f, 'w').write(t.replace('__V__', VER))
