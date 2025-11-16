import { ISystemRepository } from "@/repository/system/systemRepository"
import { AppError } from "@/types/error/AppError"
import { 
    SystemToggleRequest, 
    SystemToggleResponse, 
    SystemStatusResponse,
    SettingKey 
} from "@/types/system"

export interface ISystemUsecase {
    toggleSystemSetting(
        data: SystemToggleRequest,
        adminUserId: string
    ): Promise<SystemToggleResponse>
    
    getSystemStatus(): Promise<SystemStatusResponse>
    
    checkSystemAvailability(userRole?: string): Promise<boolean>
}

export class SystemUsecase implements ISystemUsecase {
    constructor(private systemRepository: ISystemRepository) {}

    async toggleSystemSetting(
        data: SystemToggleRequest,
        adminUserId: string
    ): Promise<SystemToggleResponse> {
        // Validate admin/moderator permission
        const user = await this.systemRepository.getUserWithRole(adminUserId)
        if (!user) {
            throw new AppError("User not found", 404)
        }
        
        const userRole = user.role
        if (userRole !== "ADMIN" && userRole !== "MODERATOR") {
            throw new AppError("Only administrators and moderators can modify system settings", 403)
        }
        
        // Validate setting key
        const validKeys: SettingKey[] = [
            "junior_login_enabled", 
            "senior_login_enabled",
            "gift_hourly_quota"
        ]
        
        if (!validKeys.includes(data.settingKey as SettingKey)) {
            throw new AppError("Invalid setting key", 400)
        }
        
        let settingValue: string
        if (data.settingKey === "gift_hourly_quota") {
            // For quota, enabled=true means default value, enabled=false means 0
            settingValue = data.enabled ? "5" : "0"
        } else {
            // For boolean settings
            settingValue = data.enabled ? "true" : "false"
        }
        
        const updatedSetting = await this.systemRepository.updateSystemSetting(
            data.settingKey as SettingKey,
            settingValue
        )
        
        return {
            success: true,
            message: `Setting ${data.settingKey} updated to ${data.enabled ? 'enabled' : 'disabled'}`,
            settingKey: data.settingKey,
            enabled: data.enabled,
            updatedAt: updatedSetting.updated_at.toISOString()
        }
    }
    
    async getSystemStatus(): Promise<SystemStatusResponse> {
        const settings = await this.systemRepository.getAllSystemSettings()
        
        const settingsMap = new Map(
            settings.map(s => [s.setting_key, s.setting_value])
        )
        
        const lastUpdated = settings.reduce((latest, setting) => {
            return setting.updated_at > latest ? setting.updated_at : latest
        }, new Date(0))
        
        return {
            juniorLoginEnabled: settingsMap.get("junior_login_enabled") === "true",
            seniorLoginEnabled: settingsMap.get("senior_login_enabled") === "true", 
            giftHourlyQuota: parseInt(settingsMap.get("gift_hourly_quota") || "5"),
            lastUpdated: lastUpdated.toISOString()
        }
    }
    
    async checkSystemAvailability(userRole?: string): Promise<boolean> {
        // Check role-specific availability
        if (userRole) {
            if (userRole === "junior") {
                return await this.systemRepository.isSystemEnabled("junior_login_enabled")
            }
            if (userRole === "senior") {
                return await this.systemRepository.isSystemEnabled("senior_login_enabled")
            }
        }
        
        // If no role specified or role is admin/moderator, allow access
        return true
    }
}