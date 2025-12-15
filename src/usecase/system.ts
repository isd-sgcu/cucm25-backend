import { AppError } from '@/types/error/AppError';
import {
  SETTINGS_TTL,
  SYSTEM_SETTINGS,
} from '@/constant/systemConfig';
import {
  SystemToggleRequest,
  SystemToggleResponse,
  SystemStatusResponse,
  SettingKey,
  SettingRequest,
} from '@/types/system';
import { SystemRepository } from '@/repository/system';
import { User } from '@prisma/client';

export class SystemUsecase {
  private cacheAt = 0;
  private cachedStatus: SystemStatusResponse | null = null;
  private buildingStatusPromise: Promise<SystemStatusResponse> | null = null;

  constructor(private systemRepository: SystemRepository) {}

  async toggleSystemSetting(
    data: SystemToggleRequest,
    user: Pick<User, 'id' | 'role'>,
  ): Promise<SystemToggleResponse> {
    // Validate ADMIN-only permission (changed from ADMIN or MODERATOR)
    const userRole = user.role;
    if (userRole !== 'ADMIN') {
      throw new AppError('Only administrators can modify system settings', 403);
    }

    // Validate setting key using centralized constants
    const validKeys: SettingKey[] = [
      'junior_login_enabled' as SettingKey,
      'mod_login_enabled' as SettingKey,
      'senior_login_enabled' as SettingKey,
    ];

    if (!validKeys.includes(data.settingKey as SettingKey)) {
      throw new AppError('Invalid setting key', 400);
    }

    const updatedSetting = await this.systemRepository.updateSystemSetting(
      data.settingKey as SettingKey,
      data.enabled.toString(),
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
    user: Pick<User, 'id' | 'role'>,
    body: SettingRequest,
  ): Promise<{
    success: boolean;
    message: string;
    newSettings: any[];
  }> {
    const userRole = user.role;
    if (userRole !== 'ADMIN') {
      throw new AppError('Only administrators can modify system settings', 403);
    }

    if (Object.keys(body).length === 0) {
      throw new AppError('No settings provided to update', 400);
    }

    for (const [key, value] of Object.entries(body)) {
      if (!(key in SYSTEM_SETTINGS)) {
        throw new AppError(`Invalid setting key: ${key}`, 400);
      }

      await this.systemRepository.updateSystemSetting(
        key as SettingKey,
        value.toString(),
      );
    }

    const updatedSetting = await this.systemRepository.getAllSystemSettings();

    return {
      success: true,
      message: `Settings updated successfully`,
      newSettings: updatedSetting,
    };
  }

  async getSystemStatus(): Promise<SystemStatusResponse> {
    const now = Date.now();
    if (this.cachedStatus && now - this.cacheAt < SETTINGS_TTL) {
      return this.cachedStatus;
    }

    if (this.buildingStatusPromise) {
      return this.buildingStatusPromise;
    }

    this.buildingStatusPromise = this.buildSystemStatus()
      .then((status) => {
        this.cachedStatus = status;
        this.cacheAt = Date.now();
        return status;
      })
      .finally(() => {
        this.buildingStatusPromise = null;
      });

    return this.buildingStatusPromise;
  }

  async buildSystemStatus(): Promise<SystemStatusResponse> {
    const settings = await this.systemRepository.getAllSystemSettings();

    const settingsObj = settings.reduce(
      (obj, setting) => {
        const config = SYSTEM_SETTINGS[setting.setting_key];

        if (!config) {
          obj[setting.setting_key] = setting.setting_value;
          return obj;
        }

        if (typeof config.default === 'boolean') {
          obj[config.output] = setting.setting_value === 'true';
        } else if (typeof config.default === 'number') {
          obj[config.output] = parseInt(setting.setting_value, 10);
        } else {
          obj[config.output] = setting.setting_value;
        }

        return obj;
      },
      {} as { [key: string]: any },
    );

    const lastUpdated = settings.reduce((latest, setting) => {
      return setting.updated_at > latest ? setting.updated_at : latest;
    }, new Date(0));

    Object.values(SYSTEM_SETTINGS).forEach((setting) => {
      if (!(setting.output in settingsObj)) {
        settingsObj[setting.output] = setting.default;
      }
    });

    return {
      ...settingsObj,
      lastUpdated: lastUpdated.toISOString(),
      cacheAt: this.cacheAt,
    } as SystemStatusResponse;
  }

  async checkSystemAvailability(userRole: string): Promise<boolean> {
    const status = await this.getSystemStatus();

    if (userRole === 'MODERATOR') {
      return status.modLoginEnabled;
    } else if (userRole === 'STAFF') {
      return status.seniorLoginEnabled;
    } else if (userRole === 'PARTICIPANT') {
      return status.juniorLoginEnabled;
    } else {
      return true;
    }
  }
}
