import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsInt } from 'class-validator';
import { PolicyType } from '@prisma/client';

export class CreatePolicySectionDto {
  @ApiProperty({
    description: 'Policy type',
    enum: PolicyType,
    example: PolicyType.TERMS_OF_SERVICE,
  })
  @IsEnum(PolicyType)
  policyType: PolicyType;

  @ApiProperty({
    description: 'Section title',
    example: 'Eligibility and Account Requirements',
  })
  @IsString()
  sectionTitle: string;

  @ApiProperty({
    description: 'Section content in HTML format',
    example: '<p>Users must be at least 18 years old...</p>',
  })
  @IsString()
  sectionContent: string;

  @ApiPropertyOptional({
    description: 'Order for display (lower numbers appear first)',
    example: 1,
  })
  @IsInt()
  @IsOptional()
  sectionOrder?: number;
}

export class UpdatePolicySectionDto {
  @ApiPropertyOptional({
    description: 'Section title',
  })
  @IsString()
  @IsOptional()
  sectionTitle?: string;

  @ApiPropertyOptional({
    description: 'Section content',
  })
  @IsString()
  @IsOptional()
  sectionContent?: string;

  @ApiPropertyOptional({
    description: 'Order for display',
  })
  @IsInt()
  @IsOptional()
  sectionOrder?: number;
}

export class PolicySectionResponseDto {
  @ApiProperty({ description: 'Section ID' })
  id: string;

  @ApiProperty({ description: 'Policy type' })
  policyType: PolicyType;

  @ApiProperty({ description: 'Section title' })
  sectionTitle: string;

  @ApiProperty({ description: 'Section content (HTML)' })
  sectionContent: string;

  @ApiProperty({ description: 'Display order' })
  sectionOrder: number;

  @ApiProperty({ description: 'Version number' })
  version: number;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;
}

export class PolicyTypeGroupDto {
  @ApiProperty({
    description: 'Policy type',
    enum: PolicyType,
  })
  policyType: PolicyType;

  @ApiProperty({
    description: 'Sections for this policy type',
    type: [PolicySectionResponseDto],
  })
  sections: PolicySectionResponseDto[];
}

export class PolicyListResponseDto {
  @ApiProperty({
    description: 'All policies grouped by type',
    type: [PolicyTypeGroupDto],
  })
  data: PolicyTypeGroupDto[];

  @ApiProperty({
    description: 'Total number of sections',
    example: 15,
  })
  total: number;
}
