import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { SwapsService } from './swaps.service';
import { CreateSwapRequestDto } from './dto/create-swap.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type{ RequestUser } from 'src/common/types/user.types';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { DeclineSwapRequestDto } from './dto/decline-swap.dto';

@ApiTags('swaps')
@Controller('swaps')
export class SwapsController {
     
    constructor (private readonly swapsService:SwapsService) {}
    
    @Post('requests')
    @ApiNotFoundResponse({ description: 'Requested user skill not found' })
    @ApiOperation({ summary: 'Create swap Request' })
    @ApiCreatedResponse({
      description: 'Create swap Request successfully',
        schema: {
         example: {
           success: true,
           data: {
             swapRequest: {
               id: "13524a22-1624-4303-908b-72617022ff80",
               requesterId: "686d452f-ddf9-4b60-8164-391517bc0fe7",
               receiverId: "395e7a32-7dc0-483b-b264-f6948a31d6b6",
               offeredUserSkillId: "94c37a3f-d6ad-4633-b808-ebb243017348",
               requestedUserSkillId: "d969467d-43dc-40dc-90e1-1a610b2d0dee",
               status: "PENDING",
               rejectionReason: null,
               expiresAt: "2026-02-07T22:10:05.179Z",
               tracking: null,
               createdAt: "2026-01-31T22:10:05.182Z",
               updatedAt: "2026-01-31T22:10:05.182Z"
        }
      }
    }
  }
    })
    @ApiBadRequestResponse({ description:  'Invalid offered skill or same as requested'})
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    async createSwapRequest(
        @Body() createSwapRequestDto:CreateSwapRequestDto,
        @CurrentUser() user: RequestUser,

    ) {
        return this.swapsService.createSwapRequest(createSwapRequestDto , user.id)
    }

    @Get('requests/sent')
    @ApiNotFoundResponse({ description: 'No swapRequest Sent' })
    @ApiOperation({ summary: 'get swap Request sent' })
    @ApiOkResponse({
      description: 'get swap Request sent',
        schema: {
         example: {
           success: true,
           data: [
            {
              id: "13524a22-1624-4303-908b-72617022ff80",
              status: "PENDING",
              requestedUserSkill: {
                 level: "INTERMEDIATE",
                 isOffering: true,
                 user: {
                   id: "395e7a32-7dc0-483b-b264-f6948a31d6b6",
                   userName: "ahmed",
                   image: null,
                   isActive: true
                 },
                 skill: {
                   language: "English",
                   name: "React",
                   isActive: true
                 }
              },
              offeredUserSkill: {
                skill: {
                  id: "faa846ec-df6b-4dad-9671-12221c2928ce",
                  name: "Ui-Ux",
                  language: "English"
            }
          }
        }
      ]
    }
      }
})

    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    async getSwapRequestSent(
        @CurrentUser() user: RequestUser,
        @Query() query:PaginationDto

    ) {
         return this.swapsService.getSwapRequestSent(user.id , query)
    }

    @Get('requests/received')
    @ApiNotFoundResponse({ description: 'No swapRequest received' })
    @ApiOperation({ summary: 'get swap Request received' })
    @ApiOkResponse({
      description: 'get swap Request recived',
        schema: {
         example: {
           success: true,
           data: [
            {
              id: "13524a22-1624-4303-908b-72617022ff80",
              status: "PENDING",
              requestedUserSkill: {
                 level: "INTERMEDIATE",
                 isOffering: true,
                 user: {
                   id: "395e7a32-7dc0-483b-b264-f6948a31d6b6",
                   userName: "ahmed",
                   image: null,
                   isActive: true
                 },
                 skill: {
                   language: "English",
                   name: "React",
                   isActive: true
                 }
              },
              offeredUserSkill: {
                skill: {
                  id: "faa846ec-df6b-4dad-9671-12221c2928ce",
                  name: "Ui-Ux",
                  language: "English"
            }
              },
              pagination: {
                page: 1,
                limit: 10,
                totalCount: 25,
                totalPages: 3
           }
        }
      ]
    }
      }
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    async getSwapRequestReceived(
        @CurrentUser() user: RequestUser,
        @Query() query:PaginationDto
    ) {
         return this.swapsService.getSwapRequestReceived(user.id,query)
    }

     
    @Get('requests/:requestId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get details of a specific swap request' })
    
    @ApiOkResponse({
       description: 'get swap Request received',
       schema: {
          example: {
            success: true,
            data: {
              id: "13524a22-1624-4303-908b-72617022ff80",
              requesterId: "686d452f-ddf9-4b60-8164-391517bc0fe7",
              receiverId: "395e7a32-7dc0-483b-b264-f6948a31d6b6",
              status: "PENDING",
              requester: {
                 id: "686d452f-ddf9-4b60-8164-391517bc0fe7",
                 userName: "ahmed",
                 image: null,
              },
              receiver: {
                id: "395e7a32-7dc0-483b-b264-f6948a31d6b6",
                userName: "mohammed",
                image: null,
             },
               offeredUserSkill: {
                 skill: {
                    id: "faa846ec-df6b-4dad-9671-12221c2928ce",
                    name: "UI-UX",
                    language: "English",
          },
        },
              requestedUserSkill: {
                 skill: {
                     id: "c743cdc1-0fee-4ba4-9a25-88089a24004b",
                     name: "React",
                    language: "English",
                },
        },
      },
    },
  },
    })
    @ApiParam({
       name: 'requestId',
       description: 'Swap request id',
       example: '13524a22-1624-4303-908b-72617022ff80',
     })
    @ApiNotFoundResponse({description: 'Swap request not found'})
    @ApiForbiddenResponse({ description: 'User not authorized to view this swap request'})
    async getRequestByRequestId(
        @CurrentUser() user: RequestUser,
        @Param('requestId') requestId: string,
    ) {
        return this.swapsService.getRequestByRequestId(requestId, user.id )
    }

    @Patch('requests/:requestId/accept')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiParam({
      name: 'requestId',
      description: 'Swap request id',
      example: '13524a22-1624-4303-908b-72617022ff80',
    })
    @ApiOkResponse({
      description: 'Swap request accepted successfully',
      schema: {
        example: {
          success: true,
          data: {
            id: "13524a22-1624-4303-908b-72617022ff80",
            requesterId: "686d452f-ddf9-4b60-8164-391517bc0fe7",
            receiverId: "395e7a32-7dc0-483b-b264-f6948a31d6b6",
            status: "ACCEPTED",
            requester: { id: "...", userName: "ali", image: null },
            receiver: { id: "...", userName: "ahmed", image: null },
            offeredUserSkill: { skill: { id: "...", name: "UI-UX", language: "English" } },
            requestedUserSkill: { skill: { id: "...", name: "React", language: "English" } },
          },
        },
      },
    })
    @ApiOperation({ summary: 'Accept a pending swap request' })
    @ApiNotFoundResponse({ description: 'Swap request not found' })
    @ApiForbiddenResponse({ description: 'User not authorized to accept this request' })
    @ApiBadRequestResponse({ description: 'Swap request is not pending' })
    async acceptSwapRequest(
      @CurrentUser() user: RequestUser,
      @Param('requestId') requestId: string,
    ) {
      return this.swapsService.acceptSwapRequest(requestId, user.id);
    }

    /// cancel swap Request
    @Patch('requests/:requestId/cancel')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Cancel a pending swap request (by requester)' })
    @ApiParam({
      name: 'requestId',
      description: 'Swap request id',
      example: '13524a22-1624-4303-908b-72617022ff80',
    })
    @ApiOkResponse({
      description: 'Swap request canceled successfully',
      schema: {
        example: {
          success: true,
          data: {
            id: "13524a22-1624-4303-908b-72617022ff80",
            requesterId: "686d452f-ddf9-4b60-8164-391517bc0fe7",
            receiverId: "395e7a32-7dc0-483b-b264-f6948a31d6b6",
            status: "CANCELLED",
            requester: { id: "...", userName: "ali", image: null },
            receiver: { id: "...", userName: "ahmed", image: null },
            offeredUserSkill: { skill: { id: "...", name: "UI-UX", language: "English" } },
            requestedUserSkill: { skill: { id: "...", name: "React", language: "English" } },
          },
        },
      },
    })
    @ApiNotFoundResponse({ description: 'Swap request not found' })
    @ApiForbiddenResponse({ description: 'User not authorized to accept this request' })
    @ApiBadRequestResponse({ description: 'Swap request is not pending' })
    async cancelSwapRequest(
      @CurrentUser() user: RequestUser,
      @Param('requestId') requestId: string,
    ) {
      return this.swapsService.cancelSwapRequest(requestId, user.id);
    }
    //decline

     /// cancel swap Request
    @Patch('requests/:requestId/decline')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Decline a swap request (by receiver) optionally with reason' })
    @ApiParam({
      name: 'requestId',
      description: 'Swap request id',
      example: '13524a22-1624-4303-908b-72617022ff80',
    })
    @ApiOkResponse({
      description: 'Swap request accepted successfully',
      schema: {
        example: {
          success: true,
          data: {
            id: "13524a22-1624-4303-908b-72617022ff80",
            requesterId: "686d452f-ddf9-4b60-8164-391517bc0fe7",
            receiverId: "395e7a32-7dc0-483b-b264-f6948a31d6b6",
            status: "CANCELLED",
            requester: { id: "...", userName: "ali", image: null },
            receiver: { id: "...", userName: "ahmed", image: null },
            offeredUserSkill: { skill: { id: "...", name: "UI-UX", language: "English" } },
            requestedUserSkill: { skill: { id: "...", name: "React", language: "English" } },
          },
        },
      },
    })
    @ApiNotFoundResponse({ description: 'Swap request not found' })
    @ApiForbiddenResponse({ description: 'User not authorized to accept this request' })
    @ApiBadRequestResponse({ description: 'Swap request is not pending' })
    async declineSwapRequest(
      @CurrentUser() user: RequestUser,
      @Param('requestId') requestId: string,
      @Body() dto:DeclineSwapRequestDto
    ) {
      return this.swapsService.declineSwapRequest(requestId, user.id , dto.reason);
    }
    /// Get Request Statistics
    @Get('stats')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get statistics of swap requests for current user' })
    @ApiBearerAuth('JWT-auth')
    @ApiOkResponse({ description: 'Get user swap request statistics',
        schema: {
          example: {
            success: true,
            data: {
              totalSwap: 10,
              swapRequestSent: 6,
              swapRequestReceived: 4
            }
          }
      }
})
    async getRequestStatistics(
         @CurrentUser() user: RequestUser,
    ) {
       return this.swapsService.getRequestStatistics(user.id)
    }
}
