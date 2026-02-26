import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { PaginationDto } from "src/common/dto/pagination.dto";

export class GetReviewsReceivedDto extends PaginationDto {

  @ApiProperty({
    description: 'Skill ID to filter reviews',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  skillId?: string;
}
