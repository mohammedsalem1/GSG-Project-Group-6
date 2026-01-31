import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { PaginationDto } from "src/common/dto/pagination.dto";

export class GetReviewsReceivedDto extends PaginationDto {
    @ApiProperty({
        example: 'uuid-of-user-skill',
        description: 'ID of the user skill for which reviews are fetched',
    })
    @IsNotEmpty({ message: 'User Skill ID is required' })
    @IsString()
    userSkillId:string
}