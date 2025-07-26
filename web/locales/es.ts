// src/locales/es.ts

export default {
  // Navegación
  navigation: {
    home: 'Inicio',
    history: 'Historial',
    profile: 'Perfil',
    addEntry: 'Nueva Entrada',
    settings: 'Configuración',
    statistics: 'Estadísticas',
  },

  // Pantalla Home
  home: {
    title: 'Ritual',
    subtitle: 'Tu diario personal',
    stats: {
      total: 'Total',
      thisMonth: 'Este mes',
      average: 'Promedio',
    },
    addButton: 'Nueva Entrada',
    recent: 'Recientes',
    empty: {
      title: 'Aún no tienes entradas',
      subtitle: 'Comienza registrando tu primera actividad',
    },
  },

  // Formulario de nueva entrada
  addEntry: {
    title: 'Nueva Entrada',
    activityType: '¿Qué tipo de actividad?',
    partner: 'Pareja (opcional)',
    partnerPlaceholder: 'Nombre de tu pareja',
    duration: 'Duración en minutos (opcional)',
    durationPlaceholder: 'Ej: 30',
    satisfaction: '¿Cómo te sentiste?',
    satisfactionLabel: '{{stars}} de 5 estrellas',
    notes: 'Notas (opcional)',
    notesPlaceholder: 'Cualquier detalle que quieras recordar...',
    saveButton: 'Guardar Entrada',
    errors: {
      activityRequired: 'Por favor selecciona un tipo de actividad',
    },
    success: {
      title: 'Entrada guardada',
      message: 'Tu nueva entrada ha sido registrada exitosamente',
    },
  },

  // Historial
  history: {
    title: 'Historial',
    filters: {
      all: 'Todo',
      week: 'Semana',
      month: 'Mes',
    },
    delete: {
      title: 'Eliminar entrada',
      message: '¿Estás seguro de que quieres eliminar esta entrada?',
      cancel: 'Cancelar',
      confirm: 'Eliminar',
    },
    empty: {
      title: 'No hay entradas',
      subtitle: 'Aún no has registrado ninguna actividad',
      subtitlePeriod: 'No hay entradas para este {{period}}',
    },
    with: 'Con {{partner}}',
    duration: '{{minutes}} min',
  },

  // Actividades predefinidas
  activities: {
    'sexual-relation': 'Relación sexual',
    'intimacy': 'Intimidad',
    'masturbation': 'Masturbación',
    'oral-sex': 'Sexo oral',
    'anal-sex': 'Sexo anal',
    'foreplay': 'Juegos previos',
    'other': 'Otro',
  },

  // Fechas
  dates: {
    today: 'Hoy',
    yesterday: 'Ayer',
    periods: {
      week: 'período',
      month: 'mes',
    },
  },

  // Botones generales
  buttons: {
    ok: 'OK',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    back: 'Atrás',
  },

  // Errores generales
  errors: {
    general: 'Ha ocurrido un error',
    networkError: 'Error de conexión',
    tryAgain: 'Intentar de nuevo',
  },
};