import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import {
  CreateMessageTemplateDto,
  UpdateMessageTemplateDto,
  MessageTemplateDetailDto,
  MessageTemplateListResponseDto,
  MessageTemplateQueryDto,
  PreviewTemplateResponseDto,
} from '../dto/admin-message-templates.dto';
import { MessageChannel } from '@prisma/client';

@Injectable()
export class MessageTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create new message template
   */
  async createTemplate(
    dto: CreateMessageTemplateDto,
  ): Promise<MessageTemplateDetailDto> {
    // Check for duplicate name
    const existing = await this.prisma.messageTemplate.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Template name already exists');
    }

    // Validate template variables match body
    this.validateTemplateVariables(dto.body, dto.variables || []);

    const template = await this.prisma.messageTemplate.create({
      data: {
        name: dto.name,
        triggerEvent: dto.triggerEvent,
        subject: dto.subject,
        body: dto.body,
        variables:
          dto.variables && dto.variables.length > 0 ? dto.variables : undefined,
        channel: dto.channel || MessageChannel.BOTH,
        isActive: dto.isActive ?? true,
        category: dto.category,
      },
    });

    return this.mapToDto(template);
  }

  /**
   * Update existing template
   */
  async updateTemplate(
    id: string,
    dto: UpdateMessageTemplateDto,
  ): Promise<MessageTemplateDetailDto> {
    const template = await this.prisma.messageTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Message template not found');
    }

    // Check for duplicate name if updating name
    if (dto.name && dto.name !== template.name) {
      const existing = await this.prisma.messageTemplate.findUnique({
        where: { name: dto.name },
      });
      if (existing) {
        throw new BadRequestException('Template name already exists');
      }
    }

    // Validate variables if body is being updated
    if (dto.body) {
      const variables = dto.variables || (template.variables as string[]) || [];
      this.validateTemplateVariables(dto.body, variables);
    }

    const updated = await this.prisma.messageTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        triggerEvent: dto.triggerEvent,
        subject: dto.subject,
        body: dto.body,
        variables: dto.variables ? dto.variables : undefined,
        channel: dto.channel,
        isActive: dto.isActive,
        category: dto.category,
      },
    });

    return this.mapToDto(updated);
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<{ message: string }> {
    const template = await this.prisma.messageTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Message template not found');
    }

    await this.prisma.messageTemplate.delete({
      where: { id },
    });

    return { message: 'Template deleted successfully' };
  }

  /**
   * List templates with pagination and filtering
   */
  async listTemplates(
    query: MessageTemplateQueryDto,
  ): Promise<MessageTemplateListResponseDto> {
    const skip = (query.page - 1) * query.limit;

    const where: any = {};
    if (query.triggerEvent) where.triggerEvent = query.triggerEvent;
    if (query.channel) where.channel = query.channel;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { body: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [templates, total] = await Promise.all([
      this.prisma.messageTemplate.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.messageTemplate.count({ where }),
    ]);

    return {
      data: templates.map((t) => this.mapToDto(t)),
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
        hasNextPage: skip + query.limit < total,
        hasPrevPage: query.page > 1,
      },
    };
  }

  /**
   * Get single template
   */
  async getTemplate(id: string): Promise<MessageTemplateDetailDto> {
    const template = await this.prisma.messageTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Message template not found');
    }

    return this.mapToDto(template);
  }

  /**
   * Render template with variables
   * Used when sending actual notifications
   */
  async renderTemplate(
    templateId: string,
    variables: Record<string, string>,
  ): Promise<{ subject?: string; body: string; missingVariables: string[] }> {
    const template = await this.getTemplate(templateId);

    const requiredVariables = template.variables || [];
    const missingVariables = requiredVariables.filter((v) => !(v in variables));

    let renderedSubject = template.subject;
    let renderedBody = template.body;

    // Replace variables using {{variableName}} format
    Object.entries(variables).forEach(([key, value]) => {
      const pattern = new RegExp(`{{${key}}}`, 'g');
      if (renderedSubject) {
        renderedSubject = renderedSubject.replace(pattern, value || '');
      }
      renderedBody = renderedBody.replace(pattern, value || '');
    });

    return {
      subject: renderedSubject,
      body: renderedBody,
      missingVariables,
    };
  }

  /**
   * Preview template rendering with sample variables
   */
  async previewTemplate(
    id: string,
    variables: Record<string, string>,
  ): Promise<PreviewTemplateResponseDto> {
    const template = await this.getTemplate(id);

    const requiredVariables = template.variables || [];
    const missingVariables = requiredVariables.filter((v) => !(v in variables));

    let renderedSubject = template.subject;
    let renderedBody = template.body;

    // Replace provided variables
    Object.entries(variables).forEach(([key, value]) => {
      const pattern = new RegExp(`{{${key}}}`, 'g');
      if (renderedSubject) {
        renderedSubject = renderedSubject.replace(pattern, value || '');
      }
      renderedBody = renderedBody.replace(pattern, value || '');
    });

    // Mark missing variables with placeholders
    missingVariables.forEach((v) => {
      const pattern = new RegExp(`{{${v}}}`, 'g');
      const placeholder = `[${v}]`;
      if (renderedSubject) {
        renderedSubject = renderedSubject.replace(pattern, placeholder);
      }
      renderedBody = renderedBody.replace(pattern, placeholder);
    });

    return {
      subject: renderedSubject,
      body: renderedBody,
      missingVariables,
    };
  }

  /**
   * Validate that template body contains placeholders for declared variables
   */
  private validateTemplateVariables(body: string, variables: string[]): void {
    variables.forEach((variable) => {
      const pattern = new RegExp(`{{${variable}}}`, 'g');
      if (!pattern.test(body)) {
        throw new BadRequestException(
          `Variable {{${variable}}} is declared but not used in the template body`,
        );
      }
    });
  }

  private mapToDto(template: any): MessageTemplateDetailDto {
    return {
      id: template.id,
      name: template.name,
      triggerEvent: template.triggerEvent,
      subject: template.subject,
      body: template.body,
      variables: (template.variables as string[]) || [],
      channel: template.channel,
      isActive: template.isActive,
      category: template.category,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}
