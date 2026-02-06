import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUUID } from "class-validator";
import { PaginationDto } from "src/common/dto/pagination.dto";

export class GetReviewsReceivedDto extends PaginationDto {
  @ApiProperty({
    example: 'uuid-of-skill',
    description: 'Skill ID for which reviews are fetched',
  })
  @IsNotEmpty()
  @IsUUID()
  skillId: string;
}
