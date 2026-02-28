import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class TrendingSkillResponseDto {
  
  @ApiProperty()
  @IsString()
  skillId: string;
  
  @ApiProperty()
  @IsString()
  skillName: string;

  @ApiProperty()
  @IsNumber()
  learningCount: number; 
}