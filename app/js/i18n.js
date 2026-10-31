// Textos de la interfaz. El español va aquí (es la base y el respaldo); los otros idiomas están en
// i18n-<código>.js y se descargan solo cuando se usan, así la app pesa menos al abrir.
// Para agregar un idioma: copia el bloque "es" en i18n-<código>.js, tradúcelo y agrega su código en IDIOMAS_UI.
export const IDIOMAS_UI = ['es', 'en', 'pt', 'fr', 'it', 'de'];

const T = {
  es: {
    racha_1: '1 día de racha', tarjetas_1: '1 tarjeta', cambiar_idioma: 'Cambiar idioma',
    lema: 'Aprende idiomas en minutos, deslizando.',
    menu_titulo: 'Menú principal', menu_jugar: '¡Jugar!', menu_temas: 'Temas', menu_idioma: 'Idioma', menu_hoy: 'Hoy: {n} palabras', menu_premio: 'Faltan {n} para tu próximo premio',
    nube_conectada: 'Conectada con Google ({email}). Tu avance se guarda en la nube.', nube_error: 'No se pudo entrar con Google. Revisa tu conexión e intenta de nuevo.', nube_salio: 'Sesión cerrada. Tu avance sigue en este navegador.', nube_guardando: 'Avance guardado en la nube', aj_salir: 'Cerrar sesión de Google',
    aj_meta: 'Meta diaria', aj_meta_nota: 'Tu sakura florece a medida que repasas palabras cada día.', meta_n: '{n} palabras', meta_progreso: 'Meta: {n}/{m} palabras', meta_lista: '¡Meta cumplida!', meta_cumplida: '¡Meta del día cumplida! Tu sakura floreció 🌸', racha_sube_1: '¡Racha de 1 día! Sigue así', racha_sube_n: '¡Racha de {n} días! Sigue así', cofre_titulo: '¡Cofre de racha!', cofre_texto: '{n} días seguidos estudiando. Toca el cofre para abrirlo.', cofre_abrir: 'Abrir el cofre',
    aj_app: 'App', inst_boton: 'Descargar la app', inst_titulo: 'Lleva Franui Polykat en tu pantalla de inicio', inst_texto: 'Se abre como una app, a pantalla completa y también sin internet.', inst_lista: '¡Listo! Franui Polykat ya está en tu pantalla de inicio.', inst_ya: 'Ya tienes la app instalada.', inst_ios_1: 'Abre esta página en Safari.', inst_ios_2: 'Toca el botón Compartir (el cuadrado con la flecha hacia arriba).', inst_ios_3: 'Elige «Agregar a inicio» y toca «Agregar».', inst_and_1: 'Abre el menú del navegador (⋮ arriba a la derecha).', inst_and_2: 'Toca «Instalar app» o «Agregar a la pantalla de inicio».', inst_and_3: 'Confirma con «Instalar».', inst_pc_1: 'En Chrome o Edge, toca el ícono de instalar en la barra de direcciones (o el menú ⋮ → «Instalar Franui»).', inst_pc_2: 'Confirma con «Instalar».',
    hist_titulo: "Historia del día", hist_abrir: "Ver la historia del día de Kitty", hist_k1: "¡Hola! Esta es la frase de hoy:", hist_signif: "Significa:", hist_k3: "Úsala hoy en una conversación. ¡Mañana te traigo otra!", hist_guardar: "Guardar en favoritos", hist_guardada: "Guardada en favoritos", hist_cerrar: "Cerrar la historia", hist_sin: "Aún no hay frases para este par de idiomas.",
    hist_ant: "Pantalla anterior", hist_sig: "Pantalla siguiente",
    dom_titulo: "¡Dominada!", dom_texto: "Ya dominas «{palabra}». Kitty está orgullosa.", dom_bono: "+{n} Kitty tokens", dom_seguir: "Seguir aprendiendo", dom_total: "Palabras dominadas: {n}",
    rec_titulo: "Recordatorio diario", rec_activar: "Avisarme si no he estudiado", rec_hora: "Hora", rec_calendario: "Agregar al calendario", rec_cal_nota: "Funciona en cualquier celular: crea un aviso diario en tu calendario.", rec_sin_permiso: "Activa las notificaciones para Franui en tu navegador.", rec_no_soporta: "Tu navegador no permite avisos automáticos. Usa «Agregar al calendario».", rec_ok: "Listo: Kitty te avisará a las {h}.", rec_noti_titulo: "¡Kitty te extraña! 🌸", rec_noti_texto: "Dale un minuto a tus idiomas y riega tu sakura.", rec_evento: "Estudiar con Kitty (Franui · Polykat)",
    rank_xp: "Liga", liga_brote: "Liga Brote", liga_capullo: "Liga Capullo", liga_sakura: "Liga Sakura", liga_jardin: "Liga Jardín", liga_xp: "{n} XP esta semana", liga_meta: "Con {n} XP subes de liga", liga_max: "¡Estás en la liga más alta! Mantén {n} XP para quedarte.", liga_dias_n: "Termina en {n} días", liga_dias_1: "Termina hoy", liga_como: "Cada palabra que revisas suma 1 XP. La semana cierra el domingo: con 100 XP subes; con menos de 20 bajas.", liga_sube: "¡Subiste a la {liga}! 🌸", liga_baja: "Bajaste a la {liga}. ¡Esta semana la recuperas!", liga_solo: "Aún no hay más personas en tu liga esta semana.",
    jar_tab_mundo: "Explorar", mundo_te: "Jardín del té", mundo_estanque: "Estanque y puente", mundo_faroles: "Calle de faroles", mundo_mirador: "Mirador del Fuji", mundo_bloq: "Se desbloquea con tu sakura en nivel {n}", mundo_te_t: "Tu sakura y tu rincón para el té.", mundo_estanque_t: "Toca los koi: saltan y te traen suerte.", mundo_faroles_t: "Toca los faroles para encenderlos. De noche brillan solos.", mundo_mirador_t: "Toca el paisaje y deja que caigan los pétalos.", mundo_ant: "Espacio anterior", mundo_sig: "Espacio siguiente", mundo_ir: "Ir a {nombre}", mundo_luz: "¡La calle de faroles brilla! ✨", mundo_nuevo: "¡Nuevo espacio en tu mundo: {nombre}!",
    tz_0: "Paso a paso florece el sakura", tz_1: "Un minuto hoy vale mucho", tz_2: "Equivocarse también es aprender", tz_3: "Tu voz suena bien en otro idioma", tz_4: "Hoy sabes más que ayer", tz_5: "Kitty cree en ti", tz_6: "Cada palabra es una semilla",
    caq_label: "Caquita de Kitty: tócala para limpiar", caq_limpia: "¡Jardín limpio! +{n} tokens y abono natural 🌱", caq_aviso_n: "Kitty dejó {n} caquitas en el jardín… ¡límpialas!", caq_aviso_1: "Kitty dejó una caquita en el jardín… ¡límpiala!", caq_k: "¡Ups! Perdón… 🙈",
    sug_enviada: "¡Gracias! Tu mensaje le llegó a Francisca. 💌", sug_pendiente: "Quedó guardada y se enviará apenas haya conexión.", buzon_titulo: "Buzón de sugerencias", buzon_abrir: "Ver buzón de sugerencias", buzon_vacio: "Aún no hay sugerencias.", buzon_nuevas_n: "{n} sin leer", buzon_nuevas_1: "1 sin leer", buzon_leida: "Marcar como leída", buzon_no_leida: "Marcar como no leída", buzon_borrar: "Borrar", buzon_anonimo: "Sin nombre", buzon_error: "No se pudo cargar el buzón. Revisa tu conexión y que las reglas de Firestore estén al día.", buzon_borrar_ok: "Sugerencia borrada",
    aj_meta_fija: "Tu racha del día se cumple al revisar 20 palabras.", baile_titulo: "¡Racha del día cumplida!", baile_dias_n: "{n} días seguidos", baile_dias_1: "¡Tu primer día de racha!", baile_texto: "Revisaste 20 palabras hoy. ¡Kitty baila de alegría!", baile_ok: "¡Seguir!",
    libre_titulo: "Estudio libre", libre_abrir: "Estudio libre: repasa lo que quieras", libre_texto: "Elige las palabras que quieras repasar. No cambia tu calendario de repasos: suma monedas y XP, y si fallas una, vuelve pronto.", libre_buscar: "Buscar una palabra", libre_tema: "Tema", libre_todos_temas: "Todos los temas", libre_f_vistas: "Ya vistas", libre_f_todas: "Todas", libre_f_favoritos: "Favoritos", libre_n: "{n} palabras", libre_1: "1 palabra", libre_marcar: "Marcar las visibles", libre_desmarcar: "Quitar todas", libre_estudiar: "Estudiar {n}", libre_azar: "10 al azar", libre_vacio: "No hay palabras con ese filtro.", libre_mas: "Mostrando {n} de {m}. Usa el buscador para encontrar otras.",
    dia_atrapa: "¡Un diamante! Tócalo antes de que se vaya", dia_ganado: "¡Atrapaste un diamante! 💎", dia_50: "¡50 palabras hoy! Ganaste un diamante 💎", dia_n: "{n} diamantes", dia_1: "1 diamante", dia_cambiar: "Cambiar 1 💎 por {n} tokens", dia_cambiado: "¡Listo! +{n} tokens", dia_sin: "Aún no tienes diamantes. Llega a 50 palabras en el día o atrapa uno cuando aparezca.", dia_titulo: "Diamantes",
    ej_escuchar: "Escuchar el ejemplo", ej_ojo: "Ojo con esta palabra",
    aj_musica: "Música de fondo (lo-fi 8 bits)",
    traspaso_ok: "¡Nueva dirección! Tu avance viajó contigo 🌸",
    empieza_aqui: "Empieza aquí",
    inst_aviso_titulo: "Descarga Franui", inst_aviso_sub: "Gratis · en tu pantalla de inicio", inst_aviso_boton: "Instalar", inst_aviso_cerrar: "Ahora no", inst_otra_1: "Estás dentro de otra app (Instagram, TikTok…) y ahí no se puede instalar.", inst_otra_2: "Toca ⋮ o ··· (arriba) y elige «Abrir en el navegador» (Chrome o Safari).", inst_otra_3: "Ahí vuelve a tocar «Instalar».",
    buzon_sin_permiso: "Firestore no dejó marcarla: revisa que las reglas tengan la línea «allow update» del buzón.",
    prueba_empezar: "Prueba de Kitty (3 palabras)", prueba_titulo: "Prueba de Kitty", prueba_paso: "Palabra {i} de {n}", prueba_pregunta: "¿Qué significa? Escríbelo en {idioma}", prueba_comprobar: "Comprobar", prueba_saltar: "Ahora no", prueba_siguiente: "Siguiente", prueba_ver: "Ver resultado", prueba_era: "Era:", prueba_resultado: "{a} de {n} correctas", prueba_todo: "¡Perfecto! Kitty está orgullosa de ti.", prueba_algo: "¡Bien! Las que fallaste vuelven a repaso.", prueba_nada: "No pasa nada: esas palabras vuelven a repaso para que las recuerdes.",
    nav_jardin: 'Jardín', jar_titulo: 'Jardín de Sakura', jar_tab_jardin: 'Mi jardín', jar_tab_tienda: 'Tienda de Kitty', jar_nivel: 'Nivel {n}', jar_prod: '{n} tokens por hora', jar_crece: 'Crecimiento {n}/{m}', jar_recoger: 'Recoger {n} tokens', jar_nada: 'Tu sakura está produciendo tokens…', jar_lleno: '¡El cesto está lleno! Recoge tus tokens.', jar_decorar: 'Decorar', jar_listo: 'Listo', jar_arrastra: 'Arrastra los adornos para moverlos. Toca uno de la lista para mostrarlo u ocultarlo.', jar_fondo: 'Cielo', jar_fondo_dia: 'Día', jar_como: 'Cada palabra que estudias riega tu sakura (+1) y cumplir la meta del día suma +10. El abono lo hace crecer más rápido. Cada objeto de la tienda sube un 10 % lo que produce.', jar_sube_titulo: '¡Tu sakura creció!', jar_sube_texto: 'Nivel {n}: {nombre}. Ahora produce {p} tokens por hora.', jar_sube_toast: '¡Tu sakura creció a nivel {n}!', jar_sin_decor: 'Aún no tienes adornos. ¡Visita la tienda de Kitty!', jar_ir: 'Ir al jardín', jar_listos: '{n} tokens listos', jar_k1: '¡Qué rico el té bajo el sakura!', jar_k2: 'Si estudias un poquito, el árbol crece.', jar_k3: 'Vuelve cada día: el cesto de tokens se llena.', tienda_abono: 'Abono', tienda_decor: 'Rincón del té', tienda_ambiente: 'Ambiente', tienda_fondo: 'Cielo', tienda_especial: 'Especial', tienda_tienes: 'Lo tienes', tienda_faltan: 'Te faltan {n}', tienda_max: 'Tienes el máximo', tienda_comprado: '¡Listo! {nombre}', tienda_reservas: 'Guardadas: {n}', protector_usado: '¡Tu sakura de reserva salvó tu racha! 🌸', etapa_0: 'Semilla', etapa_1: 'Brote', etapa_2: 'Retoño', etapa_3: 'Arbolito', etapa_4: 'Árbol joven', etapa_5: 'Primera flor', etapa_6: 'Sakura en flor', etapa_7: 'Gran sakura', it_abono: 'Abono', itd_abono: '+10 de crecimiento.', it_abono_grande: 'Abono grande', itd_abono_grande: '+35 de crecimiento.', it_abono_magico: 'Abono mágico', itd_abono_magico: '+110 de crecimiento, con brillo.', it_mantel: 'Mantel de picnic', itd_mantel: 'Cuadros rojos para sentarse bajo el árbol.', it_set_te: 'Set de té', itd_set_te: 'Tetera y tazas para el matcha.', it_cesta: 'Cesta de picnic', itd_cesta: 'Con onigiri y fruta.', it_dango: 'Dango', itd_dango: 'Tres bolitas dulces de colores.', it_cojin: 'Cojín', itd_cojin: 'Un zabuton morado y suave.', it_farol: 'Farol de piedra', itd_farol: 'Ilumina el jardín de noche.', it_chochin: 'Faroles de papel', itd_chochin: 'Cuelgan de las ramas.', it_wagasa: 'Sombrilla', itd_wagasa: 'Una wagasa roja para el sol.', it_banca: 'Banca', itd_banca: 'Para mirar caer los pétalos.', it_estanque: 'Estanque con koi', itd_estanque: 'Dos peces de colores.', it_furin: 'Campanita de viento', itd_furin: 'Suena cuando sopla la brisa.', it_columpio: 'Columpio', itd_columpio: 'Cuelga de una rama fuerte.', it_petalos: 'Lluvia de pétalos', itd_petalos: 'Caen muchos más pétalos.', it_mariposas: 'Mariposas', itd_mariposas: 'Revolotean alrededor del árbol.', it_luciernagas: 'Luciérnagas', itd_luciernagas: 'Brillan entre las flores.', it_atardecer: 'Cielo de atardecer', itd_atardecer: 'Tonos rosados y naranjos.', it_noche: 'Cielo de noche', itd_noche: 'Luna y estrellas.', it_protector: 'Sakura de reserva', itd_protector: 'Protege tu racha si un día no estudias.',
    it_maneki: 'Gato de la suerte', itd_maneki: 'Un maneki-neko que llama a la fortuna.', it_teru: 'Teru teru bozu', itd_teru: 'Muñequito que pide días soleados.', it_daruma: 'Daruma', itd_daruma: 'Amuleto para cumplir tus metas.', it_koinobori: 'Koinobori', itd_koinobori: 'Carpas de tela que bailan con el viento.', it_torii: 'Torii', itd_torii: 'La puerta roja de los santuarios.', it_tanzaku: 'Tanzaku', itd_tanzaku: 'Papelitos de deseos en un bambú.',
    rank_nivel: 'Jardín', rank_entra: 'Entra con Google para ver el ranking y competir con otras personas.', rank_vacio: 'Por ahora estás sola/o en el ranking. ¡Invita a alguien a estudiar contigo!', rank_error: 'No se pudo cargar el ranking. Revisa tu conexión e intenta de nuevo.', rank_oculto: 'No apareces en el ranking (puedes activarlo en Ajustes).', rank_puesto: 'Vas en el puesto {n}.', aj_ranking: 'Aparecer en el ranking (solo tu nombre y tus números, nunca tu correo)',
    rank_t_racha: 'Racha',
    nav_aprender: 'Aprender', nav_favoritos: 'Favoritos', nav_ranking: 'Ranking', nav_novedades: 'Novedades', nav_ajustes: 'Ajustes',
    racha_n: '{n} días de racha', tokens_n: '{n} Kitty tokens', idioma_nativo: 'Idioma nativo', perfil: 'Perfil',
    login_entrar: 'Entrar', login_crear: 'Crear cuenta', login_usuario: 'Nombre de usuario', login_clave: 'Contraseña',
    login_clave_min: 'Mínimo 6 caracteres', login_google: 'Continuar con Google', login_invitado: 'Continuar sin cuenta',
    login_invitado_nota: 'Sin cuenta, tu avance se guarda solo en este navegador.',
    login_pronto: 'Las cuentas en la nube llegan pronto. Por ahora tu avance se guarda en este navegador.',
    login_error_usuario: 'Escribe un nombre de usuario.', login_error_clave: 'La contraseña necesita al menos 6 caracteres.', login_o: 'o',
    cons_titulo: '¿Qué avance conservo?', cons_texto: 'Tu cuenta y este navegador tienen avances distintos. Elige cuál seguir usando; el otro se reemplaza.',
    cons_cuenta: 'Usar el de mi cuenta', cons_navegador: 'Usar el de este navegador',
    cons_linea: '{tokens} tokens · {ejercicios} ejercicios · {racha} días de racha · {palabras} palabras',
    cons_demo: 'Vista de demostración: la cuenta es un ejemplo.',
    idiomas_titulo: '¿Qué quieres aprender?', idiomas_sub: 'Elige un idioma. Puedes cambiarlo cuando quieras.',
    estado_nuevo: 'Nuevo', estado_pronto: 'Próximamente', aprendiendo: 'Aprendiendo',
    temas_titulo: 'Temas', temas_sub: 'Elige un tema y desliza.', tarjetas_n: '{n} tarjetas', traduccion_en_camino: 'Traducción en camino',
    todo_el_tema: 'Todo el tema', dificultad: 'Dificultad', dif_todas: 'Todas', dif_facil: 'Fácil', dif_medio: 'Medio', dif_dificil: 'Difícil',
    empezar: 'Empezar', bloque_n: 'Bloque {n} de {total}', volver: 'Volver', dominadas_n: '{n} dominadas',
    niv_nueva: 'Nueva', niv_dificil: 'Difícil', niv_media: 'Media', niv_facil: 'Fácil', niv_dominada: 'Dominada',
    toca_ver: 'Toca para ver la traducción', lo_se: 'Lo sé', repasar: 'Repasar', escuchar: 'Escuchar',
    favorito: 'Guardar en favoritos', quitar_favorito: 'Quitar de favoritos', borrador: 'Traducción en revisión',
    desliza: 'Desliza hacia arriba para seguir', sin_voz: 'Tu navegador no tiene voz para este idioma.',
    fin_titulo: '¡Sesión completa!', fin_sabias: 'Lo sabías', fin_repasar: 'Para repasar', fin_tokens: 'Kitty tokens',
    otra_sesion: 'Otra sesión', cambiar_tema: 'Cambiar tema', aldia_titulo: '¡Todo al día!',
    aldia_texto: 'No tienes tarjetas pendientes en este tema. Vuelve mañana o practica igual.', practicar: 'Practicar igual',
    vacio_tema: 'Este tema todavía no tiene traducciones para tu par de idiomas.',
    fav_titulo: 'Palabras favoritas', fav_vacio: 'Toca el corazón en una tarjeta para guardarla aquí.', fav_estudiar: 'Estudiar favoritas',
    rank_titulo: 'Ranking', rank_racha: 'Días de racha', rank_palabras: 'Palabras', rank_tu: 'Tú',
    rank_pronto: 'El ranking con otras personas se activa cuando existan las cuentas en la nube.',
    nov_titulo: 'Novedades',
    aj_titulo: 'Ajustes', aj_apariencia: 'Apariencia', aj_tema: 'Tema', aj_sistema: 'Del dispositivo', aj_claro: 'Claro', aj_oscuro: 'Oscuro',
    aj_paleta: 'Paleta', pal_higo: 'Higo', pal_piedra: 'Piedra', pal_carbon: 'Carbón', pal_tamarindo: 'Tamarindo', pal_medianoche: 'Medianoche',
    aj_letra: 'Tamaño de letra', aj_brillo: 'Brillo', aj_ipa: 'Mostrar pronunciación escrita (IPA)',
    aj_sonido: 'Sonidos y vibración', premio_titulo: '¡Premio!', premio_texto: 'Revisaste {n} palabras hoy', premio_siguiente: 'Próximo premio a las {n} palabras: {m} monedas', premio_ok: '¡Cobrar!', desliza_lados: 'Desliza → si lo sabes · ← para repasar',
    nov_nueva: '¡Nueva actualización!', nov_anteriores: 'Versiones anteriores', tut_k1: '¡Hola! Soy Kitty. Toca la tarjeta para ver la traducción.', tut_k2: '¿Ya la sabías? Desliza la tarjeta a la derecha. ¿Quieres repasarla? A la izquierda.', tut_k3: 'Cada tarjeta te da monedas. ¡Cada 10 palabras del día ganas un premio!', tut_k4: 'Si te pierdes, tócame y te ayudo con la palabra.', tut_siguiente: 'Siguiente', tut_listo: '¡Entendido!', tut_saltar: 'Saltar', tut_ver: 'Ver el tutorial con Kitty',
    aj_nombre: 'Tu nombre', aj_cuenta: 'Cuenta', aj_invitado: 'Sin cuenta (solo este navegador)', aj_google: 'Vincular cuenta de Google',
    aj_mejor_racha: 'Mejor racha', aj_kitty: 'Kitty (IA)', aj_kitty_texto: 'Conectar una IA externa llega en una próxima versión. Hoy Kitty busca en el diccionario.',
    aj_sugerencias: 'Sugerencias', aj_sug_texto: 'Ideas, reclamos o errores: cuéntanos.', aj_enviar: 'Enviar',
    aj_sug_ok: 'Gracias. Quedó guardada y se enviará cuando el buzón esté conectado.',
    aj_tutorial: 'Tutorial', aj_cosmeticos: 'Cosméticos', aj_cos_texto: 'Tienda de adornos para Kitty. Próximamente.',
    aj_apoyar: 'Apoyar', aj_apoyar_texto: 'Pronto podrás apoyar el proyecto.', aj_legal: 'Legal',
    legal_texto: 'Versión de prueba. Sin cuenta, tu avance queda solo en este navegador. Si entras con Google, tu avance se guarda también en la nube (Firebase) y en el ranking aparecen tu nombre y tus números, nunca tu correo. No usamos cookies de seguimiento ni publicidad. Textos completos (borrador, solo en español):',
    aj_borrar: 'Borrar mi progreso', aj_borrar_confirmar: '¿Seguro? Se borra todo tu avance de este navegador.',
    aj_guardado_auto: 'Tu progreso se guarda solo, en este navegador.', pronto: 'Próximamente', cerrar: 'Cerrar', abrir: 'Abrir',
    tut_1: 'Elige el idioma que quieres aprender.', tut_2: 'Elige un tema y su dificultad.',
    tut_3: 'Toca la tarjeta para ver la traducción y escucha la pronunciación.',
    tut_4: '¿La sabías? Toca «Lo sé». Si no, «Repasar»: volverá a salir. Desliza hacia arriba para seguir.',
    tut_5: 'El corazón (o tocar dos veces la tarjeta) guarda la palabra en Favoritos. Cada tarjeta suma Kitty tokens y tu racha crece cada día que estudias.',
    kitty_hola: '¡Miau! Soy Kitty. Escríbeme una palabra y te digo qué significa, o pídeme una «frase» para practicar.',
    kitty_placeholder: 'Escribe una palabra…', kitty_no: 'No encontré «{q}» en el diccionario todavía.',
    kitty_modo: 'Modo diccionario (sin IA conectada)', kitty_esta: 'Explícame esta tarjeta',
    kitty_frase: 'Prueba esta frase:', kitty_sin_frase: 'Estudia algunas frases primero y te propongo una.',
    kitty_abrir: 'Hablar con Kitty', kitty_tipo: 'Tipo', kitty_palabra_frase: 'frase',
  },
};

// 13 mega temas del banco (la clave es el nombre en español del banco).
const MEGA = {
  'Conversación y vida social': ['Conversation & social life', 'Conversa e vida social', 'Conversation et vie sociale', 'Conversazione e vita sociale', 'Gespräche & soziales Leben'],
  'Lenguaje, números y tiempo': ['Language, numbers & time', 'Linguagem, números e tempo', 'Langage, nombres et temps', 'Lingua, numeri e tempo', 'Sprache, Zahlen & Zeit'],
  'Personas y relaciones': ['People & relationships', 'Pessoas e relacionamentos', 'Personnes et relations', 'Persone e relazioni', 'Menschen & Beziehungen'],
  'Cuerpo, salud y emociones': ['Body, health & emotions', 'Corpo, saúde e emoções', 'Corps, santé et émotions', 'Corpo, salute ed emozioni', 'Körper, Gesundheit & Gefühle'],
  'Comida y bebida': ['Food & drink', 'Comida e bebida', 'Nourriture et boissons', 'Cibo e bevande', 'Essen & Trinken'],
  'Hogar y vida diaria': ['Home & daily life', 'Casa e dia a dia', 'Maison et vie quotidienne', 'Casa e vita quotidiana', 'Zuhause & Alltag'],
  'Ropa y compras': ['Clothes & shopping', 'Roupas e compras', 'Vêtements et shopping', 'Abbigliamento e shopping', 'Kleidung & Einkaufen'],
  'Lugares y viajes': ['Places & travel', 'Lugares e viagens', 'Lieux et voyages', 'Luoghi e viaggi', 'Orte & Reisen'],
  'Naturaleza y animales': ['Nature & animals', 'Natureza e animais', 'Nature et animaux', 'Natura e animali', 'Natur & Tiere'],
  'Trabajo, estudios y sociedad': ['Work, studies & society', 'Trabalho, estudos e sociedade', 'Travail, études et société', 'Lavoro, studio e società', 'Arbeit, Studium & Gesellschaft'],
  'Ocio, arte y tecnología': ['Leisure, art & technology', 'Lazer, arte e tecnologia', 'Loisirs, art et technologie', 'Tempo libero, arte e tecnologia', 'Freizeit, Kunst & Technik'],
  'Descripción y formas': ['Description & shapes', 'Descrição e formas', 'Description et formes', 'Descrizione e forme', 'Beschreibung & Formen'],
  'Acciones y mente': ['Actions & mind', 'Ações e mente', 'Actions et esprit', 'Azioni e mente', 'Handlungen & Denken'],
};

// Tipos gramaticales (clave = valor del banco en español).
const TIPOS = {
  sustantivo: ['noun', 'substantivo', 'nom', 'sostantivo', 'Nomen'],
  adjetivo: ['adjective', 'adjetivo', 'adjectif', 'aggettivo', 'Adjektiv'],
  frase: ['phrase', 'frase', 'phrase', 'frase', 'Satz'],
  verbo: ['verb', 'verbo', 'verbe', 'verbo', 'Verb'],
  adverbio: ['adverb', 'advérbio', 'adverbe', 'avverbio', 'Adverb'],
  'verbo frasal': ['phrasal verb', 'phrasal verb', 'verbe à particule', 'verbo frasale', 'Phrasal Verb'],
  'nombre propio': ['proper noun', 'nome próprio', 'nom propre', 'nome proprio', 'Eigenname'],
  pronombre: ['pronoun', 'pronome', 'pronom', 'pronome', 'Pronomen'],
  preposición: ['preposition', 'preposição', 'préposition', 'preposizione', 'Präposition'],
  numeral: ['numeral', 'numeral', 'numéral', 'numerale', 'Zahlwort'],
  determinante: ['determiner', 'determinante', 'déterminant', 'determinante', 'Artikelwort'],
  exclamación: ['exclamation', 'exclamação', 'exclamation', 'esclamazione', 'Ausruf'],
  locución: ['expression', 'locução', 'locution', 'locuzione', 'Wendung'],
  conjunción: ['conjunction', 'conjunção', 'conjonction', 'congiunzione', 'Konjunktion'],
  'marcador del discurso': ['discourse marker', 'marcador discursivo', 'marqueur du discours', 'segnale discorsivo', 'Diskursmarker'],
};

const ORDEN = ['en', 'pt', 'fr', 'it', 'de'];
let actual = 'es';

/** Descarga los textos de un idioma (una sola vez). Llamar antes de setIdiomaUI. */
export async function cargarIdiomaUI(code) {
  if (T[code] || !IDIOMAS_UI.includes(code)) return;
  try { T[code] = (await import(`./i18n-${code}.js`)).default; } catch { /* sin conexión: queda en español */ }
}
export const idiomaCargado = (code) => !!T[code];
export function setIdiomaUI(code) { actual = T[code] ? code : 'es'; }
export function idiomaUI() { return actual; }

export function t(key, vars = {}) {
  const s = T[actual]?.[key] ?? T.es[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}

/** Singular cuando n = 1 (usa la clave "<clave sin _n>_1" si existe). */
export function tn(key, n) {
  const uno = key.replace(/_n$/, '_1');
  return n === 1 && (T[actual]?.[uno] ?? T.es[uno]) ? t(uno) : t(key, { n });
}

function desdeTabla(tabla, valor) {
  if (actual === 'es') return valor;
  return tabla[valor]?.[ORDEN.indexOf(actual)] ?? valor;
}
export const tMega = (m) => desdeTabla(MEGA, m);
export const tTipo = (tipo) => desdeTabla(TIPOS, tipo);
export const MEGA_TEMAS = Object.keys(MEGA);

/** Nombre de un idioma escrito en el idioma de la interfaz (usa el navegador). */
export function nombreIdioma(code, enIdioma = actual) {
  try {
    const n = new Intl.DisplayNames([enIdioma], { type: 'language' }).of(code);
    return n ? n.charAt(0).toLocaleUpperCase(enIdioma) + n.slice(1) : code;
  } catch {
    return code.toUpperCase();
  }
}

/** Para pruebas: cada idioma debe tener todas las claves del español. */
export async function clavesFaltantes() {
  await Promise.all(IDIOMAS_UI.map(cargarIdiomaUI));
  const base = Object.keys(T.es);
  return Object.fromEntries(IDIOMAS_UI.map((l) => [l, base.filter((k) => !(k in T[l]))]));
}
