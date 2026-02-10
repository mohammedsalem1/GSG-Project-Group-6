import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSwapRequestDto {
    @ApiProperty({ description: 'ID of the skill the user offers', example: 'uuid-of-offered-skill' })
    @IsUUID()
    offeredUserSkillId: string;

    @ApiProperty({ description: 'ID of the skill the user wants to receive', example: 'uuid-of-requested-skill' })
    @IsUUID()
    requestedUserSkillId: string;

    @ApiPropertyOptional({ description: 'Optional message to the receiver', example: 'I would like to swap skills with you' })
    @IsOptional()
    @IsString()
    message?: string;
}
