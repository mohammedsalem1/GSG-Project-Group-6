import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateSkillDto {
  @ApiProperty({ description: 'Skill name' })
  @IsString()
  name: string;
}
export class SkillResponseDto {
    @ApiProperty()
    @IsUUID()
    skillId: string;
  
    @ApiProperty()
    @IsString()
    skillName: string;
  }
  

