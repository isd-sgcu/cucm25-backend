import { prisma } from "@/lib/prisma"
import { SettingKey } from "@/types/system"
import { PrismaClient } from "@prisma/client"

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
            console.error('Error checking if system is enabled:', error);
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
            "junior_login_enabled": "การเปิด/ปิดระบบสำหรับน้องค่าย", 
            "senior_login_enabled": "การเปิด/ปิดระบบสำหรับพี่ค่าย",
            "gift_hourly_quota": "จำนวนครั้งที่ส่งของขวัญได้ต่อชั่วโมง"
        }
        return descriptions[settingKey] || ""
    }
}