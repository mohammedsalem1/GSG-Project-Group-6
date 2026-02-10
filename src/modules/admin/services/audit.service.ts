/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { AdminAuditLogsListResponseDto } from '../dto/admin-audit.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class AuditService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Log an administrative action
   */
  async logAction(
    adminId: string,
    action: string,
    entity: string,
    entityId: string,
    details: string,
    status: string = 'SUCCESS',
    metadata?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.prismaService.auditLog.create({
      data: {
        adminId,
        action,
        entity,
        entityId,
        details,
        status,
        metadata,
        ipAddress,
        userAgent,
      },
    });
  }

  /**
   * Get audit logs with pagination, filtering, and sorting
   */
  async getAuditLogs(
    query: PaginationDto,
  ): Promise<AdminAuditLogsListResponseDto> {
    const { page = 1, limit = 10 } = query;

    const pagination = this.prismaService.handleQueryPagination({
      page,
      limit,
    });

    // Get audit logs
    const logs = await this.prismaService.auditLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      skip: pagination.skip,
      take: pagination.take,
      select: {
        id: true,
        createdAt: true,
        action: true,
        entity: true,
        details: true,
        status: true,
        ipAddress: true,
      },
    });

    // Get total count
    const total = await this.prismaService.auditLog.count();

    // Format data
    const data = logs.map((log) => ({
      id: log.id,
      timestamp: log.createdAt,
      action: log.action,
      entity: log.entity,
      details: log.details,
      status: log.status,
    }));

    return {
      data,
      total,
      page,
      limit,
    };
  }
}
