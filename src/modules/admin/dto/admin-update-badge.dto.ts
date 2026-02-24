
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateBadgeRequirementDto {
  @ApiProperty({ example: "3" })
  @IsString()
  @IsNotEmpty()
  requirement: string;
}
