import { ApiProperty } from '@nestjs/swagger';

export class LockedBadgeDto {
  @ApiProperty({
    example: 'Pro',
    description: 'Badge name',
  })
  name: string;

  @ApiProperty({
    example: 'pro.png',
    description: 'Badge icon URL or filename',
  })
  icon: string;

  @ApiProperty({
    example: 70,
    description: 'Progress percentage toward unlocking the badge',
  })
  progress: string;

  @ApiProperty({
    example: 3,
    description: 'Remaining sessions needed to unlock this badge',
  })
  remainingSessions: number;
}
export class EarnedBadgeDto {

@ApiProperty({
    example: 'Starter',
    description: 'Badge name',
})
  name: string;

@ApiProperty({
    example: 'starter.png',
    description: 'Badge icon URL or filename',
})
  icon: string;
  
@ApiProperty({
    example: 'requirment',
    description: 'Badge requirment',
  })
  requirement: string;

@ApiProperty({
    example: '2026-02-20T10:30:00.000Z',
    description: 'Date and time when badge was earned',
  })
  unlockedAt: Date;
}