'use strict';

/* ═══════════════════ GRUPOS MUSCULARES ═══════════════════ */
const G = {
  DOR:'Dorsal', EM:'Espalda media', TRA:'Trapecio',
  DL:'Delt. lateral', DP:'Delt. posterior', DA:'Delt. anterior',
  PEC:'Pecho', BI:'Bíceps', TRI:'Tríceps',
  CUA:'Cuádriceps', ISQ:'Isquios', GEM:'Gemelo',
  COR:'Core', PRE:'Prehab'
};

/* Objetivos de volumen semanal (series efectivas) por fase.
   Prehab no cuenta para el cómputo. */
const VOL_TARGET = {
  A: {[G.DOR]:[9,11],[G.EM]:[8,10],[G.DL]:[10,12],[G.DP]:[8,8],[G.PEC]:[8,9],
      [G.CUA]:[7,8],[G.ISQ]:[6,7],[G.BI]:[6,7],[G.TRI]:[6,6],[G.GEM]:[6,6],
      [G.TRA]:[5,6],[G.COR]:[9,11]},
  B: {[G.DOR]:[10,14],[G.EM]:[8,12],[G.DL]:[12,16],[G.DP]:[8,12],[G.PEC]:[8,12],
      [G.CUA]:[8,10],[G.ISQ]:[8,12],[G.BI]:[6,8],[G.TRI]:[6,9],[G.GEM]:[6,9],
      [G.TRA]:[6,8],[G.COR]:[6,9]}
};

/* ═══════════════════ CATÁLOGO DE EJERCICIOS ═══════════════════
   sub[] = sustitutos aprobados. Mismo patrón y mismo grupo muscular,
   para que la sustitución no rompa el cómputo de volumen.
   veto:true = nunca aparece en ninguna lista (historial de lesión). */
const EX = {

  /* ── Tracción vertical · PRIORIDAD 1 DEL AÑO ── */
  jalon_ancho:   {n:'Jalón al pecho, agarre ancho', g:G.DOR, p:'tracción vertical', r:150,
                  sub:['jalon_neutro','dominada_asist','jalon_unilateral','pullover_polea'],
                  tip:'Pecho arriba, codos hacia las caderas. Barra a la clavícula, nunca al cuello.'},
  jalon_neutro:  {n:'Jalón agarre neutro estrecho', g:G.DOR, p:'tracción vertical', r:120,
                  sub:['jalon_ancho','dominada_asist','jalon_unilateral'],
                  tip:'Recorrido largo, buscar el dorsal bajo.'},
  dominada_asist:{n:'Dominada asistida', g:G.DOR, p:'tracción vertical', r:150,
                  sub:['jalon_ancho','jalon_neutro','dominada_banda'],
                  tip:'Rango completo: brazos extendidos abajo, barbilla sobre la barra arriba. Objetivo S15: 8 reps SIN asistencia.'},
  dominada_banda:{n:'Dominada con banda elástica', g:G.DOR, p:'tracción vertical', r:150,
                  sub:['dominada_asist','jalon_ancho']},
  jalon_unilateral:{n:'Jalón unilateral en polea', g:G.DOR, p:'tracción vertical', r:90,
                  sub:['jalon_ancho','jalon_neutro']},
  pullover_polea:{n:'Pull-over en polea alta', g:G.DOR, p:'aislamiento dorsal', r:90,
                  sub:['pullover_mancu','jalon_unilateral'],
                  tip:'Codos casi fijos. Aislamiento puro de dorsal.'},
  pullover_mancu:{n:'Pull-over con mancuerna', g:G.DOR, p:'aislamiento dorsal', r:90,
                  sub:['pullover_polea']},

  /* ── Tracción horizontal · PRIORIDAD 1 ── */
  remo_barra:    {n:'Remo en barra', g:G.EM, p:'tracción horizontal', r:150,
                  sub:['remo_maquina','remo_mancuernas','remo_polea_baja','remo_pendlay'],
                  tip:'EL EJERCICIO CLAVE DEL AÑO. Torso a 45°, barra al ombligo, sin impulso de cadera. Objetivo S15: 80 kg × 8.'},
  remo_pendlay:  {n:'Remo Pendlay (desde el suelo)', g:G.EM, p:'tracción horizontal', r:150,
                  sub:['remo_barra','remo_mancuernas']},
  remo_maquina:  {n:'Remo en máquina pecho apoyado', g:G.EM, p:'tracción horizontal', r:120,
                  sub:['remo_barra','remo_polea_baja','remo_mancuernas'],
                  tip:'Retraer escápulas antes de tirar. Sin balanceo.'},
  remo_1mano:    {n:'Remo bajo a una mano (por lado)', g:G.EM, p:'tracción horizontal', r:90,
                  sub:['remo_maquina','remo_polea_baja','remo_mancuernas'],
                  tip:'Uno de tus favoritos. Apoyo en banco, tirón hacia la cadera.'},
  remo_polea_baja:{n:'Remo en polea baja', g:G.EM, p:'tracción horizontal', r:120,
                  sub:['remo_maquina','remo_barra','remo_1mano']},
  remo_mancuernas:{n:'Remo con mancuernas a dos manos', g:G.EM, p:'tracción horizontal', r:120,
                  sub:['remo_barra','remo_maquina','remo_1mano']},

  /* ── Trapecio ── */
  encogimiento:  {n:'Encogimiento con mancuernas', g:G.TRA, p:'elevación escapular', r:90,
                  sub:['encogimiento_barra','encogimiento_maq'],
                  tip:'Solo elevación vertical, sin rotar el hombro.'},
  encogimiento_barra:{n:'Encogimiento con barra', g:G.TRA, p:'elevación escapular', r:90,
                  sub:['encogimiento','encogimiento_maq']},
  encogimiento_maq:{n:'Encogimiento en máquina', g:G.TRA, p:'elevación escapular', r:90,
                  sub:['encogimiento','encogimiento_barra']},

  /* ── Empuje horizontal ── */
  press_banca:   {n:'Press banca plano', g:G.PEC, p:'empuje horizontal', r:150,
                  sub:['press_pecho_maq','press_incl_mancu','press_mancu_plano'],
                  tip:'Escápulas retraídas y fijas. Es tu marca de referencia histórica.'},
  press_incl_mancu:{n:'Press inclinado mancuernas 30°', g:G.PEC, p:'empuje horizontal', r:120,
                  sub:['press_incl_barra','press_pecho_maq','press_banca'],
                  tip:'Sin chocar las mancuernas arriba.'},
  press_incl_barra:{n:'Press inclinado con barra', g:G.PEC, p:'empuje horizontal', r:150,
                  sub:['press_incl_mancu','press_pecho_maq']},
  press_mancu_plano:{n:'Press plano con mancuernas', g:G.PEC, p:'empuje horizontal', r:120,
                  sub:['press_banca','press_pecho_maq']},
  press_pecho_maq:{n:'Press de pecho en máquina', g:G.PEC, p:'empuje horizontal', r:120,
                  sub:['press_banca','press_incl_mancu','press_mancu_plano']},
  aperturas_maq: {n:'Aperturas en máquina', g:G.PEC, p:'aducción horizontal', r:90,
                  sub:['cruce_polea','aperturas_mancu']},
  cruce_polea:   {n:'Cruce en polea', g:G.PEC, p:'aducción horizontal', r:90,
                  sub:['aperturas_maq','aperturas_mancu']},
  aperturas_mancu:{n:'Aperturas con mancuernas', g:G.PEC, p:'aducción horizontal', r:90,
                  sub:['aperturas_maq','cruce_polea']},

  /* ── Empuje vertical · SIN BARRA LIBRE ── */
  press_hombro_mancu:{n:'Press hombro mancuernas, agarre neutro', g:G.DA, p:'empuje vertical', r:120,
                  sub:['press_hombro_maq','landmine_press','press_arnold'],
                  tip:'PALMAS ENFRENTADAS todo el recorrido. Sustituye al militar en barra, que te lesionó.'},
  press_hombro_maq:{n:'Press hombro en máquina, agarre neutro', g:G.DA, p:'empuje vertical', r:120,
                  sub:['press_hombro_mancu','landmine_press','press_arnold']},
  landmine_press:{n:'Landmine press', g:G.DA, p:'empuje vertical', r:120,
                  sub:['press_hombro_mancu','press_hombro_maq']},
  press_arnold:  {n:'Press Arnold con mancuernas', g:G.DA, p:'empuje vertical', r:120,
                  sub:['press_hombro_mancu','press_hombro_maq','landmine_press'],
                  tip:'Rotación controlada, sin forzar el final del recorrido.'},
  press_militar_barra:{n:'Press militar con barra libre', g:G.DA, p:'empuje vertical', r:150,
                  sub:[], veto:true,
                  tip:'VETADO. Es el ejercicio que te lesionó el hombro derecho. No vuelve al programa.'},

  /* ── Deltoides lateral · PRIORIDAD 2 DEL AÑO ── */
  elev_lat_mancu:{n:'Elevación lateral con mancuerna', g:G.DL, p:'abducción', r:90,
                  sub:['elev_lat_maq','elev_lat_polea','elev_lat_inclinado'],
                  tip:'Peso ligero. Codo algo flexionado, subir hasta la horizontal. Progresa por reps, no por carga.'},
  elev_lat_maq:  {n:'Elevación lateral en máquina', g:G.DL, p:'abducción', r:90,
                  sub:['elev_lat_mancu','elev_lat_polea'],
                  tip:'Última serie a RIR 1. Aquí el fallo es seguro y barato.'},
  elev_lat_polea:{n:'Elevación lateral en polea (por lado)', g:G.DL, p:'abducción', r:90,
                  sub:['elev_lat_mancu','elev_lat_maq'],
                  tip:'Polea desde detrás del cuerpo, tensión constante en todo el recorrido.'},
  elev_lat_inclinado:{n:'Elevación lateral tumbado en banco', g:G.DL, p:'abducción', r:90,
                  sub:['elev_lat_mancu','elev_lat_polea']},

  /* ── Deltoides posterior ── */
  pajaros_maq:   {n:'Pájaros en máquina', g:G.DP, p:'abducción horizontal', r:90,
                  sub:['pajaros_mancu','pajaros_polea','remo_cuello'],
                  tip:'Codos ligeramente flexionados, sin encoger el trapecio.'},
  pajaros_mancu: {n:'Pájaros con mancuernas', g:G.DP, p:'abducción horizontal', r:90,
                  sub:['pajaros_maq','pajaros_polea']},
  pajaros_polea: {n:'Pájaros en polea cruzada', g:G.DP, p:'abducción horizontal', r:90,
                  sub:['pajaros_maq','pajaros_mancu']},
  remo_cuello:   {n:'Remo al cuello en polea', g:G.DP, p:'abducción horizontal', r:90,
                  sub:['pajaros_maq','pajaros_polea'],
                  tip:'Codos por encima de las muñecas.'},

  /* ── Prehabilitación de hombro · OBLIGATORIA ── */
  face_pull:     {n:'Face pull en polea', g:G.PRE, p:'prehab', r:60,
                  sub:['rot_externa','face_pull_banda'],
                  tip:'NO NEGOCIABLE. 5 minutos por sesión para proteger el hombro con el que harás el trabajo del año.'},
  face_pull_banda:{n:'Face pull con banda', g:G.PRE, p:'prehab', r:60, sub:['face_pull','rot_externa']},
  rot_externa:   {n:'Rotación externa en polea', g:G.PRE, p:'prehab', r:60,
                  sub:['rot_externa_banda','face_pull'],
                  tip:'Muy ligero. Codo pegado al costado.'},
  rot_externa_banda:{n:'Rotación externa con banda', g:G.PRE, p:'prehab', r:60, sub:['rot_externa','face_pull']},

  /* ── Cuádriceps · MANTENIMIENTO (punto fuerte: 155 kg reales) ── */
  sentadilla:    {n:'Sentadilla libre', g:G.CUA, p:'sentadilla', r:180,
                  sub:['sentadilla_multi','hack_squat','prensa_profunda'],
                  tip:'Punto fuerte. Mantenimiento estricto: 7-8 series/semana conservan la fuerza. Cinturón solo en series de ≤5 reps.'},
  sentadilla_multi:{n:'Sentadilla en multipower', g:G.CUA, p:'sentadilla', r:180,
                  sub:['sentadilla','hack_squat']},
  hack_squat:    {n:'Hack squat', g:G.CUA, p:'sentadilla', r:150,
                  sub:['sentadilla','sentadilla_multi','prensa']},
  prensa:        {n:'Prensa de piernas', g:G.CUA, p:'empuje de pierna', r:120,
                  sub:['hack_squat','zancadas','prensa_profunda'],
                  tip:'Sin bloquear la rodilla arriba.'},
  prensa_profunda:{n:'Prensa profunda', g:G.CUA, p:'empuje de pierna', r:120, sub:['prensa','hack_squat']},
  zancadas:      {n:'Zancadas con mancuernas', g:G.CUA, p:'empuje de pierna', r:120,
                  sub:['prensa','hack_squat']},

  /* ── Isquiosurales · PUNTO DÉBIL (ratio RDL/sentadilla 0,48) ── */
  rdl:           {n:'Peso muerto rumano', g:G.ISQ, p:'bisagra de cadera', r:150,
                  sub:['rdl_mancu','buenos_dias','rdl_multipower'],
                  tip:'PUNTO DÉBIL PRIORITARIO. Carga ligera, foco en estirar el isquio. Espalda neutra siempre. Objetivo S15: 90 kg × 8.'},
  rdl_mancu:     {n:'Peso muerto rumano con mancuernas', g:G.ISQ, p:'bisagra de cadera', r:120,
                  sub:['rdl','buenos_dias']},
  rdl_multipower:{n:'Peso muerto rumano en multipower', g:G.ISQ, p:'bisagra de cadera', r:150,
                  sub:['rdl','rdl_mancu']},
  buenos_dias:   {n:'Buenos días con barra', g:G.ISQ, p:'bisagra de cadera', r:120,
                  sub:['rdl','rdl_mancu']},
  curl_femoral:  {n:'Curl femoral tumbado', g:G.ISQ, p:'flexión de rodilla', r:90,
                  sub:['curl_femoral_sent','curl_femoral_pie'],
                  tip:'Controlar la fase excéntrica 2 segundos.'},
  curl_femoral_sent:{n:'Curl femoral sentado', g:G.ISQ, p:'flexión de rodilla', r:90,
                  sub:['curl_femoral','curl_femoral_pie']},
  curl_femoral_pie:{n:'Curl femoral de pie (unilateral)', g:G.ISQ, p:'flexión de rodilla', r:90,
                  sub:['curl_femoral','curl_femoral_sent']},

  /* ── Gemelo ── */
  gemelo_pie:    {n:'Gemelo de pie', g:G.GEM, p:'flexión plantar', r:90,
                  sub:['gemelo_sent','gemelo_prensa'],
                  tip:'Pausa de 1 segundo arriba y abajo. Rango completo.'},
  gemelo_sent:   {n:'Gemelo sentado', g:G.GEM, p:'flexión plantar', r:60,
                  sub:['gemelo_pie','gemelo_prensa']},
  gemelo_prensa: {n:'Gemelo en prensa', g:G.GEM, p:'flexión plantar', r:60,
                  sub:['gemelo_pie','gemelo_sent']},

  /* ── Bíceps · MANTENIMIENTO (punto fuerte) ── */
  curl_z:        {n:'Curl con barra Z', g:G.BI, p:'flexión de codo', r:90,
                  sub:['curl_mancu','curl_polea','curl_barra']},
  curl_barra:    {n:'Curl con barra recta', g:G.BI, p:'flexión de codo', r:90, sub:['curl_z','curl_mancu']},
  curl_mancu:    {n:'Curl con mancuernas', g:G.BI, p:'flexión de codo', r:90, sub:['curl_z','curl_polea']},
  curl_polea:    {n:'Curl en polea', g:G.BI, p:'flexión de codo', r:90, sub:['curl_z','curl_mancu']},
  curl_martillo: {n:'Curl martillo', g:G.BI, p:'flexión de codo', r:60, sub:['curl_mancu','curl_polea']},

  /* ── Tríceps ── */
  ext_tri_polea: {n:'Extensión tríceps polea con cuerda', g:G.TRI, p:'extensión de codo', r:90,
                  sub:['press_frances','fondos_asist','ext_tri_unilateral'],
                  tip:'Codos pegados al cuerpo.'},
  press_frances: {n:'Press francés', g:G.TRI, p:'extensión de codo', r:90,
                  sub:['ext_tri_polea','fondos_asist']},
  fondos_asist:  {n:'Fondos en máquina asistida', g:G.TRI, p:'extensión de codo', r:120,
                  sub:['ext_tri_polea','press_frances']},
  ext_tri_unilateral:{n:'Extensión tríceps unilateral en polea', g:G.TRI, p:'extensión de codo', r:60,
                  sub:['ext_tri_polea','press_frances']},

  /* ── Core ── */
  plancha:       {n:'Plancha frontal', g:G.COR, p:'antiextensión', r:60, unidad:'seg',
                  sub:['rueda_abs','plancha_lastre'],
                  tip:'Glúteo apretado, sin arquear lumbar.'},
  plancha_lastre:{n:'Plancha con lastre', g:G.COR, p:'antiextensión', r:60, unidad:'seg',
                  sub:['plancha','rueda_abs']},
  rueda_abs:     {n:'Rueda abdominal', g:G.COR, p:'antiextensión', r:60,
                  sub:[], veto:true,
                  tip:'VETADO por preferencia.'},
  crunch_polea:  {n:'Crunch en polea', g:G.COR, p:'flexión de tronco', r:60,
                  sub:['rueda_abs','elevacion_piernas']},
  elevacion_piernas:{n:'Elevación de piernas colgado de barra', g:G.COR, p:'flexión de tronco', r:60,
                  sub:[], veto:true,
                  tip:'VETADO. Con tu fuerza de tracción actual el agarre y la estabilidad escapular fallan antes que el abdomen: no estimula el core y suma fatiga al hombro.'},
  pallof:        {n:'Pallof press (por lado)', g:G.COR, p:'antirrotación', r:60,
                  sub:['plancha_lateral'],
  elev_piernas_silla:{n:'Elevación de piernas en silla romana', g:G.COR, p:'flexión de tronco', r:60,
                  sub:['elev_rodillas_paralelas','crunch_polea','hollow_hold'],
                  tip:'Espalda apoyada, sin balancear. Sube por contracción abdominal, no por impulso de cadera. Baja controlado 2 s.'},
  elev_rodillas_paralelas:{n:'Elevación de rodillas en paralelas', g:G.COR, p:'flexión de tronco', r:60,
                  sub:['elev_piernas_silla','crunch_polea'],
                  tip:'Versión más fácil: rodillas flexionadas en lugar de piernas extendidas.'},
  dead_bug:      {n:'Dead bug', g:G.COR, p:'control lumbopélvico', r:60,
                  sub:['plancha','hollow_hold'],
                  tip:'Lumbar pegada al suelo todo el rato. Si se despega, has ido demasiado lejos.'},
  hollow_hold:   {n:'Hollow hold', g:G.COR, p:'antiextensión', r:60, unidad:'seg',
                  sub:['plancha','dead_bug']},
                  tip:'Antirrotación. Sin girar el tronco.'},
  plancha_lateral:{n:'Plancha lateral', g:G.COR, p:'antirrotación', r:60, unidad:'seg',
                  sub:['pallof','plancha']}
};

/* ═══════════════════ PLANTILLAS DE SESIÓN ═══════════════════
   ex: [idEjercicio, series, reps, cargaInicial]  · carga 0 = a determinar */
const SESSIONS = {

  /* ── SEMANA 0 · Prólogo de anclaje (19-23 ago) · RIR 5 ── */
  S0A:{n:'S0-A · Patrones tirón y empuje', fase:'S0', dur:50,
    nota:'RIR 5, muy lejos del fallo. Vas a salir pensando que no has hecho nada: eso es el objetivo.',
    ex:[['jalon_ancho',2,12,40],['remo_barra',2,10,25],['press_banca',2,10,40],
        ['press_hombro_mancu',2,12,10],['elev_lat_mancu',2,15,5],
        ['face_pull',2,20,0],['rot_externa',2,15,0]]},

  S0B:{n:'S0-B · Patrones pierna y core', fase:'S0', dur:50,
    nota:'RIR 5. La sentadilla a 80 kg te parecerá una broma con un 1RM de 155. Déjala en 80: hoy se entrena el tejido conectivo, no el músculo.',
    ex:[['sentadilla',3,6,80],['rdl',2,12,35],['prensa',2,15,0],
        ['curl_femoral',2,12,0],['gemelo_pie',2,20,0],['plancha',2,30,0]]},

  S0C:{n:'S0-C · Hombro, brazo y prehab', fase:'S0', dur:45,
    nota:'RIR 4. Los aislamientos de hombro toleran algo más.',
    ex:[['elev_lat_maq',3,15,0],['dominada_asist',2,8,45],['remo_1mano',2,12,15],
        ['pajaros_maq',2,15,0],['curl_z',2,12,0],['ext_tri_polea',2,15,0],['face_pull',2,20,0]]},

  /* ── FASE A · Semanas 1-3 (24 ago - 13 sep) ── */
  D1:{n:'D1 Lunes · Tirón A — Anchura', fase:'A', dia:1, dur:75,
    nota:'Prioridad nº1 del año: tracción vertical.',
        ex:[['jalon_ancho',3,10,50],['dominada_asist',3,8,40],['remo_maquina',3,12,0],
        ['pullover_polea',2,15,0],['pajaros_maq',3,15,0],
        ['face_pull',2,20,0],['rot_externa',2,15,0],['elev_piernas_silla',3,12,0]]},

  D2:{n:'D2 Martes · Empuje', fase:'A', dia:2, dur:70,
    nota:'Recordatorio: el press militar con barra libre no vuelve al programa.',
    ex:[['press_banca',3,8,50],['press_incl_mancu',3,10,18],['press_hombro_mancu',3,10,14],
        ['elev_lat_mancu',3,15,7],['ext_tri_polea',3,12,0],['face_pull',2,20,0]]},

  D3:{n:'D3 Miércoles · Pierna y core', fase:'A', dia:3, dur:80,
    nota:'Mantenimiento estricto. Sin cinturón en toda la Fase A. La recuperación que ahorras aquí se invierte en espalda y hombro.',
        ex:[['sentadilla',4,6,100],['rdl',3,10,45],['prensa',3,12,0],
        ['curl_femoral',3,12,0],['gemelo_pie',3,15,0],['plancha',2,40,0],['pallof',2,12,0]]},

  D4:{n:'D4 Jueves · Tirón B — Densidad', fase:'A', dia:4, dur:80,
    nota:'El remo en barra es el ejercicio más importante del año: de 40×8 a 80×8 en 15 semanas.',
    ex:[['remo_barra',4,8,30],['jalon_neutro',3,10,50],['remo_1mano',3,12,20],
        ['encogimiento',3,15,0],['elev_lat_polea',3,15,0],
        ['curl_z',2,10,0],['curl_martillo',2,12,0],['rot_externa',2,15,0]]},

  D5:{n:'D5 Viernes · Hombro y brazo', fase:'A', dia:5, dur:70,
    nota:'Sesión de "cocos". Última serie de laterales a RIR 1: aquí el fallo es seguro.',
        ex:[['elev_lat_maq',4,15,0],['press_arnold',3,10,0],['aperturas_maq',3,15,0],
        ['remo_cuello',3,15,0],['curl_polea',3,12,0],['ext_tri_polea',3,12,0],
        ['gemelo_sent',3,20,0],['crunch_polea',3,12,0]]},

  /* ── PROTOCOLO DE MÍNIMOS ── */
  N2A:{n:'N2-A · Full body reducido', fase:'N2', dur:50,
    nota:'Nivel 2: semana de estrés alto o sueño corto. Cargas al 90%, objetivo no perder nada.',
    ex:[['jalon_ancho',3,10,0],['press_banca',2,8,0],['sentadilla',3,6,0],
        ['elev_lat_mancu',3,15,0],['face_pull',2,20,0]]},
  N2B:{n:'N2-B · Full body reducido', fase:'N2', dur:50,
    nota:'Nivel 2. Complementa a N2-A.',
    ex:[['remo_barra',3,8,0],['press_hombro_mancu',3,10,0],['rdl',3,10,0],
        ['elev_lat_maq',3,15,0],['curl_z',2,12,0],['rot_externa',2,15,0]]},
  N3A:{n:'N3-A · Viaje / hotel', fase:'N3', dur:35,
    nota:'Nivel 3: mancuernas o peso corporal. Con 10.000 pasos y proteína alta, no pierdes nada en una semana.',
    ex:[['remo_mancuernas',3,12,0],['press_mancu_plano',3,12,0],['zancadas',3,12,0],
        ['elev_lat_mancu',3,15,0],['plancha',3,45,0]]},
  N3B:{n:'N3-B · Viaje / hotel', fase:'N3', dur:35,
    nota:'Nivel 3.',
    ex:[['jalon_ancho',3,12,0],['press_hombro_mancu',3,12,0],['rdl_mancu',3,12,0],
        ['pajaros_mancu',3,15,0],['face_pull_banda',2,20,0]]}
};

/* Reparto semanal L-V de la Fase A. 0 = domingo. */
const WEEK_PLAN = {1:'D1', 2:'D2', 3:'D3', 4:'D4', 5:'D5'};

/* RIR objetivo por semana dentro del mesociclo de 6 semanas */
const RIR_WEEK = {1:3, 2:3, 3:2, 4:2, 5:1, 6:'descarga'};

/* ═══════════════════ RUNNING ═══════════════════ */
const RUN_TYPES = {
  z2:      {n:'Rodaje fácil (Z2)', ritmo:'6:45–7:15', fc:'115–134',
            tip:'Si no puedes mantener una conversación, vas demasiado rápido. Esto es 45-75 s/km MÁS LENTO que tu ritmo habitual de 6:00.'},
  largo:   {n:'Rodaje largo', ritmo:'6:30–6:50', fc:'125–140'},
  tempo:   {n:'Tempo / umbral', ritmo:'5:40–5:50', fc:'165–175'},
  series:  {n:'Series', ritmo:'5:00–5:10 (1.000 m) · 4:45–4:55 (400 m)', fc:'—'},
  objetivo:{n:'Ritmo objetivo 10K', ritmo:'5:18', fc:'—'},
  caminata:{n:'Caminata', ritmo:'—', fc:'—'}
};

/* Plan de running de la Fase A. Semana 0 incluida. */
const RUN_PLAN = {
  0:[{d:6,t:'z2',min:20},{d:0,t:'caminata',min:40}],
  1:[{d:6,t:'z2',min:25},{d:0,t:'caminata',min:45}],
  2:[{d:5,t:'z2',min:20},{d:6,t:'z2',min:30},{d:0,t:'z2',min:20}],
  3:[{d:5,t:'z2',min:20},{d:6,t:'z2',min:35},{d:0,t:'z2',min:25}]
};

/* ═══════════════════ FASES DEL MACROCICLO ═══════════════════ */
const PHASES = [
  {id:'S0', n:'Semana 0 · Anclaje',        desde:'2026-08-19', hasta:'2026-08-23',
   kcal:2559, prot:162, hc:316, grasa:76, pasos:5000, dormir:'00:00'},
  {id:'A',  n:'Fase A · Calibración',      desde:'2026-08-24', hasta:'2026-09-13',
   kcal:2559, prot:162, hc:316, grasa:76, pasos:6500, dormir:'23:30'},
  {id:'B',  n:'Fase B · Recomposición',    desde:'2026-09-14', hasta:'2026-12-06',
   kcal:2350, prot:160, hc:270, grasa:70, pasos:8000, dormir:'23:30'},
  {id:'C',  n:'Fase C · Mantenim. navideño',desde:'2026-12-07', hasta:'2027-01-03',
   kcal:2700, prot:160, hc:330, grasa:80, pasos:8000, dormir:'23:30'},
  {id:'D',  n:'Fase D · Peaking 10K',      desde:'2027-01-04', hasta:'2027-02-14',
   kcal:2500, prot:160, hc:300, grasa:70, pasos:9000, dormir:'23:30'},
  {id:'E',  n:'Fase E · Descarga',         desde:'2027-02-15', hasta:'2027-02-21',
   kcal:2650, prot:160, hc:320, grasa:78, pasos:8000, dormir:'23:30'},
  {id:'F',  n:'Fase F · Hipertrofia',      desde:'2027-02-22', hasta:'2027-05-16',
   kcal:2950, prot:165, hc:390, grasa:82, pasos:8000, dormir:'23:30'},
  {id:'G',  n:'Fase G · Definición',       desde:'2027-05-17', hasta:'2027-07-11',
   kcal:2300, prot:170, hc:250, grasa:68, pasos:10000, dormir:'23:30'},
  {id:'H',  n:'Fase H · Estabilización',   desde:'2027-07-12', hasta:'2027-08-22',
   kcal:2650, prot:160, hc:320, grasa:78, pasos:9000, dormir:'23:30'}
];

/* Hitos verificables del macrociclo */
const MILESTONES = [
  {f:'2026-09-13', t:'Cierre Fase A: TDEE real + 7 marcas de referencia'},
  {f:'2026-10-25', t:'Retest 1: marcas de feb-abr recuperadas'},
  {f:'2026-12-06', t:'75,5 kg · dominada 8 sin asistencia · remo 80×8 · RDL 90×8'},
  {f:'2027-01-03', t:'Peso mantenido en 75,5 ± 0,5 kg'},
  {f:'2027-02-14', t:'10 K — objetivo 53:00 (5:18/km)'},
  {f:'2027-05-16', t:'77,5 kg · perímetro de hombros +4 cm'},
  {f:'2027-07-11', t:'73,0 kg · 11-12 % grasa · abdominales visibles'},
  {f:'2027-08-22', t:'72,5-74 kg estabilizado'}
];

/* Marcas de referencia a registrar en la Semana 3 (RIR 2, sin tests a 1RM) */
const BENCHMARKS = [
  {ex:'sentadilla',         reps:6,  nota:'6 reps @ RIR 2'},
  {ex:'press_banca',        reps:8,  nota:'8 reps @ RIR 2'},
  {ex:'remo_barra',         reps:8,  nota:'8 reps @ RIR 2 — clave del año'},
  {ex:'rdl',                reps:10, nota:'10 reps @ RIR 2'},
  {ex:'press_hombro_mancu', reps:10, nota:'10 reps @ RIR 2 (por mano)'},
  {ex:'dominada_asist',     reps:0,  nota:'Reps máximas con 35 kg de asistencia'},
  {ex:'elev_lat_mancu',     reps:15, nota:'15 reps @ RIR 1'}
];