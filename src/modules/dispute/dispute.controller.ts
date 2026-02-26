/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { DisputeService } from './dispute.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from 'src/common/types/user.types';
import { CreateDisputeDto, GetDisputesQueryDto } from './dto';

@ApiTags('disputes')
@Controller('disputes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new dispute / report an issue' })
  @ApiCreatedResponse({
    description: 'Dispute submitted successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'dispute-id',
          type: 'SESSION_ISSUE',
          description: 'The session was cancelled without notice',
          screenshot: 'https://ik.imagekit.io/...',
          status: 'PENDING',
          createdAt: '2026-02-26T00:00:00.000Z',
          session: {
            id: 'session-id',
            title: 'JavaScript Session',
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid input or duplicate dispute' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async createDispute(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateDisputeDto,
  ) {
    return this.disputeService.createDispute(user.id, dto);
  }

  @Post('screenshot')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload screenshot for dispute (optional)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Screenshot image (JPEG, PNG - Max 5MB)',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Screenshot uploaded successfully',
    schema: {
      example: {
        success: true,
        data: {
          url: 'https://ik.imagekit.io/.../disputes/screenshot.jpg',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid file type or size' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async uploadScreenshot(
    @CurrentUser() user: RequestUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.disputeService.uploadScreenshot(user.id, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get my disputes' })
  @ApiOkResponse({
    description: 'Disputes retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          disputes: [
            {
              id: 'dispute-id',
              type: 'POINTS_ISSUE',
              description: 'Points were not credited after session',
              status: 'PENDING',
              adminNotes: null,
              createdAt: '2026-02-26T00:00:00.000Z',
              session: null,
            },
          ],
          pagination: {
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getMyDisputes(
    @CurrentUser() user: RequestUser,
    @Query() query: GetDisputesQueryDto,
  ) {
    return this.disputeService.getMyDisputes(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dispute details by ID' })
  @ApiOkResponse({ description: 'Dispute retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Dispute not found' })
  @ApiForbiddenResponse({ description: 'Not authorized to view this dispute' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getDisputeById(
    @CurrentUser() user: RequestUser,
    @Param('id') disputeId: string,
  ) {
    return this.disputeService.getDisputeById(user.id, disputeId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a pending dispute' })
  @ApiOkResponse({
    description: 'Dispute cancelled successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'dispute-id',
          status: 'REJECTED',
          updatedAt: '2026-02-26T01:00:00.000Z',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Dispute not found' })
  @ApiBadRequestResponse({
    description: 'Only pending disputes can be cancelled',
  })
  @ApiForbiddenResponse({
    description: 'Not authorized to cancel this dispute',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async cancelDispute(
    @CurrentUser() user: RequestUser,
    @Param('id') disputeId: string,
  ) {
    return this.disputeService.cancelDispute(user.id, disputeId);
  }
}
