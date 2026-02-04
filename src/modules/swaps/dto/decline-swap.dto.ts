import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class DeclineSwapRequestDto {
  @ApiProperty({ description: 'description reason', example: 'Skill not good match' })  
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
