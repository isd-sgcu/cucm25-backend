import { ISystemRepository } from '@/repository/system/systemRepository';
import { AppError } from '@/types/error/AppError';
import {
  GIFT_SYSTEM,
  SYSTEM_DEFAULTS,
  ROLE_MAPPINGS,
  SYSTEM_SETTINGS,
} from '@/constant/systemConfig';
import {
  SystemToggleRequest,
  SystemToggleResponse,
  SystemStatusResponse,
  SettingKey,
  SettingRequest,
} from '@/types/system';

export interface ISystemUsecase {
  toggleSystemSetting(
    data: SystemToggleRequest,
    adminUserId: string,
  ): Promise<SystemToggleResponse>;

  getSystemStatus(): Promise<SystemStatusResponse>;

  checkSystemAvailability(userRole?: string): Promise<boolean>;

  setSystemSetting(
    adminUserId: string,
    body: SettingRequest,
  ): Promise<{
    success: boolean;
    message: string;
    newSettings: any[];
  }>;
}

export class SystemUsecase implements ISystemUsecase {
  constructor(private systemRepository: ISystemRepository) {}

  async toggleSystemSetting(
    data: SystemToggleRequest,
    adminUserId: string,
  ): Promise<SystemToggleResponse> {
    // Validate ADMIN-only permission (changed from ADMIN or MODERATOR)
    const user = await this.systemRepository.getUserWithRole(adminUserId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const userRole = user.role;
    if (userRole !== 'ADMIN') {
      throw new AppError('Only administrators can modify system settings', 403);
    }

    // Validate setting key using centralized constants
    const validKeys: SettingKey[] = [
      SYSTEM_SETTINGS.JUNIOR_LOGIN_ENABLED as SettingKey,
      SYSTEM_SETTINGS.MOD_LOGIN_ENABLED as SettingKey,
      SYSTEM_SETTINGS.SENIOR_LOGIN_ENABLED as SettingKey,
    ];

    if (!validKeys.includes(data.settingKey as SettingKey)) {
      throw new AppError('Invalid setting key', 400);
    }

    let settingValue: string;
    settingValue = data.enabled
      ? SYSTEM_DEFAULTS.BOOLEAN_ENABLED
      : SYSTEM_DEFAULTS.BOOLEAN_DISABLED;

    const updatedSetting = await this.systemRepository.updateSystemSetting(
      data.settingKey as SettingKey,
      settingValue,
    );

    return {
      success: true,
      message: `Setting ${data.settingKey} updated to ${data.enabled ? 'enabled' : 'disabled'}`,
      settingKey: data.settingKey,
      enabled: data.enabled,
      updatedAt: updatedSetting.updated_at.toISOString(),
    };
  }

  async setSystemSetting(
    adminUserId: string,
    body: SettingRequest,
  ): Promise<{
    success: boolean;
    message: string;
    newSettings: any[];
  }> {
    const user = await this.systemRepository.getUserWithRole(adminUserId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const userRole = user.role;
    if (userRole !== 'ADMIN') {
      throw new AppError('Only administrators can modify system settings', 403);
    }

    if (Object.keys(body).length === 0) {
      throw new AppError('No settings provided to update', 400);
    }

    for (const [key, value] of Object.entries(body)) {
      if (!(key.toUpperCase() in SYSTEM_SETTINGS)) {
        throw new AppError(`Invalid setting key: ${key}`, 400);
      }

      await this.systemRepository.updateSystemSetting(key as SettingKey, value.toString());
    }

    const updatedSetting = await this.systemRepository.getAllSystemSettings();
    
    return {
      success: true,
      message: `Settings updated successfully`,
      newSettings: updatedSetting,
    };
  }

  async getSystemStatus(): Promise<SystemStatusResponse> {
    const settings = await this.systemRepository.getAllSystemSettings();

    const settingsMap = new Map(
      settings.map((s) => [s.setting_key, s.setting_value]),
    );

    const lastUpdated = settings.reduce((latest, setting) => {
      return setting.updated_at > latest ? setting.updated_at : latest;
    }, new Date(0));

    return {
      juniorLoginEnabled:
        settingsMap.get(SYSTEM_SETTINGS.JUNIOR_LOGIN_ENABLED) ===
        SYSTEM_DEFAULTS.BOOLEAN_ENABLED,
      modLoginEnabled:
        settingsMap.get(SYSTEM_SETTINGS.MOD_LOGIN_ENABLED) ===
        SYSTEM_DEFAULTS.BOOLEAN_ENABLED,
      seniorLoginEnabled:
        settingsMap.get(SYSTEM_SETTINGS.SENIOR_LOGIN_ENABLED) ===
        SYSTEM_DEFAULTS.BOOLEAN_ENABLED,
      giftHourlyQuota: parseInt(
        settingsMap.get(SYSTEM_SETTINGS.GIFT_HOURLY_QUOTA) ||
          SYSTEM_DEFAULTS.GIFT_QUOTA,
      ),
      ticketPrice: parseInt(
        settingsMap.get(SYSTEM_SETTINGS.TICKET_PRICE) ||
          SYSTEM_DEFAULTS.TICKET_PRICE,
      ),
      lastUpdated: lastUpdated.toISOString(),
    };
  }

  async checkSystemAvailability(userRole?: string): Promise<boolean> {
    // Check role-specific availability using centralized role mappings
    if (userRole) {
      let settingKey: SettingKey | undefined;

      // Map role strings to their corresponding system setting keys
      switch (userRole) {
        case ROLE_MAPPINGS.PARTICIPANT:
          settingKey = SYSTEM_SETTINGS.JUNIOR_LOGIN_ENABLED as SettingKey;
          break;
        case ROLE_MAPPINGS.MODERATOR:
          settingKey = SYSTEM_SETTINGS.MOD_LOGIN_ENABLED as SettingKey;
          break;
        case ROLE_MAPPINGS.STAFF:
        case ROLE_MAPPINGS.ADMIN:
          // Both STAFF and ADMIN use senior settings (since ADMIN maps to "senior")
          settingKey = SYSTEM_SETTINGS.SENIOR_LOGIN_ENABLED as SettingKey;
          break;
      }

      if (settingKey) {
        return await this.systemRepository.isSystemEnabled(settingKey);
      }
    }

    // If no role specified or role is not recognized, allow access
    return true;
  }
}
