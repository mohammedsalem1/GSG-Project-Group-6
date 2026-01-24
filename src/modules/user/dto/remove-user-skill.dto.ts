import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class RemoveUserSkillDto {
  @ApiProperty({
    example: 'uuid-of-skill',
    description: 'ID of the skill to remove',
  })
  @IsNotEmpty({ message: 'Skill ID is required' })
  @IsString()
  skillId: string;

  @ApiProperty({
    example: true,
    description:
      'Whether removing from offered skills (true) or wanted skills (false)',
  })
  @IsNotEmpty()
  @IsBoolean()
  isOffering: boolean;
}
