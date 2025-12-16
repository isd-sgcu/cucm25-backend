/**
 * System Configuration Constants
 * Centralized configuration for system-wide settings and default values
 */

// Gift System Configuration
export const GIFT_SYSTEM = {
  DEFAULT_HOURLY_QUOTA: 5,
  QUESTION_COUNT: 3,
  DISABLED_QUOTA: 0,
  MIN_QUOTA: 0,
  MAX_QUOTA: 1000,
  DEFAULT_VALUE: 100,
} as const;

export const COMMIT_DEFAULTS = false;
export const SETTINGS_TTL = 3000; // 3 seconds

export const SYSTEM_SETTINGS: {
  [key: string]: {
    output: string;
    description: string;
    default?: any;
  };
} = {
  junior_login_enabled: {
    output: 'juniorLoginEnabled',
    description: 'Enable or disable login for junior users.',
    default: true,
  },
  mod_login_enabled: {
    output: 'modLoginEnabled',
    description: 'Enable or disable login for moderator users.',
    default: true,
  },
  senior_login_enabled: {
    output: 'seniorLoginEnabled',
    description: 'Enable or disable login for senior users.',
    default: true,
  },
  gift_hourly_quota: {
    output: 'giftHourlyQuota',
    description: 'Number of gifts a user can send per hour.',
    default: 5,
  },
  gift_value: {
    output: 'giftValue',
    description: 'Amount of currency awarded to the recipient of a gift.',
    default: 100,
  },
  ticket_price: {
    output: 'ticketPrice',
    description: 'Cost of a single ticket in the system.',
    default: 15,
  },
} as const;

// User Role Mappings (Database Enum -> Lowercase String)
export const ROLE_MAPPINGS = {
  PARTICIPANT: 'junior',
  STAFF: 'senior',
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
    },
  },
} as const;
