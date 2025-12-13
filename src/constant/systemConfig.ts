/**
 * System Configuration Constants
 * Centralized configuration for system-wide settings and default values
 */

// Gift System Configuration
export const GIFT_SYSTEM = {
  DEFAULT_HOURLY_QUOTA: 5,
  DISABLED_QUOTA: 0,
  MIN_QUOTA: 0,
  MAX_QUOTA: 1000,
  DEFAULT_VALUE: 100,
} as const;

// System Settings Keys
export const SYSTEM_SETTINGS = {
  JUNIOR_LOGIN_ENABLED: 'junior_login_enabled',
  MOD_LOGIN_ENABLED: 'mod_login_enabled',
  SENIOR_LOGIN_ENABLED: 'senior_login_enabled',
  GIFT_HOURLY_QUOTA: 'gift_hourly_quota',
  TICKET_PRICE: 'ticket_price',
} as const;

// Default System Values
export const SYSTEM_DEFAULTS = {
  BOOLEAN_ENABLED: 'true',
  BOOLEAN_DISABLED: 'false',
  JUNIOR_LOGIN_ENABLED: true,
  MOD_LOGIN_ENABLED: true,
  SENIOR_LOGIN_ENABLED: true,
  GIFT_QUOTA: GIFT_SYSTEM.DEFAULT_HOURLY_QUOTA.toString(),
  TICKET_PRICE: '10',
} as const;

// User Role Mappings (Database Enum -> Lowercase String)
export const ROLE_MAPPINGS = {
  PARTICIPANT: 'junior',
  STAFF: 'senior',
  MODERATOR: 'moderator',
  ADMIN: 'senior',
} as const;

// Database Role Enum Values
export const DATABASE_ROLES = {
  PARTICIPANT: 'PARTICIPANT',
  STAFF: 'STAFF',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN',
} as const;

// Target Role Values (for code generation)
export const TARGET_ROLES = {
  JUNIOR: 'junior',
  SENIOR: 'senior',
  ALL: 'all',
} as const;

// Business Rules
export const BUSINESS_RULES = {
  CODE_GENERATION: {
    MAX_RETRIES: 100,
    WARNING_THRESHOLD: 50,
    FORMAT: {
      LETTER_COUNT: 1,
      NUMBER_COUNT: 3,
      TOTAL_COMBINATIONS: 26000, // 26 * 1000
    },
  },
  WALLET: {
    MIN_BALANCE: 0,
    DEFAULT_LEVEL: 1,
    DEFAULT_GIFT_SENDS: GIFT_SYSTEM.DEFAULT_HOURLY_QUOTA,
  },
} as const;
