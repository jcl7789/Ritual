// src/locales/en.ts

export default {
  // Navigation
  navigation: {
    home: 'Home',
    history: 'History',
    profile: 'Profile',
    addEntry: 'New Entry',
    settings: 'Settings',
    statistics: 'Statistics',
  },

  // Home Screen
  home: {
    title: 'Ritual',
    subtitle: 'Your personal diary',
    stats: {
      total: 'Total',
      thisMonth: 'This month',
      average: 'Average',
    },
    addButton: 'New Entry',
    recent: 'Recent',
    empty: {
      title: 'No entries yet',
      subtitle: 'Start by logging your first activity',
    },
  },

  // Add Entry Form
  addEntry: {
    title: 'New Entry',
    activityType: 'What type of activity?',
    partner: 'Partner (optional)',
    partnerPlaceholder: 'Your partner\'s name',
    duration: 'Duration in minutes (optional)',
    durationPlaceholder: 'e.g: 30',
    satisfaction: 'How did you feel?',
    satisfactionLabel: '{{stars}} out of 5 stars',
    notes: 'Notes (optional)',
    notesPlaceholder: 'Any details you want to remember...',
    saveButton: 'Save Entry',
    errors: {
      activityRequired: 'Please select an activity type',
    },
    success: {
      title: 'Entry saved',
      message: 'Your new entry has been successfully recorded',
    },
  },

  // History
  history: {
    title: 'History',
    filters: {
      all: 'All',
      week: 'Week',
      month: 'Month',
    },
    delete: {
      title: 'Delete entry',
      message: 'Are you sure you want to delete this entry?',
      cancel: 'Cancel',
      confirm: 'Delete',
    },
    empty: {
      title: 'No entries',
      subtitle: 'You haven\'t logged any activities yet',
      subtitlePeriod: 'No entries for this {{period}}',
    },
    with: 'With {{partner}}',
    duration: '{{minutes}} min',
  },

  // Predefined activities
  activities: {
    'sexual-relation': 'Sexual intercourse',
    'intimacy': 'Intimacy',
    'masturbation': 'Masturbation',
    'oral-sex': 'Oral sex',
    'anal-sex': 'Anal sex',
    'foreplay': 'Foreplay',
    'other': 'Other',
  },

  // Dates
  dates: {
    today: 'Today',
    yesterday: 'Yesterday',
    periods: {
      week: 'period',
      month: 'month',
    },
  },

  // General buttons
  buttons: {
    ok: 'OK',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
  },

  // General errors
  errors: {
    general: 'An error occurred',
    networkError: 'Connection error',
    tryAgain: 'Try again',
  },
};