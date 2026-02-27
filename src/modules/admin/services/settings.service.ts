import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import {
  UpdatePlatformSettingsDto,
  PlatformSettingsResponseDto,
} from '../dto/admin-platform-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get current platform settings
   * Returns cached settings if available
   */
  async getSettings(): Promise<PlatformSettingsResponseDto> {
    let settings = await this.prisma.platformSettings.findFirst();

    // If no settings exist, create defaults
    if (!settings) {
      settings = await this.prisma.platformSettings.create({
        data: {
          platformName: 'SkillSwap',
          defaultLanguage: 'English',
          defaultTimezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
          status: 'LIVE',
          supportEmail: 'support@skillswap.com',
        },
      });
    }

    return this.mapToDto(settings);
  }

  /**
   * Update platform settings
   */
  async updateSettings(
    dto: UpdatePlatformSettingsDto,
  ): Promise<PlatformSettingsResponseDto> {
    const settings = await this.prisma.platformSettings.findFirst();

    if (!settings) {
      throw new NotFoundException('Platform settings not found');
    }

    const updated = await this.prisma.platformSettings.update({
      where: { id: settings.id },
      data: {
        platformName: dto.platformName ?? settings.platformName,
        defaultLanguage: dto.defaultLanguage ?? settings.defaultLanguage,
        defaultTimezone: dto.defaultTimezone ?? settings.defaultTimezone,
        dateFormat: dto.dateFormat ?? settings.dateFormat,
        status: dto.status ?? settings.status,
        supportEmail: dto.supportEmail ?? settings.supportEmail,
        contactPhone: dto.contactPhone ?? settings.contactPhone,
        socialLinks: dto.socialLinks || (settings.socialLinks as any),
      },
    });

    return this.mapToDto(updated);
  }

  /**
   * Validate settings before save
   */
  validateSettings(dto: UpdatePlatformSettingsDto): void {
    if (dto.status && !['LIVE', 'MAINTENANCE', 'PAUSED'].includes(dto.status)) {
      throw new Error('Invalid platform status');
    }

    if (
      dto.dateFormat &&
      !['YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY'].includes(dto.dateFormat)
    ) {
      throw new Error('Invalid date format');
    }
  }

  private mapToDto(settings: any): PlatformSettingsResponseDto {
    return {
      id: settings.id,
      platformName: settings.platformName,
      defaultLanguage: settings.defaultLanguage,
      defaultTimezone: settings.defaultTimezone,
      dateFormat: settings.dateFormat,
      status: settings.status,
      supportEmail: settings.supportEmail,
      contactPhone: settings.contactPhone,
      socialLinks: settings.socialLinks as Record<string, string> | undefined,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }
}
