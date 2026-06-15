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
    feed_empty: "No check-ins yet today. Be the one who starts.",
    feed_title: "Today's feed",
    group_switcher_label: "Your groups",

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

    // Profile
    profile_title: "Profile",
    profile_current_streak: "Current streak",
    profile_longest_streak: "Longest streak",
    profile_total_checkins: "Total check-ins",
    profile_heatmap_title: "The stack",
    profile_heatmap_subtitle: "Every day you showed up.",
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
    profile_save: "Save profile",
    profile_saved: "Saved",
    profile_about: "About",

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
    feed_empty: "Nadie ha registrado hoy. Sé quien empieza.",
    feed_title: "Hoy en el grupo",
    group_switcher_label: "Tus grupos",

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

    // Profile
    profile_title: "Perfil",
    profile_current_streak: "Racha actual",
    profile_longest_streak: "Racha más larga",
    profile_total_checkins: "Registros totales",
    profile_heatmap_title: "La pila",
    profile_heatmap_subtitle: "Cada día que te presentaste.",
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
    profile_save: "Guardar perfil",
    profile_saved: "Guardado",
    profile_about: "Sobre ti",

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
