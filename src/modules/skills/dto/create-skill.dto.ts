import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateSkillDto {
  @ApiProperty({ description: 'name skill' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'description skill', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'language skill', required: false })
  @IsOptional()
  @IsString()
  language?: string;
}
