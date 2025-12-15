import { SettingKey } from '@/types/system';
import { prisma } from '@/lib/prisma';
import { SYSTEM_SETTINGS, COMMIT_DEFAULTS } from '@/constant/systemConfig';
import { SystemSetting } from '@prisma/client';

export class SystemRepository {
  constructor() {}

  async initializeDefaultSettings(): Promise<void> {
    await Promise.all(
      Object.entries(SYSTEM_SETTINGS).map(async ([key, setting]) => {
        return await prisma.systemSetting.upsert({
          where: { setting_key: key },
          update: {},
          create: {
            setting_key: key,
            setting_value: setting.default.toString() || '',
            description: setting.description || '',
            updated_at: new Date(),
          },
        });
      }),
    );
  }

  async getAllSystemSettings(): Promise<SystemSetting[]> {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { setting_key: 'asc' },
    });

    if (COMMIT_DEFAULTS && settings.length === 0) {
      this.initializeDefaultSettings();
    }

    return settings;
  }

  async updateSystemSetting(
    settingKey: SettingKey,
    settingValue: string,
  ): Promise<SystemSetting> {
    return await prisma.systemSetting.upsert({
      where: { setting_key: settingKey },
      update: {
        setting_value: settingValue,
        updated_at: new Date(),
      },
      create: {
        setting_key: settingKey,
        setting_value: settingValue,
        description:
          SYSTEM_SETTINGS[
            settingKey as keyof typeof SYSTEM_SETTINGS
          ]?.description || '',      
        updated_at: new Date(),  
      },
    });
  }
}
