/**
 * Internationalization dictionary.
 *
 * Every user-facing string in Stack lives here, keyed, with `en` and `es`
 * values. Components never hardcode copy — they call `t("some_key")` from the
 * `useLanguage` hook. The Spanish is written to feel native to a Latin
 * American user, not machine-translated.
 *
 * Interpolation: use `{name}` style tokens and pass vars to `t`, e.g.
 *   t("home_group_streak", { n: 12 })
 */
export const translations = {
  en: {
    // Brand
    brand: "Stack",

    // Landing
    landing_tagline: "Show up. Every day.",
    landing_supporting:
      "Stack workouts in front of the crew who will notice the second you stop. No app to impress. Just people. No excuses.",
    landing_cta_signup: "Start stacking",
    landing_cta_login: "Log in",

    // Generic
    email_label: "Email",
    email_placeholder: "you@email.com",
    password_label: "Password",
    password_placeholder: "••••••••",
    loading: "Loading…",
    save: "Save",
    cancel: "Cancel",
    back: "Back",
    error_generic: "Something went wrong. Try again.",

    // Nav
    nav_home: "Home",
    nav_groups: "Groups",
    nav_checkin: "Check in",
    nav_activity: "Activity",
    nav_profile: "Profile",

    // Activity
    activity_title: "Your activity",
    activity_empty: "No posts yet. Your check-ins show up here.",
    activity_today: "Today",
    activity_week: "This week",
    activity_month: "This month",
    activity_count: "{n} check-ins",
    activity_empty_window: "Nothing in this window yet.",

    // Groups dashboard
    groups_title: "Your groups",
    groups_active_badge: "Active",
    groups_open: "Open",
    groups_set_active: "View group",
    groups_members_count: "{n} members",
    groups_leaderboard: "Leaderboard",
    groups_invite_label: "Invite link",
    groups_you_tag: "you",
    groups_new: "New group",
    groups_leave: "Leave",
    groups_delete: "Delete",
    groups_leave_confirm: "Leave this group?",
    groups_delete_confirm: "Delete for everyone?",
    groups_confirm_yes: "Yes",
    groups_week_checkins: "{n} this week",
    groups_at_risk: "You're at risk today",
    groups_safe_today: "You showed up today",
    // Group detail
    gd_group_stats: "Group",
    gd_breakdown: "Members",
    gd_collective_streak: "Collective streak",
    gd_total_checkins: "Total check-ins",
    gd_consistency: "Consistency this week",
    gd_most_consistent: "Most consistent",
    gd_all_time: "All-time",
    gd_open_home: "Open in Home",
    gd_nobody_yet: "No check-ins in this window yet.",
    // Nudge
    nudge_cta: "Nudge",
    nudge_sent: "Nudged",
    nudge_banner: "{who} nudged you 👀 Your group is waiting.",
    // Weekly recap
    recap_title: "This week",
    recap_subtitle: "How the group is showing up",
    recap_checkins: "Check-ins",
    recap_perfect: "Perfect week",
    // Group chat
    chat_title: "Chat",
    chat_placeholder: "Message your group…",
    chat_send: "Send",
    chat_empty: "No messages yet. Say something.",
    milestone_title: "{n}-day streak",
    milestone_sub: "You're on fire. Keep it alive.",

    // Sign up
    signup_title: "Start stacking",
    signup_subtitle: "Create your account. It takes a second.",
    signup_submit: "Start stacking",
    signup_have_account: "Already have an account?",
    signup_login_link: "Log in",
    error_email_taken: "That email is already in use.",
    error_weak_password: "Password must be at least 6 characters.",
    signup_check_email:
      "Account created. Check your email to confirm, then log in.",
    verify_email_title: "Check your email",
    verify_email_body:
      "We sent a confirmation link to {email}. Tap it to activate your account and finish setting up.",
    verify_email_hint: "Don't see it? Check your spam folder.",
    verify_email_login: "Back to log in",
    error_confirm_failed:
      "We couldn't confirm that link. Try logging in, or sign up again.",

    // Log in
    login_title: "Welcome back",
    login_subtitle: "Pick up where your streak left off.",
    login_submit: "Log in",
    login_no_account: "New here?",
    login_signup_link: "Create an account",
    error_invalid_credentials: "Wrong email or password.",

    // Onboarding
    onboarding_title: "Claim your name",
    onboarding_subtitle: "This is how your crew sees you. Choose well.",
    username_label: "Username",
    username_placeholder: "nico",
    display_name_label: "Display name (optional)",
    display_name_placeholder: "Nico Z.",
    onboarding_submit: "Enter Stack",
    error_username_taken: "That username is taken.",
    error_username_invalid:
      "Use 3–20 letters, numbers or underscores.",

    // Multi-step onboarding
    ob_step: "Step {n} of {total}",
    ob_continue: "Continue",
    ob_finish: "Enter Stack",
    ob_required: "This field is required.",
    ob_username_title: "Claim your name",
    ob_username_sub: "This is how your crew sees you. Choose well.",
    ob_avatar_title: "Put a face to it",
    ob_avatar_sub: "Add a profile photo so your group knows it's you.",
    ob_avatar_choose: "Choose photo",
    ob_avatar_required: "A profile picture is required.",
    ob_name_title: "Your name",
    ob_name_sub: "What should we call you?",
    ob_sport_title: "Your sport",
    ob_sport_sub: "What do you train most?",
    ob_routine_title: "Your routine",
    ob_routine_sub: "What do you usually do?",
    ob_focus_title: "This month's focus",
    ob_focus_sub: "What are you chasing right now?",
    ob_bio_title: "One line about you",
    ob_bio_sub: "Optional — make it count.",

    // Welcome story (first-run, after signup, before profile setup)
    welcome_skip: "Skip",
    welcome_continue: "Continue",
    ws2_title: "Getting in shape alone is hard. With your people, it sticks.",
    ws2_sub:
      "Stack isn't another solo tracker. It's a small circle that holds each other accountable — showing up becomes unavoidable when it's in front of the people who matter to you.",
    ws3_title: "We're building the place small crews get strong together.",
    ws3_sub:
      "A private, no-excuses space for you and your friends, your brothers, your training partners, your coach and their clients. Real accountability, not a public highlight reel.",
    ws4_title: "Take the photo. Build the streak. Don't break the chain.",
    ws4_sub:
      "Every workout is a check-in. Your group sees it. Your streak grows. Miss a day and everyone knows. That gentle pressure is the whole point.",
    ws5_title: "Let's set you up.",
    ws5_sub: "It takes a minute, then you're in.",
    ws5_cta: "Let's go",

    // Feature tour (first-run on Home)
    tour_next: "Next",
    tour_skip: "Skip tour",
    tour_finish: "Take your first photo",
    tour_replay: "Take the tour again",
    tour1_title: "Welcome to Home",
    tour1_body: "Your group, your streak, your feed — all in one place.",
    tour2_title: "Check in",
    tour2_body:
      "Tap here after any workout, take a photo, and it posts to your group. This is the one thing you do every day.",
    tour3_title: "Your consistency",
    tour3_body:
      "This ring shows how many of your days you've hit this week. Fill it up.",
    tour4_title: "Your streaks",
    tour4_body:
      "Your day streak is consecutive days you showed up. The group streak only survives if everyone shows up — one miss breaks it for all of you.",
    tour5_title: "The feed",
    tour5_body:
      "When anyone checks in, it shows up here. React, comment, cheer them on.",
    tour6_title: "At-risk & nudges",
    tour6_body:
      "Inside a group, a red dot means someone hasn't checked in today. Tap Nudge to give them a friendly push.",
    tour7_title: "Groups",
    tour7_body:
      "Create or join groups here. Tap any group for its stats, members, chat, and weekly recap.",
    tour8_title: "Profile & The Stack",
    tour8_body:
      "Your profile shows your streaks, your totals, and The Stack — your full check-in history. Tap anyone's name to see theirs.",
    tour9_title: "You're ready",
    tour9_body: "That's it. Take your first photo and start your streak today.",

    // Home — empty state
    home_no_group_title: "No crew yet",
    home_no_group_subtitle:
      "Stack works with people. Start a group or join one with an invite link.",
    home_create_group: "Create a group",
    home_join_group: "Join a group",
    join_code_placeholder: "Invite code or link",
    join_code_submit: "Join",
    join_code_invalid: "Enter a valid invite code or link.",

    // Home — streak + feed
    streak_label: "day streak",
    streak_broken: "Streak broken",
    streak_at_risk: "You haven't shown up today",
    streak_safe: "You showed up today",
    group_streak_label: "group streak",
    checkin_button: "Check in",
    checkin_done: "You showed up today",
    rest_day_cta: "Mark today a rest day",
    rest_day_done: "Rest day — streak protected 😌",
    feed_empty: "No check-ins yet today. Be the one who starts.",
    feed_title: "Today's feed",
    feed_comment_placeholder: "Add a comment…",
    feed_comment_send: "Post",
    feed_comment_delete: "Delete",
    group_switcher_label: "Your groups",
    home_consistency: "consistency this week",
    leaderboard_days: "{n} of last 7 days",
    action_failed: "Couldn't do that. Please try again.",

    // Create group
    creategroup_title: "Create a group",
    creategroup_subtitle: "Small and serious. 2 to 8 people.",
    group_name_label: "Group name",
    group_name_placeholder: "Dawn patrol",
    goal_label: "Goal (optional)",
    goal_placeholder: "Wedding prep, November 27",
    creategroup_submit: "Create group",
    invite_title: "Your group is live",
    invite_subtitle: "Send this link to your crew. This is how they get in.",
    invite_link_label: "Invite link",
    invite_code_label: "Or share the code",
    copy: "Copy",
    copied: "Copied",
    invite_go_home: "Go to my group",

    // Join group
    join_title: "You've been invited",
    join_subtitle: "Join the group and start stacking with them.",
    join_button: "Join this group",
    join_invalid_code: "This invite link is invalid or expired.",
    join_login_required: "Log in or sign up to join.",
    join_already_member: "You're already in this group.",
    join_go_home: "Go to the group",

    // Check in
    checkin_title: "Prove it",
    checkin_subtitle: "Take the shot here, now. That's the proof.",
    checkin_capture: "Capture",
    checkin_retake: "Retake",
    checkin_flip: "Flip camera",
    checkin_note_placeholder: "How did it go? (optional)",
    checkin_submit: "Stack it",
    checkin_starting_camera: "Starting camera…",
    checkin_uploading: "Stacking…",
    checkin_permission_denied: "Camera access denied",
    checkin_permission_help:
      "Stack needs your camera to capture proof in the moment. Enable it in your browser settings and reload.",
    checkin_no_group:
      "Join or create a group before you check in.",

    // Check-in detail screen
    cd_groups: "Post to",
    cd_sport: "Sport",
    cd_environment: "Environment",
    cd_goal: "Focus",
    cd_notes: "Notes",
    cd_search_sport: "Search sport…",
    cd_other_placeholder: "Type your own…",
    cd_notes_placeholder: "Played midfielder today, scored twice.",
    cd_share: "Save / share",
    cd_select_all: "Select all",
    cd_clear_all: "Clear",
    cd_take_photo: "Take photo",
    cd_photo_hint: "Opens your camera — full quality, framed for stories.",
    cd_err_photo: "Add a photo to continue.",
    cd_step_details: "Details",
    cd_step_photo: "Photo",
    cd_step_review: "Review",
    cd_order_details_first: "Details first",
    cd_order_photo_first: "Photo first",
    cd_next: "Next",
    cd_err_groups: "Select at least one group.",
    cd_err_sport: "Choose a sport.",
    cd_err_environment: "Choose indoor or outdoor.",
    cd_err_goal: "Choose a focus.",
    cd_err_other: "Add a name.",
    env_indoor: "Indoor",
    env_outdoor: "Outdoor",

    // Profile
    profile_title: "Profile",
    profile_current_streak: "Current streak",
    profile_longest_streak: "Longest streak",
    profile_total_checkins: "Total check-ins",
    profile_heatmap_title: "The stack",
    profile_heatmap_subtitle: "Every day you showed up.",
    heatmap_less: "Less",
    heatmap_more: "More",
    heatmap_checked: "Checked in",
    heatmap_missed: "Missed",
    heatmap_rest: "Rest day",
    profile_logout: "Log out",
    days_unit: "days",
    profile_edit: "Edit profile",
    profile_edit_title: "Edit profile",
    profile_bio_label: "Bio",
    profile_bio_placeholder: "A line about you and your training.",
    profile_favorite_sport_label: "Favorite sport",
    profile_favorite_sport_placeholder: "Running, lifting, climbing…",
    profile_usual_activity_label: "What you usually do",
    profile_usual_activity_placeholder: "Early morning runs, gym 5x a week…",
    profile_focus_sport_label: "Focus this month",
    profile_focus_sport_placeholder: "What you've trained most this past month",
    profile_avatar_label: "Profile picture",
    profile_avatar_change: "Change photo",
    cropper_title: "Frame your photo",
    cropper_use: "Use photo",
    cropper_zoom: "Zoom",
    profile_save: "Save profile",
    profile_saved: "Saved",
    profile_about: "About",

    // Member profile
    u_recent: "Recent",
    u_no_posts: "No check-ins yet.",
    u_shared_groups: "Shared groups",
    stats_hidden: "Stats hidden",

    // Privacy
    privacy_label: "Privacy",
    privacy_show_stats: "Show my stats to group members",
    privacy_explainer:
      "When off, your current streak, longest streak and total check-ins are hidden from others on your profile and the leaderboard. Your name, photo, and whether you checked in today stay visible — your group can always see if you showed up.",

    // Install / Add to Home Screen guide
    install_cta: "Install as an app",
    install_title: "Add Stack to your iPhone",
    install_subtitle:
      "Turn Stack into an app on your Home Screen — no App Store needed. It opens full-screen, just like a real app.",
    install_beta_note:
      "Stack is in early beta, so this is the best way to use it every day.",
    install_safari_title: "Open this in Safari first",
    install_safari_body:
      "This only works in Safari on iPhone. If you're in another browser or app, open {url} in Safari, then come back here.",
    install_not_safari:
      "You don't seem to be in Safari. Copy the link below, open Safari, and paste it there.",
    install_copy_link: "Copy link",
    install_link_copied: "Link copied",
    install_step1_title: "Open Stack in Safari",
    install_step1_body:
      "In Safari on your iPhone, go to {url}. The address bar sits at the bottom of the screen.",
    install_step2_title: "Tap the Share button",
    install_step2_body:
      "It's the square with an arrow pointing up, in the bar at the bottom.",
    install_step3_title: "Tap “Add to Home Screen”",
    install_step3_body:
      "Scroll down the menu until you see it — next to a box with a + inside. Tap it.",
    install_step4_title: "Tap “Add”",
    install_step4_body:
      "You'll see the Stack icon and name. Tap Add in the top-right corner.",
    install_step5_title: "Done — open Stack from your Home Screen",
    install_step5_body:
      "The Stack icon is now on your Home Screen. Tap it to open Stack full-screen, like an app.",
    install_step_label: "Step {n}",
    install_done: "Back to Stack",

    // Time (relative)
    time_now: "just now",

    // Accessibility
    a11y_language: "Language",
    a11y_switch_group: "Switch group",
  },

  es: {
    // Brand
    brand: "Stack",

    // Landing
    landing_tagline: "Preséntate. Todos los días.",
    landing_supporting:
      "Suma entrenamientos frente a la gente que se va a dar cuenta en el momento en que pares. No es para impresionar a una app. Es por ellos. Sin excusas.",
    landing_cta_signup: "Empieza a sumar",
    landing_cta_login: "Iniciar sesión",

    // Generic
    email_label: "Correo",
    email_placeholder: "tu@correo.com",
    password_label: "Contraseña",
    password_placeholder: "••••••••",
    loading: "Cargando…",
    save: "Guardar",
    cancel: "Cancelar",
    back: "Atrás",
    error_generic: "Algo salió mal. Inténtalo de nuevo.",

    // Nav
    nav_home: "Inicio",
    nav_groups: "Grupos",
    nav_checkin: "Registrar",
    nav_activity: "Actividad",
    nav_profile: "Perfil",

    // Activity
    activity_title: "Tu actividad",
    activity_empty: "Aún no hay publicaciones. Tus registros aparecen aquí.",
    activity_today: "Hoy",
    activity_week: "Esta semana",
    activity_month: "Este mes",
    activity_count: "{n} registros",
    activity_empty_window: "Nada en este periodo todavía.",

    // Groups dashboard
    groups_title: "Tus grupos",
    groups_active_badge: "Activo",
    groups_open: "Abrir",
    groups_set_active: "Ver grupo",
    groups_members_count: "{n} integrantes",
    groups_leaderboard: "Tabla de posiciones",
    groups_invite_label: "Enlace de invitación",
    groups_you_tag: "tú",
    groups_new: "Nuevo grupo",
    groups_leave: "Salir",
    groups_delete: "Eliminar",
    groups_leave_confirm: "¿Salir de este grupo?",
    groups_delete_confirm: "¿Eliminar para todos?",
    groups_confirm_yes: "Sí",
    groups_week_checkins: "{n} esta semana",
    groups_at_risk: "Hoy estás en riesgo",
    groups_safe_today: "Hoy te presentaste",
    // Group detail
    gd_group_stats: "Grupo",
    gd_breakdown: "Integrantes",
    gd_collective_streak: "Racha colectiva",
    gd_total_checkins: "Registros totales",
    gd_consistency: "Constancia esta semana",
    gd_most_consistent: "Más constante",
    gd_all_time: "Histórico",
    gd_open_home: "Abrir en Inicio",
    gd_nobody_yet: "Aún no hay registros en este periodo.",
    // Nudge
    nudge_cta: "Empújalo",
    nudge_sent: "Enviado",
    nudge_banner: "{who} te dio un empujón 👀 Tu grupo te está esperando.",
    // Weekly recap
    recap_title: "Esta semana",
    recap_subtitle: "Cómo se está presentando el grupo",
    recap_checkins: "Registros",
    recap_perfect: "Semana perfecta",
    // Group chat
    chat_title: "Chat",
    chat_placeholder: "Escríbele a tu grupo…",
    chat_send: "Enviar",
    chat_empty: "Aún no hay mensajes. Di algo.",
    milestone_title: "racha de {n} días",
    milestone_sub: "Estás encendido. Mantenla viva.",

    // Sign up
    signup_title: "Empieza a sumar",
    signup_subtitle: "Crea tu cuenta. Toma un segundo.",
    signup_submit: "Empieza a sumar",
    signup_have_account: "¿Ya tienes cuenta?",
    signup_login_link: "Inicia sesión",
    error_email_taken: "Ese correo ya está en uso.",
    error_weak_password: "La contraseña debe tener al menos 6 caracteres.",
    signup_check_email:
      "Cuenta creada. Revisa tu correo para confirmar y luego inicia sesión.",
    verify_email_title: "Revisa tu correo",
    verify_email_body:
      "Te enviamos un enlace de confirmación a {email}. Tócalo para activar tu cuenta y terminar de configurarla.",
    verify_email_hint: "¿No lo ves? Revisa tu carpeta de spam.",
    verify_email_login: "Volver a iniciar sesión",
    error_confirm_failed:
      "No pudimos confirmar ese enlace. Inicia sesión o regístrate de nuevo.",

    // Log in
    login_title: "Qué bueno verte",
    login_subtitle: "Retoma tu racha donde la dejaste.",
    login_submit: "Iniciar sesión",
    login_no_account: "¿Primera vez?",
    login_signup_link: "Crea una cuenta",
    error_invalid_credentials: "Correo o contraseña incorrectos.",

    // Onboarding
    onboarding_title: "Elige tu nombre",
    onboarding_subtitle: "Así te ve tu grupo. Elígelo bien.",
    username_label: "Usuario",
    username_placeholder: "nico",
    display_name_label: "Nombre visible (opcional)",
    display_name_placeholder: "Nico Z.",
    onboarding_submit: "Entrar a Stack",
    error_username_taken: "Ese usuario ya existe.",
    error_username_invalid:
      "Usa 3 a 20 letras, números o guiones bajos.",

    // Multi-step onboarding
    ob_step: "Paso {n} de {total}",
    ob_continue: "Continuar",
    ob_finish: "Entrar a Stack",
    ob_required: "Este campo es obligatorio.",
    ob_username_title: "Elige tu nombre",
    ob_username_sub: "Así te ve tu grupo. Elígelo bien.",
    ob_avatar_title: "Ponle cara",
    ob_avatar_sub: "Agrega una foto para que tu grupo sepa que eres tú.",
    ob_avatar_choose: "Elegir foto",
    ob_avatar_required: "La foto de perfil es obligatoria.",
    ob_name_title: "Tu nombre",
    ob_name_sub: "¿Cómo te llamamos?",
    ob_sport_title: "Tu deporte",
    ob_sport_sub: "¿Qué entrenas más?",
    ob_routine_title: "Tu rutina",
    ob_routine_sub: "¿Qué sueles hacer normalmente?",
    ob_focus_title: "Tu enfoque este mes",
    ob_focus_sub: "¿Qué estás persiguiendo ahora?",
    ob_bio_title: "Una línea sobre ti",
    ob_bio_sub: "Opcional — que valga la pena.",

    // Welcome story (primera vez, tras registrarse, antes de configurar el perfil)
    welcome_skip: "Saltar",
    welcome_continue: "Continuar",
    ws2_title: "Ponerte en forma solo es difícil. Con tu gente, se vuelve constante.",
    ws2_sub:
      "Stack no es otro tracker para uno solo. Es un círculo pequeño que se hace responsable en grupo — presentarte se vuelve inevitable cuando está frente a la gente que te importa.",
    ws3_title:
      "Estamos construyendo el lugar donde los grupos pequeños se ponen fuertes juntos.",
    ws3_sub:
      "Un espacio privado y sin excusas para ti y tus amigos, tus hermanos, tus compañeros de entrenamiento, tu coach y sus clientes. Responsabilidad real, no una vitrina pública.",
    ws4_title: "Toma la foto. Construye la racha. No rompas la cadena.",
    ws4_sub:
      "Cada entrenamiento es un registro. Tu grupo lo ve. Tu racha crece. Si faltas un día, todos se enteran. Esa presión amable es justo el punto.",
    ws5_title: "Vamos a configurarte.",
    ws5_sub: "Toma un minuto y ya estás dentro.",
    ws5_cta: "Vamos",

    // Feature tour (primera vez en Inicio)
    tour_next: "Siguiente",
    tour_skip: "Saltar tour",
    tour_finish: "Toma tu primera foto",
    tour_replay: "Ver el tour de nuevo",
    tour1_title: "Bienvenido a tu inicio",
    tour1_body: "Tu grupo, tu racha y tu feed — todo en un solo lugar.",
    tour2_title: "Registra",
    tour2_body:
      "Toca aquí después de entrenar, toma una foto y se publica en tu grupo. Esto es lo único que haces cada día.",
    tour3_title: "Tu constancia",
    tour3_body:
      "Este anillo muestra cuántos de tus días cumpliste esta semana. Llénalo.",
    tour4_title: "Tus rachas",
    tour4_body:
      "Tu racha son los días seguidos que te presentaste. La racha del grupo solo sobrevive si todos se presentan — una falta la rompe para todos.",
    tour5_title: "El feed",
    tour5_body:
      "Cuando alguien registra, aparece aquí. Reacciona, comenta y anímalos.",
    tour6_title: "En riesgo y empujones",
    tour6_body:
      "Dentro de un grupo, un punto rojo significa que alguien no se ha registrado hoy. Toca Empújalo para darle un empujón amable.",
    tour7_title: "Grupos",
    tour7_body:
      "Crea o únete a grupos aquí. Toca cualquier grupo para ver sus estadísticas, miembros, chat y resumen semanal.",
    tour8_title: "Perfil y La Pila",
    tour8_body:
      "Tu perfil muestra tus rachas, tus totales y La Pila — tu historial completo de registros. Toca el nombre de cualquiera para ver el suyo.",
    tour9_title: "Estás listo",
    tour9_body: "Eso es todo. Toma tu primera foto y empieza tu racha hoy.",

    // Home — empty state
    home_no_group_title: "Todavía no tienes grupo",
    home_no_group_subtitle:
      "Stack funciona con gente. Crea un grupo o únete con un enlace de invitación.",
    home_create_group: "Crear un grupo",
    home_join_group: "Unirme a un grupo",
    join_code_placeholder: "Código o enlace de invitación",
    join_code_submit: "Unirme",
    join_code_invalid: "Ingresa un código o enlace de invitación válido.",

    // Home — streak + feed
    streak_label: "días seguidos",
    streak_broken: "Racha rota",
    streak_at_risk: "Hoy todavía no te presentas",
    streak_safe: "Hoy te presentaste",
    group_streak_label: "racha del grupo",
    checkin_button: "Registrar",
    checkin_done: "Hoy te presentaste",
    rest_day_cta: "Marcar hoy como día de descanso",
    rest_day_done: "Día de descanso — racha protegida 😌",
    feed_empty: "Nadie ha registrado hoy. Sé quien empieza.",
    feed_title: "Hoy en el grupo",
    feed_comment_placeholder: "Agrega un comentario…",
    feed_comment_send: "Publicar",
    feed_comment_delete: "Eliminar",
    group_switcher_label: "Tus grupos",
    home_consistency: "constancia esta semana",
    leaderboard_days: "{n} de los últimos 7 días",
    action_failed: "No se pudo. Inténtalo de nuevo.",

    // Create group
    creategroup_title: "Crear un grupo",
    creategroup_subtitle: "Pequeño y en serio. De 2 a 8 personas.",
    group_name_label: "Nombre del grupo",
    group_name_placeholder: "Escuadra del amanecer",
    goal_label: "Meta (opcional)",
    goal_placeholder: "Para la boda, 27 de noviembre",
    creategroup_submit: "Crear grupo",
    invite_title: "Tu grupo está listo",
    invite_subtitle:
      "Manda este enlace a tu gente. Así es como entran.",
    invite_link_label: "Enlace de invitación",
    invite_code_label: "O comparte el código",
    copy: "Copiar",
    copied: "Copiado",
    invite_go_home: "Ir a mi grupo",

    // Join group
    join_title: "Te invitaron",
    join_subtitle: "Únete al grupo y empieza a sumar con ellos.",
    join_button: "Unirme a este grupo",
    join_invalid_code: "Este enlace de invitación no es válido o expiró.",
    join_login_required: "Inicia sesión o regístrate para unirte.",
    join_already_member: "Ya estás en este grupo.",
    join_go_home: "Ir al grupo",

    // Check in
    checkin_title: "Demuéstralo",
    checkin_subtitle: "Toma la foto aquí, ahora. Esa es la prueba.",
    checkin_capture: "Capturar",
    checkin_retake: "Repetir",
    checkin_flip: "Cambiar cámara",
    checkin_note_placeholder: "¿Cómo te fue? (opcional)",
    checkin_submit: "Sumar",
    checkin_starting_camera: "Encendiendo la cámara…",
    checkin_uploading: "Sumando…",
    checkin_permission_denied: "Acceso a la cámara denegado",
    checkin_permission_help:
      "Stack necesita tu cámara para capturar la prueba en el momento. Actívala en los ajustes de tu navegador y recarga.",
    checkin_no_group:
      "Únete o crea un grupo antes de registrar.",

    // Check-in detail screen
    cd_groups: "Publicar en",
    cd_sport: "Deporte",
    cd_environment: "Entorno",
    cd_goal: "Enfoque",
    cd_notes: "Notas",
    cd_search_sport: "Buscar deporte…",
    cd_other_placeholder: "Escribe el tuyo…",
    cd_notes_placeholder: "Jugué de mediocampista hoy, metí dos goles.",
    cd_share: "Guardar / compartir",
    cd_select_all: "Seleccionar todos",
    cd_clear_all: "Quitar",
    cd_take_photo: "Toma la foto",
    cd_photo_hint: "Abre tu cámara — máxima calidad, formato historia.",
    cd_err_photo: "Agrega una foto para continuar.",
    cd_step_details: "Detalles",
    cd_step_photo: "Foto",
    cd_step_review: "Revisar",
    cd_order_details_first: "Detalles primero",
    cd_order_photo_first: "Foto primero",
    cd_next: "Siguiente",
    cd_err_groups: "Selecciona al menos un grupo.",
    cd_err_sport: "Elige un deporte.",
    cd_err_environment: "Elige interior o exterior.",
    cd_err_goal: "Elige un enfoque.",
    cd_err_other: "Escribe un nombre.",
    env_indoor: "Interior",
    env_outdoor: "Exterior",

    // Profile
    profile_title: "Perfil",
    profile_current_streak: "Racha actual",
    profile_longest_streak: "Racha más larga",
    profile_total_checkins: "Registros totales",
    profile_heatmap_title: "La pila",
    profile_heatmap_subtitle: "Cada día que te presentaste.",
    heatmap_less: "Menos",
    heatmap_more: "Más",
    heatmap_checked: "Te presentaste",
    heatmap_missed: "Faltaste",
    heatmap_rest: "Día de descanso",
    profile_logout: "Cerrar sesión",
    days_unit: "días",
    profile_edit: "Editar perfil",
    profile_edit_title: "Editar perfil",
    profile_bio_label: "Biografía",
    profile_bio_placeholder: "Una línea sobre ti y tu entrenamiento.",
    profile_favorite_sport_label: "Deporte favorito",
    profile_favorite_sport_placeholder: "Correr, pesas, escalar…",
    profile_usual_activity_label: "Lo que sueles hacer",
    profile_usual_activity_placeholder: "Correr temprano, gimnasio 5x por semana…",
    profile_focus_sport_label: "Enfoque este mes",
    profile_focus_sport_placeholder: "Lo que más entrenaste este último mes",
    profile_avatar_label: "Foto de perfil",
    profile_avatar_change: "Cambiar foto",
    cropper_title: "Encuadra tu foto",
    cropper_use: "Usar foto",
    cropper_zoom: "Acercar",
    profile_save: "Guardar perfil",
    profile_saved: "Guardado",
    profile_about: "Sobre ti",

    // Member profile
    u_recent: "Recientes",
    u_no_posts: "Aún no hay registros.",
    u_shared_groups: "Grupos en común",
    stats_hidden: "Estadísticas ocultas",

    // Privacy
    privacy_label: "Privacidad",
    privacy_show_stats: "Mostrar mis estadísticas a los miembros del grupo",
    privacy_explainer:
      "Cuando está apagado, tu racha actual, tu racha más larga y tus registros totales se ocultan para los demás en tu perfil y en la tabla de posiciones. Tu nombre, tu foto y si te presentaste hoy siguen visibles — tu grupo siempre puede ver si apareciste.",

    // Install / Add to Home Screen guide
    install_cta: "Instalar como app",
    install_title: "Agrega Stack a tu iPhone",
    install_subtitle:
      "Convierte Stack en una app en tu pantalla de inicio — sin App Store. Se abre en pantalla completa, como una app de verdad.",
    install_beta_note:
      "Stack está en beta temprana, así que esta es la mejor forma de usarlo todos los días.",
    install_safari_title: "Primero abre esto en Safari",
    install_safari_body:
      "Esto solo funciona en Safari en iPhone. Si estás en otro navegador o app, abre {url} en Safari y vuelve aquí.",
    install_not_safari:
      "Parece que no estás en Safari. Copia el enlace de abajo, abre Safari y pégalo ahí.",
    install_copy_link: "Copiar enlace",
    install_link_copied: "Enlace copiado",
    install_step1_title: "Abre Stack en Safari",
    install_step1_body:
      "En Safari en tu iPhone, entra a {url}. La barra de direcciones está abajo en la pantalla.",
    install_step2_title: "Toca el botón Compartir",
    install_step2_body:
      "Es el cuadrado con una flecha hacia arriba, en la barra de abajo.",
    install_step3_title: "Toca “Agregar a inicio”",
    install_step3_body:
      "Desliza el menú hacia abajo hasta verlo — junto a un cuadro con un + adentro. Tócalo.",
    install_step4_title: "Toca “Agregar”",
    install_step4_body:
      "Verás el ícono y el nombre de Stack. Toca Agregar en la esquina superior derecha.",
    install_step5_title: "¡Listo! Abre Stack desde tu pantalla de inicio",
    install_step5_body:
      "El ícono de Stack ya está en tu pantalla de inicio. Tócalo para abrir Stack en pantalla completa, como una app.",
    install_step_label: "Paso {n}",
    install_done: "Volver a Stack",

    // Time (relative)
    time_now: "ahora",

    // Accessibility
    a11y_language: "Idioma",
    a11y_switch_group: "Cambiar de grupo",
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof (typeof translations)["en"];

/**
 * Resolve a key for a language and interpolate `{var}` tokens. Falls back to
 * English if a key is somehow missing in the target language.
 */
export function translate(
  lang: Language,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  const dict = translations[lang] ?? translations.en;
  let value: string = dict[key] ?? translations.en[key] ?? String(key);
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return value;
}
