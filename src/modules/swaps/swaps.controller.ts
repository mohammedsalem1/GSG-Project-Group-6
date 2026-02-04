import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestUser } from 'src/common/types/user.types';
import { SwapsService } from './swaps.service';
import {
  CreateSwapRequestDto,
  RejectSwapRequestDto,
  SwapRequestsQueryDto,
} from './dto/swaps.dto';

const swapRequestExample = {
  success: true,
  data: {
    id: '3b6f1d2e-1111-4b2c-9c2f-1a2b3c4d5e6f',
    requesterId: '7a8b9c0d-2222-4e3f-8a1b-2c3d4e5f6a7b',
    receiverId: '9c0d1e2f-3333-4f5a-9b1c-3d4e5f6a7b8c',
    offeredUserSkillId: '1e2f3a4b-4444-4a5b-9c1d-4e5f6a7b8c9d',
    requestedUserSkillId: '2f3a4b5c-5555-4b6c-9d1e-5f6a7b8c9d0e',
    status: 'PENDING',
    rejectionReason: null,
    expiresAt: '2026-02-07T00:00:00.000Z',
    tracking: { message: 'Hi, I can teach React in exchange for UI/UX.' },
    createdAt: '2026-01-31T00:00:00.000Z',
    updatedAt: '2026-01-31T00:00:00.000Z',
  },
};

const swapRequestListExample = {
  success: true,
  data: {
    data: [
      {
        id: '3b6f1d2e-1111-4b2c-9c2f-1a2b3c4d5e6f',
        status: 'PENDING',
        rejectionReason: null,
        expiresAt: '2026-02-07T00:00:00.000Z',
        createdAt: '2026-01-31T00:00:00.000Z',
        receiver: {
          id: '9c0d1e2f-3333-4f5a-9b1c-3d4e5f6a7b8c',
          userName: 'sara',
          image: null,
        },
        offeredUserSkill: {
          skill: {
            id: '8c7b6a5d-1234-4d3e-8f9a-0b1c2d3e4f5a',
            name: 'React',
            description: 'Frontend library',
            category: { id: 'cat-1111-2222-3333-4444', name: 'Web' },
          },
        },
        requestedUserSkill: {
          skill: {
            id: '7b6a5d4c-2345-4e3f-9a0b-1c2d3e4f5a6b',
            name: 'UI/UX',
            description: 'Design skills',
            category: { id: 'cat-5555-6666-7777-8888', name: 'Design' },
          },
        },
      },
    ],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
};

const swapRequestDetailsExample = {
  success: true,
  data: {
    id: '3b6f1d2e-1111-4b2c-9c2f-1a2b3c4d5e6f',
    status: 'PENDING',
    rejectionReason: null,
    expiresAt: '2026-02-07T00:00:00.000Z',
    createdAt: '2026-01-31T00:00:00.000Z',
    requester: {
      id: '7a8b9c0d-2222-4e3f-8a1b-2c3d4e5f6a7b',
      userName: 'mohammed',
      image: null,
    },
    receiver: {
      id: '9c0d1e2f-3333-4f5a-9b1c-3d4e5f6a7b8c',
      userName: 'sara',
      image: null,
    },
    offeredUserSkill: {
      skill: {
        id: '8c7b6a5d-1234-4d3e-8f9a-0b1c2d3e4f5a',
        name: 'React',
        description: 'Frontend library',
        category: { id: 'cat-1111-2222-3333-4444', name: 'Web' },
      },
    },
    requestedUserSkill: {
      skill: {
        id: '7b6a5d4c-2345-4e3f-9a0b-1c2d3e4f5a6b',
        name: 'UI/UX',
        description: 'Design skills',
        category: { id: 'cat-5555-6666-7777-8888', name: 'Design' },
      },
    },
    conversation: { id: 'conv-1111-2222-3333-4444', isArchived: false },
    session: {
      id: 'sess-1111-2222-3333-4444',
      status: 'SCHEDULED',
      scheduledAt: '2026-02-02T14:00:00.000Z',
    },
  },
};

const swapStatsExample = {
  success: true,
  data: {
    sentTotal: 3,
    receivedTotal: 2,
    accepted: 1,
    rejected: 1,
    acceptanceRate: 50,
  },
};

@ApiTags('swaps')
@Controller('swaps')
export class SwapsController {
  constructor(private readonly swapsService: SwapsService) { }

  @Post('requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create swap request' })
  @ApiCreatedResponse({
    description: 'Swap request created successfully',
    schema: { example: swapRequestExample },
  })
  @ApiBadRequestResponse({ description: 'Invalid swap request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async createSwapRequest(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateSwapRequestDto,
  ) {
    return this.swapsService.createSwapRequest(user.id, dto);
  }

  @Get('requests/sent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user sent swap requests' })
  @ApiOkResponse({
    description: 'Sent swap requests fetched successfully',
    schema: { example: swapRequestListExample },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getSentRequests(
    @CurrentUser() user: RequestUser,
    @Query() query: SwapRequestsQueryDto,
  ) {
    return this.swapsService.getSentRequests(user.id, query);
  }

  @Get('requests/received')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user received swap requests' })
  @ApiOkResponse({
    description: 'Received swap requests fetched successfully',
    schema: { example: swapRequestListExample },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getReceivedRequests(
    @CurrentUser() user: RequestUser,
    @Query() query: SwapRequestsQueryDto,
  ) {
    return this.swapsService.getReceivedRequests(user.id, query);
  }

  @Get('requests/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get swap request by id' })
  @ApiParam({ name: 'id', description: 'Swap request id' })
  @ApiOkResponse({
    description: 'Swap request fetched successfully',
    schema: { example: swapRequestDetailsExample },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Swap request not found' })
  @ApiForbiddenResponse({ description: 'You are not allowed to access this request' })
  async getRequestById(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.swapsService.getRequestById(user.id, id);
  }

  @Patch('requests/:id/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Accept swap request' })
  @ApiParam({ name: 'id', description: 'Swap request id' })
  @ApiOkResponse({
    description: 'Swap request accepted successfully',
    schema: { example: swapRequestExample },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Swap request not found' })
  @ApiForbiddenResponse({ description: 'Only the receiver can accept this request' })
  @ApiBadRequestResponse({ description: 'Only pending requests can be accepted' })
  async acceptRequest(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.swapsService.acceptRequest(user.id, id);
  }

  @Patch('requests/:id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reject swap request' })
  @ApiParam({ name: 'id', description: 'Swap request id' })
  @ApiOkResponse({
    description: 'Swap request rejected successfully',
    schema: { example: swapRequestExample },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Swap request not found' })
  @ApiForbiddenResponse({ description: 'Only the receiver can reject this request' })
  @ApiBadRequestResponse({ description: 'Only pending requests can be rejected' })
  async rejectRequest(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: RejectSwapRequestDto,
  ) {
    return this.swapsService.rejectRequest(user.id, id, dto?.reason);
  }

  @Patch('requests/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel swap request' })
  @ApiParam({ name: 'id', description: 'Swap request id' })
  @ApiOkResponse({
    description: 'Swap request cancelled successfully',
    schema: { example: swapRequestExample },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Swap request not found' })
  @ApiForbiddenResponse({ description: 'Only the requester can cancel this request' })
  @ApiBadRequestResponse({ description: 'Only pending or accepted requests can be cancelled' })
  async cancelRequest(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.swapsService.cancelRequest(user.id, id);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get swap request statistics' })
  @ApiOkResponse({
    description: 'Swap statistics fetched successfully',
    schema: { example: swapStatsExample },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getStats(@CurrentUser() user: RequestUser) {
    return this.swapsService.getStats(user.id);
  }
}
