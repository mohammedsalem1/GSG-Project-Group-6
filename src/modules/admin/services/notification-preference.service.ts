import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import {
  UpdateNotificationPreferencesDto,
  NotificationPreferencesResponseDto,
} from '../dto/admin-notifications.dto';
import { NotificationPreferenceType } from '@prisma/client';

@Injectable()
export class NotificationPreferenceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Initialize default notification preferences
   * Called on first setup
   */
  async initializeDefaultPreferences(): Promise<void> {
    const existing = await this.prisma.notificationPreference.count();

    if (existing > 0) {
      return; // Already initialized
    }

    const preferences = Object.values(NotificationPreferenceType).map(
      (type) => ({
        type,
        isEnabled: true,
      }),
    );

    await this.prisma.notificationPreference.createMany({
      data: preferences as any,
    });
  }

  /**
   * Get all notification preferences
   */
  async getPreferences(): Promise<NotificationPreferencesResponseDto> {
    let preferences = await this.prisma.notificationPreference.findMany();

    // Initialize if needed
    if (preferences.length === 0) {
      await this.initializeDefaultPreferences();
      preferences = await this.prisma.notificationPreference.findMany();
    }

    // Build summary
    const summary: Record<string, boolean> = {};
    preferences.forEach((pref) => {
      summary[pref.type] = pref.isEnabled;
    });

    return {
      data: preferences,
      summary,
    };
  }

  /**
   * Update notification preferences (bulk update)
   */
  async updatePreferences(
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesResponseDto> {
    // Update each provided preference
    const updates = Object.entries(dto).map(([key, value]) => {
      const type = key as NotificationPreferenceType;
      return this.prisma.notificationPreference.update({
        where: { type },
        data: { isEnabled: value },
      });
    });

    await Promise.all(updates);

    // Return updated preferences
    return this.getPreferences();
  }

  /**
   * Check if a notification type is enabled
   * Used by notification creation services
   */
  async isNotificationEnabled(type: string): Promise<boolean> {
    // Try to match type to NotificationPreferenceType
    let prefType: NotificationPreferenceType | null = null;

    if (type.includes('EMAIL')) {
      prefType = NotificationPreferenceType.EMAIL_NOTIFICATIONS;
    } else if (type.includes('DISPUTE')) {
      prefType = NotificationPreferenceType.DISPUTE_ALERTS;
    } else if (type.includes('REPORT')) {
      prefType = NotificationPreferenceType.REPORT_ALERTS;
    } else {
      // Default to IN_APP for other notifications
      prefType = NotificationPreferenceType.IN_APP_NOTIFICATIONS;
    }

    const preference = await this.prisma.notificationPreference.findUnique({
      where: { type: prefType },
    });

    return preference ? preference.isEnabled : true; // Default to enabled if not found
  }

  /**
   * Get a single preference
   */
  async getPreference(
    type: NotificationPreferenceType,
  ): Promise<{ type: string; isEnabled: boolean }> {
    const preference = await this.prisma.notificationPreference.findUnique({
      where: { type },
    });

    if (!preference) {
      throw new NotFoundException(`Preference ${type} not found`);
    }

    return {
      type: preference.type,
      isEnabled: preference.isEnabled,
    };
  }
}
