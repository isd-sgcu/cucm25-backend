import { SettingKey } from "@/types/system"
import { PrismaClient } from "@prisma/client"
import { logger } from "@/utils/logger"

export interface ISystemRepository {
    getSystemSetting(settingKey: SettingKey): Promise<any | null>
    
    getAllSystemSettings(): Promise<any[]>
    
    updateSystemSetting(
        settingKey: SettingKey, 
        settingValue: string
    ): Promise<any>
    
    isSystemEnabled(settingKey: SettingKey): Promise<boolean>
    
    getUserWithRole(userId: string): Promise<any | null>
}

export class SystemRepository implements ISystemRepository {
    constructor(private prisma: PrismaClient) {}
    
    async getSystemSetting(settingKey: SettingKey): Promise<any | null> {
        return await this.prisma.systemSetting.findUnique({
            where: { setting_key: settingKey }
        })
    }
    
    async getAllSystemSettings(): Promise<any[]> {
        return await this.prisma.systemSetting.findMany({
            orderBy: { setting_key: 'asc' }
        })
    }
    
    async updateSystemSetting(
        settingKey: SettingKey, 
        settingValue: string
    ): Promise<any> {
        return await this.prisma.systemSetting.upsert({
            where: { setting_key: settingKey },
            update: { 
                setting_value: settingValue,
                updated_at: new Date()
            },
            create: {
                setting_key: settingKey,
                setting_value: settingValue,
                description: this.getDefaultDescription(settingKey),
                updated_at: new Date()
            }
        })
    }
    
    async isSystemEnabled(settingKey: SettingKey): Promise<boolean> {
        try {
            const setting = await this.getSystemSetting(settingKey);
            return setting?.setting_value === 'true';
        } catch (error) {
            logger.error('SystemRepository', 'Error checking if system is enabled', error);
            return false;
        }  
    }
    
    async getUserWithRole(userId: string): Promise<any | null> {
        return await this.prisma.user.findUnique({
            where: { id: userId },
        })
    }
    
    private getDefaultDescription(settingKey: SettingKey): string {
        const descriptions: Record<SettingKey, string> = {
            "junior_login_enabled": "Enable/disable system access for participants", 
            "mod_login_enabled": "Enable/disable system access for moderators",
            "senior_login_enabled": "Enable/disable system access for staff members",
            "gift_hourly_quota": "Number of gifts that can be sent per hour"
        }
        return descriptions[settingKey] || ""
    }
}