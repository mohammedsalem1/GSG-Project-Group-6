/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, IsNotEmpty } from 'class-validator';

export class UpdateProfileImageDto {
  @ApiProperty({
    example: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/users/profile.jpg',
    description: 'Cloudinary image URL',
  })
  @IsNotEmpty({ message: 'Image URL is required' })
  @IsString()
  @IsUrl({}, { message: 'Please provide a valid URL' })
  imageUrl: string;
}
