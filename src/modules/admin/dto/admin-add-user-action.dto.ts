import { ApiProperty } from '@nestjs/swagger';
import { RestrictionType } from '@prisma/client';
import { IsString, IsOptional, IsEnum, IsDateString, ValidateIf, IsObject } from 'class-validator';
export class AddUserActionDto {
  @ApiProperty({})
  @IsEnum(RestrictionType, { message: 'Type must be one of BAN, SUSPENSION, WARNING, ADMIN_NOTE' })
  type: RestrictionType;

  @ApiProperty({})
  @IsOptional()
  @IsString({ message: 'Reason must be a string' })
  reason?: string;

    
  @ValidateIf(o => o.type === RestrictionType.WARNING)
  @IsOptional()
  @IsDateString({}, { message: 'endAt must be a valid ISO date string' })
  @ApiProperty({ required: false, description: 'Only used for Warning type' })
  endAt?: Date;

  @IsOptional()
  @IsString({ message: 'External note must be a string' })
  @ApiProperty({ required: false })
  externalNote?: string;
}