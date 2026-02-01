import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateSwapRequestDto } from './dto/create-swap.dto';
import { PrismaService } from 'src/database/prisma.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SwapStatus } from '@prisma/client';

@Injectable()
export class SwapsService {

    constructor(
        private readonly prismaService:PrismaService
    ) {}  
    async createSwapRequest(createSwapRequestDto:CreateSwapRequestDto, requesterId:string) {
        // cheak requestedUserSkillId 
        const requestedUserSkill = await this.prismaService.userSkill.findUnique({
            where:{id:createSwapRequestDto.requestedUserSkillId},
            select:{user:{select:{id:true}}}
        }) 
        if (!requestedUserSkill) {
            throw new NotFoundException('requested Skill not found')
        }

        if (requestedUserSkill.user.id == requesterId) {
            throw new BadRequestException('You cannot request your own skill');
        }
        const receiverId = requestedUserSkill.user.id;

        const offeredUserSkill = await this.prismaService.userSkill.findUnique({
            where:{id:createSwapRequestDto.offeredUserSkillId},
            select:{user:{select:{id:true}}}
        })

        if(!offeredUserSkill || offeredUserSkill.user.id !== requesterId) {
            throw new BadRequestException('Invalid offered skill');
        }

        const existingSwapRequest = await this.prismaService.swapRequest.findFirst({
           where:{
              requesterId,
              offeredUserSkillId: createSwapRequestDto.offeredUserSkillId,
              requestedUserSkillId: createSwapRequestDto.requestedUserSkillId,
              status: 'PENDING',
           }
      });
         if (existingSwapRequest) throw new BadRequestException('You already have a pending swap request');
        
        
        return this.prismaService.swapRequest.create({
            data:{
                receiverId,
                requesterId,
                offeredUserSkillId:createSwapRequestDto.offeredUserSkillId,
                requestedUserSkillId:createSwapRequestDto.requestedUserSkillId,
                expiresAt:  new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
                // add message in schema prisma
                // message: message || null, 
            }
        })
    }

    async getSwapRequestSent(requesterId:string , query:PaginationDto) {
        const pagination = this.prismaService.handleQueryPagination({
          page: query.page,
          limit: query.limit,
        });

        const { page, ...removePage } = pagination;
        const swapRequestSent = await this.prismaService.swapRequest.findMany({
            ...removePage,
            where:{requesterId , expiresAt: { gt: new Date() }
},
            select: {
                id:true,
                status:true,
                requestedUserSkill:{
                    select:{
                        level:true,
                        isOffering:true,
                        user:{
                            select:{
                                id:true,
                                userName:true,
                                image:true,
                                isActive:true
                            }
                        },
                        skill:{
                            select:{
                                language:true,
                                name:true,
                                isActive:true,
                                
                            }
                        }

                    }
                },
                offeredUserSkill:{
                    select:{
                        skill:{
                            select:{
                                id:true,
                                name:true,
                                language:true,
                                
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }

            })
              const count =  await this.prismaService.swapRequest.count({where:{requesterId ,   expiresAt: { gt: new Date() }}})

            return {
                swapRequestSent,
                ...this.prismaService.formatPaginationResponse({
              page,
              count,
              limit: pagination.take,
            }),}
    }

    async getSwapRequestReceived(receiverId:string , query:PaginationDto) {
        const pagination = this.prismaService.handleQueryPagination({
          page: query.page,
          limit: query.limit,
        });

        const { page, ...removePage } = pagination;
        const swapRequests  = await this.prismaService.swapRequest.findMany({
            ...removePage,
            where:{receiverId ,   expiresAt: { gt: new Date() }},
            select: {
                id:true,
                status:true,
                offeredUserSkill:{
                    select:{
                        level:true,
                        isOffering:true,
                        user:{
                            select:{
                                id:true,
                                userName:true,
                                image:true,
                                isActive:true
                            }
                        },
                        skill:{
                            select:{
                                language:true,
                                name:true,
                                isActive:true,
                                
                            }
                        }

                    }
                },
                requestedUserSkill:{
                    select:{
                        skill:{
                            select:{
                                id:true,
                                name:true,
                                language:true,
                                
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }

        })
        const count =  await this.prismaService.swapRequest.count({where:{receiverId ,   expiresAt: { gt: new Date() }}})

        return {
            swapRequests,
            pagination:{ ...this.prismaService.formatPaginationResponse({
              page,
              count,
              limit: pagination.take,
            }),
          }};

        }
    
    
    async getRequestByRequestId(swapRequestId:string , userId:string) {
      
  const swapRequest = await this.prismaService.swapRequest.findUnique({
    where: { id: swapRequestId },
    include: {
      requester: { select: { id: true, userName: true, image: true } },
      receiver: { select: { id: true, userName: true, image: true } },
      offeredUserSkill: { include: { skill: { select: { id: true, name: true, language: true } } } },
      requestedUserSkill: { include: { skill: { select: { id: true, name: true, language: true } } } },
    },
  });


        if (!swapRequest) {
              throw new NotFoundException('Swap request not found');
            }
        if ( swapRequest.requesterId !== userId &&  swapRequest.receiverId !== userId ) {
              throw new ForbiddenException('You are not authorized to view this swap request');
           }


         return swapRequest
      }
      /// make notifications
    async acceptSwapRequest(swapRequestId: string, userId: string) {
        const swapRequest = await this.prismaService.swapRequest.findUnique({
            where: { id: swapRequestId }});

        if (!swapRequest) {
            throw new NotFoundException('Swap request not found');
        }

        if (swapRequest.receiverId !== userId) {
            throw new ForbiddenException('You are not authorized to accept this request');
        }

        if (swapRequest.status !==  SwapStatus.PENDING) {
            throw new BadRequestException('Swap request is not pending');
        }

        const updatedRequest = await this.prismaService.swapRequest.update({
            where: { id: swapRequestId },
            data: { status: SwapStatus.ACCEPTED },
            include: {
            requester: { select: { id: true, userName: true, image: true } },
            receiver: { select: { id: true, userName: true, image: true } },
            offeredUserSkill: { include: { skill: { select: { id: true, name: true, language: true } } } },
            requestedUserSkill: { include: { skill: { select: { id: true, name: true, language: true } } } },
            },
        });


        return  updatedRequest ;
     }
     /// make notifications
     async  cancelSwapRequest(swapRequestId: string, userId: string) {
        const swapRequest = await this.prismaService.swapRequest.findUnique({where: { id: swapRequestId }});

        if (!swapRequest) {
            throw new NotFoundException('Swap request not found');
        }
        if (swapRequest.requesterId !== userId) {
            throw new ForbiddenException('You are not authorized to cancel this request');
        }
        if (swapRequest.status !== SwapStatus.PENDING) {
            throw new BadRequestException('Only pending requests can be cancelled');
        }
        const updatedRequest = await this.prismaService.swapRequest.update({
            where: { id: swapRequestId },
            data: { status: SwapStatus.CANCELLED },
            include: {
            requester: { select: { id: true, userName: true, image: true } },
            receiver: { select: { id: true, userName: true, image: true } },
            offeredUserSkill: { include: { skill: { select: { id: true, name: true, language: true } } } },
            requestedUserSkill: { include: { skill: { select: { id: true, name: true, language: true } } } },
            },
        });


        return  updatedRequest ;
     }
      
     async declineSwapRequest(swapRequestId: string, userId: string , reason?:string) {
          const swapRequest = await this.prismaService.swapRequest.findUnique({ where: { id: swapRequestId }});

        if (!swapRequest) {
            throw new NotFoundException('Swap request not found');
        }
        if (swapRequest.receiverId !== userId) {
            throw new ForbiddenException('You are not authorized to decline this request');
        }
        if (swapRequest.status !== SwapStatus.PENDING) {
            throw new BadRequestException('Only pending requests can be cancelled');
        }
        const updatedRequest = await this.prismaService.swapRequest.update({
            where: { id: swapRequestId },
            data: { status: SwapStatus.REJECTED , rejectionReason:reason?? null },
            include: {
            requester: { select: { id: true, userName: true, image: true } },
            receiver: { select: { id: true, userName: true, image: true } },
            offeredUserSkill: { include: { skill: { select: { id: true, name: true, language: true } } } },
            requestedUserSkill: { include: { skill: { select: { id: true, name: true, language: true } } } },
            },
        });


        return  updatedRequest ;
     }
      async getRequestStatistics(userId: string) {
        const now = new Date();

        const [sent, received] = await Promise.all([
            this.prismaService.swapRequest.count({
            where: {
                requesterId: userId,
                expiresAt: { gt: now },
            },
            }),
            this.prismaService.swapRequest.count({
            where: {
                receiverId: userId,
                expiresAt: { gt: now }, 
            },
            }),
        ]);

        return {
            totalSwap: sent + received,
            swapRequestSent: sent,
            swapRequestReceived: received,
        };
      }
}

