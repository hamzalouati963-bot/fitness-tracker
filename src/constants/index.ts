/**
 * Application-wide constants for UI, calculations, and defaults
 * Centralized place for all "magic numbers" to ensure consistency
 */

// ============ NUTRITION ============
export const DEFAULT_CALORIE_GOAL = 2200;
export const DEFAULT_PROTEIN_GOAL_G = 150;
export const DEFAULT_CARBS_GOAL_G = 250;
export const DEFAULT_FAT_GOAL_G = 70;

// ============ HYDRATION ============
export const DEFAULT_HYDRATION_GOAL_ML = 2500;
export const QUICK_ADD_HYDRATION_ML_250 = 250;
export const QUICK_ADD_HYDRATION_ML_500 = 500;
export const QUICK_ADD_HYDRATION_ML_750 = 750;

// ============ MEASUREMENTS ============
export const MIN_REST_DAYS_BETWEEN_MEASUREMENTS = 2; // Days
export const MEASUREMENT_DISPLAY_PRECISION = 1; // Decimal places

// ============ WORKOUT ============
export const DEFAULT_REST_TIMER_MINUTES = 3;
export const DEFAULT_REST_TIMER_SECONDS = DEFAULT_REST_TIMER_MINUTES * 60;
export const MIN_WEIGHT_KG = 0;
export const MAX_WEIGHT_KG = 500;
export const MIN_REPS = 1;
export const MAX_REPS = 999;

// ============ UI LAYOUT ============
export const TAB_BAR_HEIGHT = 60;
export const SCREEN_PADDING = 16;
export const COMPONENT_MARGIN = 12;
export const BORDER_RADIUS_SMALL = 4;
export const BORDER_RADIUS_MEDIUM = 8;
export const BORDER_RADIUS_LARGE = 12;

// ============ COLORS ============
export const COLORS = {
  primary: '#2563EB',
  success: '#16A34A',
  warning: '#EAB308',
  error: '#EF4444',
  info: '#0EA5E9',
  
  background: '#F9FAFB',
  surface: '#FFFFFF',
  
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    light: '#9CA3AF',
  },
  
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
};

// ============ TEXT SIZES ============
export const FONT_SIZES = {
  xs: 11,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
} as const;

// ============ FONT WEIGHTS ============
export const FONT_WEIGHTS = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

// ============ ANIMATIONS ============
export const ANIMATION_DURATION_SHORT = 200; // ms
export const ANIMATION_DURATION_MEDIUM = 300; // ms
export const ANIMATION_DURATION_LONG = 500; // ms

// ============ TIMEOUTS & LIMITS ============
export const SYNC_TIMEOUT_MS = 30000;
export const DEBOUNCE_DELAY_MS = 300;
export const AUTO_SAVE_DELAY_MS = 1000;
export const BACKUP_SIZE_LIMIT_MB = 50;

// ============ LISTS & PAGINATION ============
export const LIST_PAGE_SIZE = 20;
export const SEARCH_MIN_CHARS = 2;

// ============ DATE & TIME ============
export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// ============ VALIDATION ============
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;
export const NOTES_MAX_LENGTH = 500;
export const PASSWORD_MIN_LENGTH = 6;

// ============ NOTIFICATIONS ============
export const NOTIFICATION_AUTO_DISMISS_MS = 3000;
