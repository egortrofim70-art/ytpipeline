# beats.py — the shot list of "¿Y si dejaras el alcohol?". (section, phrase the shot starts on, template, params)
# 'w:<words>' = the time those words are spoken, relative to the shot start. badge: [value, unit, 'word'] — units h d w m y.
NB = {'noBadge': True}
DIP = {'type': 'dip', 'dur': 0.3}
WHIP = {'type': 'whip', 'dur': 0.28}
FLASH = {'type': 'flash', 'dur': 0.3}
TAIL = 3.4
RED, GREEN, GOLD, BLUE, AMBER = '#ff5a4a', '#5fe39a', '#ffd400', '#6ab8ff', '#e8a23a'
HOP = {'top': 'tshirt', 'color': '#d8d0c0'}
SCI = {'top': 'labcoat', 'color': '#f2f2f2'}
BEER = {'puff': False, 'prop': 'beer'}
def st(text, at, **k): return {'text': text, 'at': at, **k}

BEATS = [
  # ---------------- 01. GANCHO: historia en frío ----------------
  ('01', 'Domingo diez de la mañana', 'face', {**NB, 'who': 'hero', 'face': 'wreck', 'dawn': 1}),
  ('01', 'La boca seca', 'sitEdge', {**NB, 'face': 'wreck'}),
  ('01', 'y una sola pregunta', 'face', {**NB, 'who': 'hero', 'face': 'shock', 'dawn': 1, 'stamp': st('¿QUÉ HICE ANOCHE?', 'w:anoche', y=950, size=100, color=RED)}),
  ('01', 'Ahora imagina que esa', 'iconRow', {**NB, 'in': WHIP, 'items': [{'icon': 'beer', 'label': 'LA ÚLTIMA VEZ', 'at': 0.1, 'cross': 'w:cero', 'color': AMBER}], 'caption': 'CERO ALCOHOL', 'capAt': 'w:cero'}),
  ('01', 'Eso hizo Anthony Hopkins', 'title', {**NB, 'in': FLASH, 'lines': ['ANTHONY HOPKINS', '«HANNIBAL LECTER»'], 'bg': 'dark'}),
  ('01', 'En mil novecientos setenta', 'hotelWake', {**NB, 'tag': 'ARIZONA · 1975'}),
  ('01', 'Y no volvió a tomar', 'calendarFlip', {**NB, 'steps': [[0, '1975', 'ÚLTIMO TRAGO'], ['w:nunca', '0', 'TRAGOS DESDE ENTONCES']], 'size': 200, 'color': '#2a7a3a'}),
  ('01', 'Qué le pasaría a tu cuerpo', 'smoker', {**NB, **BEER, 'in': WHIP, 'place': 'street', 'party': True, 'face': 'think', 'z0': 1.8, 'z1': 1.95}),
  ('01', 'La primera noche vas', 'face', {'in': WHIP, 'who': 'hero', 'face': 'tired', 'dawn': 0, 'badge': [12, 'h', 'primera']}),
  ('01', 'En dos semanas', 'mriCompare', {'noFocus': True, 'in': WHIP, 'at': 0.3, 'badge': [2, 'w', 'dos']}),
  ('01', 'En un mes tu sangre', 'iconRow', {'in': WHIP, 'items': [{'icon': 'blood', 'label': 'TU SANGRE CAMBIA', 'at': 0.2, 'color': RED, 'hi': 'w:sangre'}], 'badge': [1, 'm', 'mes']}),
  ('01', 'Y al final el error', 'myth', {**NB, 'in': WHIP, 'text': ['«UNA COPA DE VINO', 'ES BUENA PARA EL CORAZÓN»'], 'verdict': '¿ERROR?', 'verdictColor': RED, 'verdictAt': 'w:corazón'}),
  ('01', 'Empezamos', 'stopwatch', {**NB, 'in': FLASH, 'startAt': 'w:empezamos', 'caption': 'SIN ALCOHOL', 'bg': 'kitchen'}),

  # ---------------- 02. ANTES DE EMPEZAR ----------------
  ('02', 'Una cosa antes', 'face', {**NB, 'in': DIP, 'who': 'hero', 'face': 'fear', 'bg': 'street', 'stamp': st('CON UN MÉDICO', 'w:médico', y=950, size=110, color=GREEN)}),
  ('02', 'Puede ser peligroso', 'hospitalBed', {**NB, 'face': 'tired', 'who': 'hero'}),
  ('02', 'Para todos los demás', 'iconRow', {**NB, 'caption': 'CERO ALCOHOL', 'items': [{'icon': 'beer', 'label': 'CERVEZA', 'at': 'w:cerveza', 'cross': 'w:cerveza'}, {'icon': 'wineGlass', 'label': 'VINO', 'at': 'w:vino', 'cross': 'w:vino'}, {'icon': 'shot', 'label': 'FERNET', 'at': 'w:fernet', 'cross': 'w:fernet'}, {'icon': 'shot', 'label': 'AGUARDIENTE', 'at': 'w:aguardiente', 'cross': 'w:aguardiente'}]}),
  ('02', 'ni una nada más', 'offer', {**NB, 'prop': 'beer', 'noAt': 'w:asado', 'word': '¡UNA NADA MÁS!', 'wordAt': 0.1}),
  ('02', 'Tu vida sigue igual', 'kitchenSip', {**NB, 'sipAt': 'w:vaso', 'face': 'smile'}),

  # ---------------- 03. QUÉ HACE EL ALCOHOL ----------------
  ('03', 'Primero qué hace', 'smoker', {**NB, **BEER, 'in': DIP, 'place': 'street', 'party': True}),
  ('03', 'En minutos llega', 'bodyChain', {**NB, 'at': 0.3, 'caption': 'SANGRE → CEREBRO', 'capAt': 'w:cerebro'}),
  ('03', 'Ahí frena las neuronas', 'nerves', {**NB, 'breakAt': 99, 'caption': 'FRENA LAS NEURONAS', 'capAt': 'w:frena'}),
  ('03', 'Por eso te relajas', 'smoker', {**NB, **BEER, 'place': 'street', 'party': True, 'face': 'smile', 'z0': 1.7, 'z1': 1.85}),
  ('03', 'Al mismo tiempo', 'dopamine', {**NB, 'food': 'beer', 'at': 'w:dopamina', 'caption': 'DOPAMINA', 'capAt': 'w:dopamina'}),
  ('03', 'Por eso la segunda', 'smoker', {**NB, **BEER, 'place': 'office', 'party': True, 'period': 1.8, 'face': 'smile'}),
  ('03', 'Pero el trabajo sucio', 'liverQueue', {**NB, 'caption': 'EL HÍGADO', 'capAt': 'w:hígado'}),
  ('03', 'y lo hace despacio', 'liverQueue', {**NB, 'period': 1.6}),
  ('03', 'Si bebes más rápido', 'liverQueue', {**NB, 'fast': True}),
  ('03', 'Y en ese proceso', 'liverQueue', {**NB, 'mode': 'acet', 'caption': 'ACETALDEHÍDO', 'capAt': 'w:acetaldehído'}),
  ('03', 'Es tóxica', 'title', {**NB, 'lines': ['ES TÓXICA'], 'bg': 'red'}),
  ('03', 'Es la que te pone', 'face', {**NB, 'who': 'hero', 'face': 'shock', 'bg': 'street', 'stamp': st('CARA ROJA', 'w:roja', y=950, size=110, color=RED)}),
  ('03', 'Y la Organización Mundial', 'iconRow', {**NB, 'items': [{'icon': 'virus', 'label': 'OMS: RELACIONADO CON CÁNCER', 'at': 0.2, 'color': RED, 'hi': 'w:cáncer'}]}),
  ('03', 'Acuérdate de ese nombre', 'title', {**NB, 'lines': ['RECUERDA:', 'ACETALDEHÍDO'], 'bg': 'dark'}),

  # ---------------- 04. LA PRIMERA NOCHE ----------------
  ('04', 'Primera noche sin alcohol', 'bedWide', {'in': DIP, 'clockH': 23, 'face': 'tired', 'badge': [12, 'h', 'noche']}),
  ('04', 'Mucha gente dice', 'smoker', {**BEER, 'place': 'kitchen', 'prop': 'wine', 'face': 'smile', 'caption': '«CON UNA COPITA DUERMO MEJOR»', 'capAt': 'w:copita'}),
  ('04', 'Y en parte es cierto', 'bedSide', {'face': 'tired'}),
  ('04', 'Pero los científicos revisaron', 'journal', {'head': 'ALCOHOL CLIN EXP RES · 2013', 'title': 'Alcohol y sueño: 20 estudios', 'hiAt': 99, 'stamp': st('20 ESTUDIOS', 'w:veinte', y=950, size=110, color=GOLD)}),
  ('04', 'La primera mitad de la noche', 'chart', {'title': 'PROFUNDIDAD DEL SUEÑO', 'pts': [[0, 0.3], [0.12, 0.9], [0.35, 0.85], [0.5, 0.45], [0.58, 0.75], [0.64, 0.2], [0.72, 0.6], [0.8, 0.15], [0.9, 0.55], [1, 0.2]], 'smooth': False, 'color': '#9fb8ff', 'xlabels': [[0.1, '23:00'], [0.5, '3:00'], [0.9, '7:00']], 'marks': [{'x': 0.2, 'label': 'PROFUNDO', 'color': GREEN}, {'x': 0.75, 'label': 'ROTO', 'color': RED}]}),
  ('04', 'Te despiertas das vueltas', 'eyesOpen', {'face': 'tired'}),
  ('04', 'Por eso después de una fiesta', 'clockInsert', {'hFrom': 23, 'hTo': 7, 'landAt': 'w:ocho', 'dawn': 0.8, 'stamp': st('8 H = 4 H', 'w:cuatro', y=950, size=120, color=RED)}),
  ('04', 'Esta noche sin alcohol', 'sitEdge', {'face': 'tired'}),
  ('04', 'Si bebías a diario', 'eyesOpen', {'face': 'tired'}),
  ('04', 'Pero el sueño que viene', 'bedWide', {'clockH': 2, 'face': 'calm'}),

  # ---------------- 05. DOS O TRES DÍAS ----------------
  ('05', 'Dos días', 'kitchenSip', {'in': DIP, 'sipAt': 0.5, 'face': 'calm', 'badge': [2, 'd', 'dos']}),
  ('05', 'El alcohol bloquea una hormona', 'kidneyADH', {'mode': 'alcohol'}),
  ('05', 'Por eso con alcohol', 'kidneyADH', {'mode': 'alcohol', 'outText': 'AL BAÑO A CADA RATO'}),
  ('05', 'Sin alcohol esa hormona', 'kidneyADH', {'mode': 'clear'}),
  ('05', 'Te hidratas mejor', 'mirror', {'face': 'smile', 'stamp': st('PIEL MENOS APAGADA', 'w:piel', y=950, size=90, color=GREEN)}),
  ('05', 'Y llega el primer viernes', 'calendarFlip', {'in': WHIP, 'steps': [[0, 'VIERNES', 'PRIMERO SIN ALCOHOL']], 'size': 96, 'color': '#c8405a'}),
  ('05', 'Ahí el problema no es', 'offer', {'prop': 'beer', 'noAt': 99, 'word': '¿QUÉ, YA NO TOMAS?', 'wordAt': 'w:tomas'}),
  ('05', 'Estás enfermo', 'chatGroup', {'msgs': [[0.05, '¿Estás enfermo? 😂'.replace(' 😂', ''), 'Nico'], ['w:hace', 'Una no hace daño', 'Caro'], ['w:comentarios', 'Ya ni sales, bro', 'Santi']]}),
  ('05', 'En los comentarios de videos', 'comment', {'text': 'Lo peor es la presión de los amigos', 'typeDur': 1.6}),
  ('05', 'No la abstinencia', 'title', {'lines': ['NO ES EL CUERPO.', 'ES LA PRESIÓN'], 'bg': 'dark'}),
  ('05', 'Tu cuerpo te está dando', 'chatGroup', {'msgs': [[0, '¿Estás enfermo?', 'Nico'], [0, 'Una no hace daño', 'Caro'], ['w:whatsapp', 'Estoy haciendo un reto 💪'.replace(' 💪', ''), 'me']]}),

  # ---------------- 06. UNA SEMANA ----------------
  ('06', 'Una semana', 'face', {'in': DIP, 'who': 'hero', 'face': 'smile', 'dawn': 1, 'badge': [1, 'w', 'semana']}),
  ('06', 'Sin dolor de cabeza', 'iconRow', {'items': [{'icon': 'shield', 'label': 'SIN RESACA', 'at': 0.05, 'color': GREEN}, {'icon': 'bulb', 'label': '¿QUÉ DIJE ANOCHE?', 'at': 'w:dije', 'cross': 'w:anoche'}]}),
  ('06', 'En Inglaterra la Universidad', 'scientist', {'who': 'doc', 'sepia': False, 'tag': 'UNIVERSIDAD DE SUSSEX', 'lines': [['w:miles', 'MILES DE PERSONAS']]}),
  ('06', 'Más de la mitad dijo', 'iconRow', {'items': [{'icon': 'moon', 'label': 'DUERMEN MEJOR', 'at': 0.1, 'color': BLUE}, {'icon': 'flame', 'label': 'MÁS ENERGÍA', 'at': 'w:energía', 'color': GOLD}]}),
  ('06', 'Y hay algo más', 'stackIcons', {'kind': 'can', 'to': 12, 'label': 'LATAS QUE NO COMPRASTE'}),
  ('06', 'La cerveza del viernes', 'iconRow', {'items': [{'icon': 'beer', 'label': 'VIERNES', 'at': 0.05, 'color': AMBER, 'cross': 0.4}, {'icon': 'wineGlass', 'label': 'SÁBADO', 'at': 'w:botella', 'color': '#c8405a', 'cross': 'w:botella'}, {'icon': 'calendar', 'label': 'TAXI', 'at': 'w:taxi', 'cross': 'w:taxi'}]}),
  ('06', 'Por primera vez en mucho', 'streetWalk', {'face': 'smile', 'stamp': st('SE QUEDA EN TU BOLSILLO', 'w:bolsillo', y=950, size=90, color=GREEN)}),

  # ---------------- 06b. LA RESACA ----------------
  ('06b', 'Y qué es exactamente', 'face', {'in': DIP, 'who': 'hero', 'face': 'wreck', 'dawn': 1, 'stamp': st('¿QUÉ ES LA RESACA?', 0.3, y=950, size=100, color=GOLD)}),
  ('06b', 'Es una mezcla', 'iconRow', {'caption': 'UNA MEZCLA', 'items': [{'icon': 'droplet', 'label': 'POCA AGUA', 'at': 'w:agua', 'color': BLUE}, {'icon': 'flask', 'label': 'ACETALDEHÍDO', 'at': 'w:acetaldehído', 'color': RED}, ]}),
  ('06b', 'un sueño roto y una', 'iconRow', {'caption': 'UNA MEZCLA', 'items': [{'icon': 'moon', 'label': 'SUEÑO ROTO', 'at': 0.05, 'color': '#9fb8ff'}, {'icon': 'flame', 'label': 'INFLAMACIÓN', 'at': 'w:inflamación', 'color': GOLD}]}),
  ('06b', 'Por eso no existe', 'title', {'lines': ['NO EXISTE', 'UNA CURA MÁGICA'], 'bg': 'red'}),
  ('06b', 'En dos mil veintidós investigadores', 'journal', {'head': 'ADDICTION · 2022', 'title': 'Remedios para la resaca', 'hiAt': 99, 'stamp': st('21 ENSAYOS', 'w:veintiún', y=950, size=110, color=GOLD)}),
  ('06b', 'jugos extractos cápsulas', 'iconRow', {'items': [{'icon': 'orange', 'label': 'JUGOS', 'at': 0.05, 'cross': 'w:sólidas'}, {'icon': 'flask', 'label': 'EXTRACTOS', 'at': 'w:extractos', 'cross': 'w:sólidas'}, {'icon': 'pill', 'label': 'CÁPSULAS', 'at': 'w:cápsulas', 'cross': 'w:sólidas'}]}),
  ('06b', 'Y ningún resultado', 'myth', {'text': ['¿ALGÚN REMEDIO', 'COMPROBADO?'], 'verdict': 'NINGUNO', 'verdictAt': 'w:repetido'}),
  ('06b', 'Y el ibuprofeno', 'iconRow', {'caption': 'SIN ENSAYOS CON PLACEBO', 'capAt': 'w:placebo', 'items': [{'icon': 'pill', 'label': 'IBUPROFENO', 'at': 'w:ibuprofeno', 'color': BLUE}, {'icon': 'pill', 'label': 'PARACETAMOL', 'at': 'w:paracetamol', 'color': BLUE}]}),
  ('06b', 'Los mismos investigadores', 'face', {'who': 'hero', 'face': 'think', 'bg': 'office'}),
  ('06b', 'la forma más segura', 'title', {'lines': ['LA MEJOR CURA:', 'NO TOMAR'], 'bg': 'dark'}),
  ('06b', 'Y esta semana tú', 'face', {'who': 'hero', 'face': 'smile', 'dawn': 1}),

  # ---------------- 07. DOS SEMANAS ----------------
  ('07', 'Dos semanas', 'brain', {'noFocus': True, 'in': DIP, 'z0': 1.0, 'z1': 1.15, 'badge': [2, 'w', 'dos']}),
  ('07', 'En Alemania científicos', 'scientist', {'who': 'doc', 'sepia': False, 'tag': 'ALEMANIA · 2013', 'lines': [['w:cuarenta', '49 PERSONAS'], ['w:dependencia', 'CON DEPENDENCIA']]}),
  ('07', 'Una el primer día', 'mriCompare', {'at': 'w:después'}),
  ('07', 'En solo dos semanas', 'mriCompare', {'at': -3, 'caption': 'LA MATERIA GRIS VUELVE', 'capAt': 'w:volver'}),
  ('07', 'El cerebro se estaba recuperando', 'brain', {'noFocus': True, 'z0': 1.05, 'z1': 1.2, 'stamp': st('SE VE EN LA IMAGEN', 'w:imagen', y=950, size=100, color=GREEN)}),
  ('07', 'Ojo eran personas', 'face', {'who': 'hero', 'face': 'think', 'bg': 'blueprint', 'stamp': st('BEBÍAN MUCHÍSIMO', 'w:muchísimo', y=950, size=100, color=GOLD)}),
  ('07', 'Pero muestra algo importante', 'title', {'lines': ['EL CEREBRO NO SE QUEDA', 'DAÑADO PARA SIEMPRE'], 'bg': 'dark'}),
  ('07', 'Cuando le das una pausa', 'brain', {'noFocus': True, 'z0': 1.15, 'z1': 1.25, 'stamp': st('SE REPARA', 'w:repara', y=950, size=120, color=GREEN)}),
  ('07', 'Y el hígado también', 'liverFat', {'from': 0.85, 'to': 0.35}),
  ('07', 'puede empezar a revertirse', 'liverFat', {'from': 0.5, 'to': 0.15, 'at': 0.1, 'caption': 'SE PUEDE REVERTIR', 'capAt': 0.2}),

  # ---------------- 08. BRAD PITT ----------------
  ('08', 'Y no hace falta tocar', 'face', {**NB, 'in': DIP, 'who': 'hero', 'face': 'think', 'bg': 'street'}),
  ('08', 'Brad Pitt contó que', 'title', {**NB, 'in': FLASH, 'lines': ['BRAD PITT'], 'bg': 'dark'}),
  ('08', 'se dio cuenta de que', 'smoker', {**NB, **BEER, 'place': 'kitchen', 'prop': 'wine', 'outfit': {'top': 'tshirt', 'color': '#5a6a7a'}, 'face': 'tired', 'period': 1.8}),
  ('08', 'Entró a Alcohólicos Anónimos', 'iconRow', {**NB, 'items': [{'icon': 'people', 'label': 'ALCOHÓLICOS ANÓNIMOS', 'at': 'w:alcohólicos', 'color': BLUE}, {'icon': 'beer', 'label': 'DEJÓ EL ALCOHOL', 'at': 'w:dejó', 'cross': 'w:alcohol'}]}),
  ('08', 'Dijo una frase muy honesta', 'tv', {**NB, 'tag': 'BRAD PITT · 2019', 'sub': '«ME QUITÉ EL PRIVILEGIO DE BEBER»', 'subAt': 'w:privilegio'}),
  ('08', 'Estuvo siete años', 'calendarFlip', {**NB, 'steps': [[0, '7', 'AÑOS SIN TOMAR']], 'size': 220, 'color': '#2a7a3a'}),
  ('08', 'Y hace poco contó', 'iconRow', {**NB, 'items': [{'icon': 'beer', 'label': 'VOLVIÓ: POCO Y CON CONTROL', 'at': 'w:volvió', 'color': GOLD, 'hi': 'w:control'}]}),
  ('08', 'No es una historia perfecta', 'face', {**NB, 'who': 'hero', 'face': 'calm', 'bg': 'street', 'stamp': st('ES REAL', 'w:real', y=950, size=120, color=GOLD)}),
  ('08', 'A veces el cambio', 'title', {**NB, 'lines': ['NO «PARA SIEMPRE».', '«ESTE MES»'], 'bg': 'dark'}),

  # ---------------- 09. UN MES ----------------
  ('09', 'Volvamos a ti', 'mirror', {'in': DIP, 'face': 'calm', 'badge': [1, 'm', 'mes']}),
  ('09', 'En dos mil dieciocho', 'journal', {'head': 'BMJ OPEN · 2018', 'title': 'Un mes sin alcohol', 'hiAt': 99, 'stamp': st('94 PERSONAS', 'w:noventa', y=950, size=110, color=GOLD)}),
  ('09', 'y cuatro personas que dejaron', 'calendarFlip', {'steps': [[0, '30', 'DÍAS SIN ALCOHOL']], 'size': 220, 'color': '#2a7a3a'}),
  ('09', 'No tenían dependencia', 'stackIcons', {'kind': 'can', 'to': 18, 'label': 'BEBIDAS POR SEMANA'}),
  ('09', 'Al final del mes', 'iconRow', {'items': [{'icon': 'blood', 'label': 'ANÁLISIS DE SANGRE', 'at': 0.2, 'color': RED, 'hi': 'w:sangre'}]}),
  ('09', 'La resistencia a la insulina', 'labReport', {'head': 'ANÁLISIS DE SANGRE', 'sub': '1 MES SIN ALCOHOL', 'rows': [['RESISTENCIA A LA INSULINA', '−26 %', 'w:veintiséis']]}),
  ('09', 'La presión arterial bajó', 'labReport', {'head': 'ANÁLISIS DE SANGRE', 'sub': '1 MES SIN ALCOHOL', 'rows': [['RESISTENCIA A LA INSULINA', '−26 %', 0], ['PRESIÓN (SISTÓLICA)', '−6,6 %', 'w:presión'], ['PESO', '−1,5 %', 'w:peso']]}),
  ('09', 'Y lo más sorprendente', 'iconRow', {'items': [{'icon': 'virus', 'label': 'AYUDAN A CRECER A LOS TUMORES', 'at': 0.3, 'color': RED, 'hi': 'w:cáncer'}]}),
  ('09', 'bajaron muchísimo Una cayó', 'labReport', {'head': 'FACTORES DE CRECIMIENTO', 'sub': 'RELACIONADOS CON CÁNCER', 'rows': [['VEGF', '−42 %', 'w:mitad'], ['EGF', '−74 %', 'w:cuartas']]}),
  ('09', 'En las personas que siguieron', 'compare', {'vs': 'VS', 'items': [{'icon': 'beer', 'value': 'SIN CAMBIOS', 'label': 'SIGUIERON BEBIENDO', 'at': 0.2, 'color': AMBER, 'size': 70}, {'icon': 'water', 'value': '−26 %', 'label': 'UN MES SIN ALCOHOL', 'at': 0.6, 'color': GREEN, 'size': 70}]}),
  ('09', 'Ojo no fue un experimento', 'myth', {'text': ['¿EXPERIMENTO', 'PERFECTO?'], 'verdict': 'NO', 'verdictColor': GOLD, 'verdictAt': 'w:eligió'}),
  ('09', 'Pero en solo treinta días', 'title', {'lines': ['EN 30 DÍAS,', 'LA SANGRE ERA OTRA'], 'bg': 'dark'}),
  ('09', 'Y otro dato', 'scientist', {'who': 'doc', 'sepia': False, 'tag': 'UNIVERSIDAD DE SUSSEX', 'lines': [['w:seis', '6 MESES DESPUÉS']]}),
  ('09', 'gente bebía en promedio', 'calendarFlip', {'steps': [[0, '4,3', 'DÍAS CON ALCOHOL / SEMANA'], ['w:menos', '3,3', 'SEIS MESES DESPUÉS']], 'size': 200, 'color': '#2a7a3a'}),
  ('09', 'El mes les cambió', 'streetWalk', {'face': 'smile'}),

  # ---------------- 10. ¿Y SI SOLO BEBO LOS FINES DE SEMANA? ----------------
  ('10', 'Pero seguro estás pensando', 'face', {'in': DIP, 'who': 'hero', 'face': 'think', 'bg': 'office', 'stamp': st('«SOLO LOS FINES DE SEMANA»', 'w:fines', y=950, size=80)}),
  ('10', 'Esa es la pregunta', 'comment', {'text': '¿Y si solo tomo los fines de semana?', 'typeDur': 1.4}),
  ('10', 'más común de beber', 'smoker', {**BEER, 'place': 'street', 'party': True, 'period': 1.6}),
  ('10', 'Hagamos cuentas', 'bigNumber', {'value': '≈ 150', 'label': 'CALORÍAS', 'pre': '1 LATA DE CERVEZA', 'at': 'w:ciento', 'icon': 'beer', 'color': GOLD}),
  ('10', 'Seis latas el sábado', 'weekendCans', {'at': 0.1, 'kcal': 918}),
  ('10', 'Es como una comida completa', 'eatTable', {'who': 'hero', 'stack': 1, 'word': False, 'sepia': False}),
  ('10', 'En un mes son', 'bigNumber', {'value': '≈ 4.000', 'label': 'CALORÍAS AL MES', 'pre': 'SOLO LOS SÁBADOS', 'at': 'w:cuatro', 'color': GOLD}),
  ('10', 'Y el cuerpo no promedia', 'compare', {'vs': '≠', 'items': [{'icon': 'beer', 'value': '6 EN 1 NOCHE', 'label': 'SÁBADO', 'at': 0.2, 'color': RED, 'size': 70}, {'icon': 'beer', 'value': '1 × 6 DÍAS', 'label': 'REPARTIDO', 'at': 'w:diaria', 'color': AMBER, 'size': 70}]}),
  ('10', 'Es un golpe concentrado', 'liverQueue', {'fast': True, 'caption': 'UN GOLPE CONCENTRADO', 'capAt': 0.2}),
  ('10', 'Según la Organización Panamericana', 'globe', {'dots': 140, 'caption': 'OPS · LAS AMÉRICAS', 'capAt': 0.3}),
  ('10', 'en las Américas mueren', 'bigNumber', {'value': '≈ 85.000', 'label': 'MUERTES AL AÑO SOLO POR ALCOHOL', 'pre': 'LAS AMÉRICAS', 'at': 'w:ochenta', 'color': '#ff8a7a', 'size': 190}),
  ('10', 'La mayoría tenía menos', 'iconRow', {'items': [{'icon': 'people', 'label': 'MENORES DE 60', 'at': 0.1, 'color': GOLD}]}),
  ('10', 'Y casi dos de cada tres', 'liverFat', {'from': 0.9, 'to': 0.9, 'text': '2 DE 3: EL HÍGADO', 'caption': 'ENFERMEDADES DEL HÍGADO', 'capAt': 'w:hígado'}),
  ('10', 'Y en Sudamérica se toma', 'globe', {'dots': 90, 'caption': 'SUDAMÉRICA', 'capAt': 'w:sudamérica'}),
  ('10', 'En Argentina cada adulto', 'bigNumber', {'value': '≈ 8 L', 'label': 'DE ALCOHOL PURO POR ADULTO AL AÑO', 'pre': 'ARGENTINA', 'at': 'w:ocho', 'color': GOLD}),
  ('10', 'Eso es más o menos como', 'stackIcons', {'kind': 'can', 'to': 450, 'label': 'LATAS DE CERVEZA AL AÑO'}),
  ('10', 'En Perú casi lo mismo', 'bigNumber', {'value': '≈ 7,5 L', 'label': 'DE ALCOHOL PURO POR ADULTO AL AÑO', 'pre': 'PERÚ', 'at': 0.2, 'color': GOLD}),

  # ---------------- 11. EL CEREBRO A LARGO PLAZO ----------------
  ('11', 'Y qué pasa con el cerebro', 'brain', {'noFocus': True, 'in': DIP, 'z0': 1.0, 'z1': 1.1}),
  ('11', 'En Inglaterra hay una base', 'scientist', {'who': 'doc', 'sepia': False, 'tag': 'BIOBANCO DEL REINO UNIDO', 'lines': [['w:enorme', 'BASE DE DATOS ENORME']]}),
  ('11', 'Ahí analizaron los cerebros', 'brain', {'noFocus': True, 'z0': 1.1, 'z1': 1.2, 'stamp': st('36.678 CEREBROS', 'w:treinta', y=950, size=110, color=GOLD)}),
  ('11', 'Y encontraron algo incómodo', 'face', {'who': 'hero', 'face': 'shock', 'bg': 'blueprint'}),
  ('11', 'Incluso a dosis bajas', 'compare', {'vs': '→', 'items': [{'icon': 'brain', 'pct': 1.0, 'value': 'MENOS', 'label': 'ALCOHOL', 'at': 0.2, 'color': BLUE}, {'icon': 'brain', 'pct': 0.8, 'value': 'MÁS', 'label': 'CEREBRO MÁS PEQUEÑO', 'at': 'w:pequeño', 'color': RED}]}),
  ('11', 'Pasar de una a dos', 'iconRow', {'items': [{'icon': 'beer', 'label': '½ CERVEZA', 'at': 0.1, 'color': AMBER}, {'icon': 'beer', 'label': '1 CERVEZA', 'at': 'w:una', 'color': RED}], 'caption': 'AL DÍA', 'capAt': 'w:día'}),
  ('11', 'se parecía a envejecer', 'bigNumber', {'value': '+2 AÑOS', 'label': 'EDAD DEL CEREBRO', 'pre': 'DE 1 A 2 UNIDADES AL DÍA', 'at': 'w:años', 'icon': 'brain', 'color': RED}),
  ('11', 'No prueba que el alcohol', 'myth', {'text': ['¿EL ALCOHOL', 'ES LA ÚNICA CAUSA?'], 'verdict': 'NO SE SABE', 'verdictColor': GOLD, 'verdictAt': 'w:causa'}),
  ('11', 'Pero el patrón era claro', 'title', {'lines': ['CUANTO MÁS,', 'PEOR'], 'bg': 'red'}),

  # ---------------- 12. LA PASTILLA DE LA FIESTA ----------------
  ('12', 'Te acuerdas del acetaldehído', 'liverQueue', {**NB, 'in': DIP, 'mode': 'acet'}),
  ('12', 'En los años cuarenta', 'title', {**NB, 'lines': ['DINAMARCA', 'AÑOS 40'], 'bg': 'dark'}),
  ('12', 'dos científicos Erik Jacobsen', 'scientist', {**NB, 'who': 'doc', 'sepia': True, 'tag': 'ERIK JACOBSEN · JENS HALD', 'lines': [['w:parásitos', 'CONTRA PARÁSITOS']]}),
  ('12', 'Y para ver si era seguro', 'iconRow', {**NB, 'items': [{'icon': 'pill', 'label': 'LO PROBARON EN SÍ MISMOS', 'at': 0.2, 'color': BLUE, 'hi': 'w:mismos'}]}),
  ('12', 'Un día fueron a una fiesta', 'labParty', {**NB, 'at': 'w:rojos', 'tag': 'DINAMARCA · AÑOS 40'}),
  ('12', 'pusieron rojos con náuseas', 'labParty', {**NB, 'at': -1}),
  ('12', 'El medicamento bloqueaba', 'liverQueue', {**NB, 'mode': 'block', 'blockAt': 'w:bloqueaba', 'caption': 'EL VENENO SE QUEDA', 'capAt': 'w:veneno'}),
  ('12', 'El veneno se quedaba', 'labParty', {**NB, 'at': -1, 'stamp': st('UNOS SORBOS = FATAL', 'w:fatal', y=950, size=100, color=RED)}),
  ('12', 'Así por accidente', 'title', {**NB, 'lines': ['POR ACCIDENTE', 'NACIÓ UN MEDICAMENTO'], 'bg': 'dark'}),
  ('12', 'Se sigue usando hoy', 'iconRow', {**NB, 'items': [{'icon': 'pill', 'label': 'DISULFIRAM', 'at': 0.2, 'color': GOLD, 'hi': 'w:disulfiram'}], 'caption': 'SE USA HASTA HOY', 'capAt': 0.2}),
  ('12', 'Lo que sentían esos científicos', 'face', {**NB, 'who': 'hero', 'face': 'think', 'bg': 'street'}),
  ('12', 'Solo que normalmente', 'liverQueue', {**NB, 'mode': 'acet', 'rate': 'EN SILENCIO'}),

  # ---------------- 13. UN AÑO ----------------
  ('13', 'Volvamos a ti', 'streetWalk', {'in': DIP, 'face': 'calm', 'badge': [3, 'm', 'tres']}),
  ('13', 'Seis', 'streetWalk', {'face': 'smile', 'badge': [6, 'm', 'seis']}),
  ('13', 'Un año sin alcohol', 'mirror', {'face': 'smile', 'badge': [1, 'y', 'año']}),
  ('13', 'Aquí te tengo que ser', 'face', {'who': 'hero', 'face': 'think', 'bg': 'blueprint', 'stamp': st('POCOS DATOS', 'w:calendario', y=950, size=110, color=GOLD)}),
  ('13', 'Lo que sí sabemos es la', 'title', {'lines': ['LA DIRECCIÓN', 'SÍ LA SABEMOS'], 'bg': 'dark'}),
  ('13', 'Y algo con números', 'journal', {'head': 'LANCET PUBLIC HEALTH · 2017', 'title': '36 ensayos: alcohol y presión', 'hiAt': 99}),
  ('13', 'quienes bebían más de seis', 'compare', {'vs': '→', 'items': [{'icon': 'heart', 'value': '6+ TRAGOS', 'label': 'AL DÍA', 'at': 0.2, 'color': RED, 'size': 70}, {'icon': 'heart', 'value': '≈ −5 PUNTOS', 'label': 'BAJANDO A LA MITAD', 'at': 'w:cinco', 'color': GREEN, 'size': 70}]}),
  ('13', 'Para quien bebía poco', 'myth', {'text': ['¿Y SI BEBÍAS POCO?'], 'verdict': 'CASI NULO', 'verdictColor': GOLD, 'verdictAt': 'w:nulo'}),
  ('13', 'Menos presión para quien', 'iconRow', {'items': [{'icon': 'heart', 'label': 'MENOS PRESIÓN', 'at': 0.05, 'color': GREEN}, {'icon': 'liver', 'label': 'HÍGADO DESCANSA', 'at': 'w:hígado', 'color': GREEN}, {'icon': 'brain', 'label': 'SIN GOLPES', 'at': 'w:cerebro', 'color': GREEN}]}),
  ('13', 'Y un riesgo de cáncer', 'chart', {'title': 'RIESGO DE CÁNCER', 'pts': [[0, 0.2], [0.55, 0.75], [1, 0.76]], 'color': RED, 'marks': [{'x': 0.55, 'label': 'DEJAS EL ALCOHOL', 'color': GREEN}], 'endLabel': 'DEJA DE SUBIR', 'endAt': 2.0}),
  ('13', 'La Organización Mundial de la Salud dice', 'bigNumber', {'value': '7+', 'label': 'TIPOS DE CÁNCER', 'pre': 'OMS: EL ALCOHOL CAUSA', 'at': 0.3, 'icon': 'virus', 'color': RED}),
  ('13', 'Ahora haz tu propia cuenta', 'stackIcons', {'kind': 'case', 'to': 52, 'label': 'CAJAS DE CERVEZA AL AÑO'}),
  ('13', 'Qué harías con ese dinero', 'face', {'who': 'hero', 'face': 'smile', 'bg': 'street', 'stamp': st('¿QUÉ HARÍAS?', 0.1, y=950, size=120, color=GOLD)}),

  # ---------------- 13b. QUÉ AYUDA DE VERDAD ----------------
  ('13b', 'Bueno y cómo se aguanta', 'face', {**NB, 'in': DIP, 'who': 'hero', 'face': 'think', 'bg': 'office'}),
  ('13b', 'Primero prepara el viernes', 'calendarFlip', {**NB, 'steps': [[0, 'VIERNES', 'PREPÁRALO ANTES']], 'size': 96, 'color': '#c8405a'}),
  ('13b', 'Ten algo en la mano', 'iconRow', {**NB, 'caption': '1 · PREPARA EL VIERNES', 'items': [{'icon': 'water', 'label': 'AGUA MINERAL', 'at': 'w:mineral', 'color': BLUE}, {'icon': 'soda', 'label': 'SIN AZÚCAR', 'at': 'w:gaseosa', 'color': GREEN}, {'icon': 'beer', 'label': 'CERVEZA 0,0', 'at': 'w:cerveza', 'color': AMBER}]}),
  ('13b', 'En una fiesta nadie', 'smoker', {**NB, 'puff': False, 'prop': 'bottle', 'place': 'office', 'party': True, 'face': 'smile', 'stamp': st('NADIE MIRA TU VASO', 'w:fija', y=950, size=90)}),
  ('13b', 'Segundo di la verdad', 'offer', {**NB, 'prop': 'beer', 'noAt': 0.4, 'word': '«ESTOY EN UN RETO»', 'wordAt': 'w:mes'}),
  ('13b', 'Un reto suena mejor', 'title', {**NB, 'lines': ['UN RETO SUENA MEJOR', 'QUE UNA EXCUSA'], 'bg': 'dark'}),
  ('13b', 'Tercero cambia el momento', 'title', {**NB, 'lines': ['CAMBIA EL MOMENTO,', 'NO SOLO LA BEBIDA'], 'bg': 'dark'}),
  ('13b', 'Si siempre tomabas cocinando', 'iconRow', {**NB, 'caption': '3 · CAMBIA EL MOMENTO', 'items': [{'icon': 'plate', 'label': 'COCINAR', 'at': 'w:cocinando'}, {'icon': 'medal', 'label': 'FÚTBOL', 'at': 'w:fútbol'}, {'icon': 'calendar', 'label': 'SALIR DEL TRABAJO', 'at': 'w:trabajo'}]}),
  ('13b', 'Mueve la rutina', 'streetWalk', {**NB, 'face': 'smile', 'stamp': st('SAL A CAMINAR', 'w:caminar', y=950, size=110, color=GREEN)}),
  ('13b', 'Y si te equivocas', 'myth', {**NB, 'text': ['¿UN DÍA FALLÉ,', 'TODO PERDIDO?'], 'verdict': 'NO', 'verdictColor': GREEN, 'verdictAt': 'w:tires'}),
  ('13b', 'En el estudio de Sussex', 'scientist', {**NB, 'who': 'doc', 'sepia': False, 'tag': 'UNIVERSIDAD DE SUSSEX', 'lines': [['w:menos', 'IGUAL BEBIERON MENOS']]}),

  # ---------------- 14. EL GIRO: LA COPA DE VINO ----------------
  ('14', 'Y ahora lo que te prometí', 'title', {**NB, 'in': FLASH, 'lines': ['LA COPA', 'DE VINO'], 'bg': 'red'}),
  ('14', 'Durante décadas', 'smoker', {**NB, 'puff': False, 'prop': 'wine', 'place': 'kitchen', 'face': 'smile', 'caption': '«BUENA PARA EL CORAZÓN»', 'capAt': 'w:corazón'}),
  ('14', 'Hasta salían estudios', 'chart', {**NB, 'title': 'RIESGO DE MUERTE (ESTUDIOS VIEJOS)', 'pts': [[0, 0.6], [0.3, 0.42], [0.6, 0.55], [1, 0.9]], 'color': GOLD, 'xlabels': [[0, 'NADA'], [0.3, 'POQUITO'], [1, 'MUCHO']], 'marks': [{'x': 0.3, 'label': '¿PROTEGE?', 'color': GREEN}]}),
  ('14', 'En dos mil veintitrés unos', 'journal', {**NB, 'head': 'JAMA NETWORK OPEN · 2023', 'title': '107 estudios · 4,8 millones', 'hiAt': 99}),
  ('14', 'Y encontraron el error', 'title', {**NB, 'lines': ['EL ERROR'], 'bg': 'red'}),
  ('14', 'En el grupo de los que', 'groups', {**NB, 'markAt': 'w:dejado'}),
  ('14', 'Y por qué alguien deja', 'groups', {**NB, 'markAt': 0, 'caption': 'PORQUE SE ENFERMÓ', 'capAt': 'w:enfermó'}),
  ('14', 'Entonces el grupo de no', 'groups', {**NB, 'markAt': 0, 'caption': 'PARECÍAN MÁS ENFERMOS', 'capAt': 'w:enfermo'}),
  ('14', 'Cuando corrigieron ese error', 'groups', {**NB, 'markAt': 0, 'sortAt': 0.3, 'caption': 'LA PROTECCIÓN DESAPARECIÓ', 'capAt': 'w:desapareció'}),
  ('14', 'No era que el vino', 'title', {**NB, 'lines': ['EL VINO NO CUIDABA.', 'LA ENFERMEDAD SEPARABA'], 'bg': 'dark'}),
  ('14', 'Y en dos mil veintitrés la', 'journal', {**NB, 'head': 'OMS · 2023', 'title': 'No existe un nivel seguro', 'hiAt': 99}),
  ('14', 'no existe una cantidad', 'title', {**NB, 'lines': ['NO EXISTE UNA', 'CANTIDAD SEGURA'], 'bg': 'red'}),
  ('14', 'Un trago de vez en cuando', 'myth', {**NB, 'text': ['¿UN TRAGO DE VEZ', 'EN CUANDO?'], 'verdict': 'NO ES MEDICINA', 'verdictColor': GOLD, 'verdictAt': 'w:medicina'}),

  # ---------------- 15. FINAL ----------------
  ('15', 'Entonces qué pasaría', 'title', {**NB, 'in': FLASH, 'lines': ['¿Y SI DEJARAS', 'EL ALCOHOL?'], 'bg': 'room'}),
  ('15', 'La primera noche duermes', 'bedWide', {'in': WHIP, 'clockH': 2, 'face': 'calm', 'badge': [12, 'h', 'noche']}),
  ('15', 'En dos días te hidratas', 'kidneyADH', {'in': WHIP, 'mode': 'clear', 'badge': [2, 'd', 'dos']}),
  ('15', 'En una semana el domingo', 'face', {'in': WHIP, 'who': 'hero', 'face': 'smile', 'dawn': 1, 'badge': [1, 'w', 'semana']}),
  ('15', 'En dos semanas el cerebro', 'mriCompare', {'in': WHIP, 'at': 0.1, 'badge': [2, 'w', 'dos']}),
  ('15', 'Y en un mes tu sangre', 'labReport', {'in': WHIP, 'head': 'ANÁLISIS DE SANGRE', 'rows': [['INSULINA', '−26 %', 0.2], ['VEGF / EGF', '↓↓', 0.5]], 'badge': [1, 'm', 'mes']}),
  ('15', 'Lo más difícil no es', 'offer', {**NB, 'prop': 'beer', 'noAt': 'w:más', 'word': '¡UNA NADA MÁS!', 'wordAt': 'w:amigo'}),
  ('15', 'Y si bebes mucho todos', 'hospitalBed', {**NB, 'face': 'calm', 'who': 'hero', 'stamp': st('CON AYUDA MÉDICA', 'w:médica', y=950, size=100, color=GREEN)}),
  ('15', 'Y tú Cuántos días llevas', 'comment', {**NB, 'in': DIP, 'text': '¿Cuántos días llevas sin tomar?', 'typeDur': 1.3}),
  ('15', 'Y suscríbete', 'endCard', {**NB, 'in': DIP, 'next': ['UN NUEVO', 'EXPERIMENTO', 'CADA SEMANA'], 'prop': 'bottle'}),
]
