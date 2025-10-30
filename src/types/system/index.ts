export interface SystemToggleRequest {
    settingKey: string
    enabled: boolean
}

export interface SystemToggleResponse {
    success: boolean
    message: string
    settingKey: string
    enabled: boolean
    updatedAt: string
}

export interface SystemStatusResponse {
    juniorLoginEnabled: boolean
    seniorLoginEnabled: boolean
    giftHourlyQuota: number
    lastUpdated: string
}

export interface SystemSetting {
    settingKey: string
    settingValue: string
    description: string | null
    updatedAt: Date
}

export type SettingKey = 
    | "junior_login_enabled" 
    | "senior_login_enabled"
    | "gift_hourly_quota"