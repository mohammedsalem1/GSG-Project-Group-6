import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { MessageChannel } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class CreateMessageTemplateDto {
  @ApiProperty({
    description: 'Template name (must be unique)',
    example: 'Swap Request Notification',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Trigger event for the template',
    example: 'SWAP_REQUEST',
  })
  @IsString()
  triggerEvent: string;

  @ApiPropertyOptional({
    description: 'Email subject line (for EMAIL channel)',
    example: 'New Skill Swap Request from {{requesterName}}',
  })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({
    description: 'Message body with template variables',
    example:
      '<p>Hi {{receiverName}}, {{requesterName}} wants to swap {{offeredSkill}} for your {{requestedSkill}}</p>',
  })
  @IsString()
  body: string;

  @ApiPropertyOptional({
    description: 'Array of variable names used in the template',
    example: [
      'requesterName',
      'receiverName',
      'offeredSkill',
      'requestedSkill',
    ],
  })
  @IsArray()
  @IsOptional()
  variables?: string[];

  @ApiProperty({
    description: 'Notification channel',
    enum: MessageChannel,
    example: MessageChannel.BOTH,
  })
  @IsEnum(MessageChannel)
  @IsOptional()
  channel?: MessageChannel;

  @ApiProperty({
    description: 'Is template active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Template category for organization',
    example: 'swap',
  })
  @IsString()
  @IsOptional()
  category?: string;
}

export class UpdateMessageTemplateDto {
  @ApiPropertyOptional({
    description: 'Template name',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Trigger event',
  })
  @IsString()
  @IsOptional()
  triggerEvent?: string;

  @ApiPropertyOptional({
    description: 'Email subject line',
  })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional({
    description: 'Message body',
  })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiPropertyOptional({
    description: 'Array of variable names',
  })
  @IsArray()
  @IsOptional()
  variables?: string[];

  @ApiPropertyOptional({
    description: 'Notification channel',
    enum: MessageChannel,
  })
  @IsEnum(MessageChannel)
  @IsOptional()
  channel?: MessageChannel;

  @ApiPropertyOptional({
    description: 'Is template active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Template category',
  })
  @IsString()
  @IsOptional()
  category?: string;
}

export class MessageTemplateDetailDto {
  @ApiProperty({ description: 'Template ID' })
  id: string;

  @ApiProperty({ description: 'Template name' })
  name: string;

  @ApiProperty({ description: 'Trigger event' })
  triggerEvent: string;

  @ApiPropertyOptional({ description: 'Email subject' })
  subject?: string;

  @ApiProperty({ description: 'Message body with variables' })
  body: string;

  @ApiPropertyOptional({ description: 'Variables used in template' })
  variables?: string[];

  @ApiProperty({ description: 'Notification channel' })
  channel: MessageChannel;

  @ApiProperty({ description: 'Is active' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Category' })
  category?: string;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;
}

export class MessageTemplateListResponseDto {
  @ApiProperty({
    description: 'List of message templates',
    type: [MessageTemplateDetailDto],
  })
  data: MessageTemplateDetailDto[];

  @ApiProperty({
    description: 'Pagination info',
    example: {
      total: 20,
      page: 1,
      limit: 10,
      totalPages: 2,
      hasNextPage: true,
      hasPrevPage: false,
    },
  })
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class MessageTemplateQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by trigger event',
    example: 'SWAP_REQUEST',
  })
  @IsString()
  @IsOptional()
  triggerEvent?: string;

  @ApiPropertyOptional({
    description: 'Filter by channel',
    enum: MessageChannel,
  })
  @IsEnum(MessageChannel)
  @IsOptional()
  channel?: MessageChannel;

  @ApiPropertyOptional({
    description: 'Filter by active status',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Search by name',
  })
  @IsString()
  @IsOptional()
  search?: string;

  page: number = 1;
  limit: number = 10;
}

export class PreviewTemplateDto {
  @ApiProperty({
    description: 'Variables to use for preview rendering',
    example: {
      requesterName: 'John Doe',
      receiverName: 'Jane Smith',
      offeredSkill: 'JavaScript',
      requestedSkill: 'Python',
    },
  })
  variables: Record<string, string>;
}

export class PreviewTemplateResponseDto {
  @ApiProperty({ description: 'Rendered subject line' })
  subject?: string;

  @ApiProperty({ description: 'Rendered message body' })
  body: string;

  @ApiProperty({ description: 'Missing variables that were not provided' })
  missingVariables: string[];
}
