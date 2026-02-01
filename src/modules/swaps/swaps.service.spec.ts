import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

jest.mock('@prisma/client', () => ({
  PrismaClient: class {},
  SwapStatus: {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
  },
  NotificationType: {
    SWAP_REQUEST: 'SWAP_REQUEST',
    SWAP_ACCEPTED: 'SWAP_ACCEPTED',
    SWAP_REJECTED: 'SWAP_REJECTED',
    SYSTEM: 'SYSTEM',
  },
}));

import { NotificationType, SwapStatus } from '@prisma/client';
import { SwapsService } from './swaps.service';

describe('SwapsService', () => {
  let service: SwapsService;
  let prisma: {
    userSkill: { findFirst: jest.Mock };
    swapRequest: {
      findFirst: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    notification: { create: jest.Mock };
    handleQueryPagination: jest.Mock;
    formatPaginationResponse: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      userSkill: { findFirst: jest.fn() },
      swapRequest: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      notification: { create: jest.fn() },
      handleQueryPagination: jest.fn(),
      formatPaginationResponse: jest.fn(),
    };

    service = new SwapsService(prisma as any);
  });

  describe('createSwapRequest', () => {
    it('throws if requester tries to send to self', async () => {
      await expect(
        service.createSwapRequest('user-1', {
          receiverId: 'user-1',
          offeredSkillId: 'skill-1',
          requestedSkillId: 'skill-2',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates swap request and notification', async () => {
      prisma.userSkill.findFirst
        .mockResolvedValueOnce({ id: 'offered-skill' })
        .mockResolvedValueOnce({ id: 'requested-skill' });
      prisma.swapRequest.findFirst.mockResolvedValue(null);
      prisma.swapRequest.create.mockResolvedValue({ id: 'swap-1' });
      prisma.notification.create.mockResolvedValue({ id: 'notif-1' });

      const result = await service.createSwapRequest('user-1', {
        receiverId: 'user-2',
        offeredSkillId: 'skill-1',
        requestedSkillId: 'skill-2',
        message: 'Hello',
      });

      expect(result).toEqual({ id: 'swap-1' });
      expect(prisma.swapRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            requesterId: 'user-1',
            receiverId: 'user-2',
            offeredUserSkillId: 'offered-skill',
            requestedUserSkillId: 'requested-skill',
            tracking: { message: 'Hello' },
          }),
        }),
      );
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-2',
            type: NotificationType.SWAP_REQUEST,
          }),
        }),
      );
    });
  });

  describe('getSentRequests', () => {
    it('returns paginated sent requests', async () => {
      prisma.handleQueryPagination.mockReturnValue({ skip: 0, take: 10, page: 1 });
      prisma.swapRequest.findMany.mockResolvedValue([{ id: 'req-1' }]);
      prisma.swapRequest.count.mockResolvedValue(1);
      prisma.formatPaginationResponse.mockReturnValue({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const result = await service.getSentRequests('user-1', {});

      expect(result).toEqual({
        data: [{ id: 'req-1' }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(prisma.swapRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { requesterId: 'user-1' },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('getRequestById', () => {
    it('throws if request not found', async () => {
      prisma.swapRequest.findUnique.mockResolvedValue(null);

      await expect(service.getRequestById('user-1', 'req-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws if user is not part of request', async () => {
      prisma.swapRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        requesterId: 'user-2',
        receiverId: 'user-3',
      });

      await expect(service.getRequestById('user-1', 'req-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('acceptRequest', () => {
    it('accepts pending request as receiver', async () => {
      prisma.swapRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        requesterId: 'user-1',
        receiverId: 'user-2',
        status: SwapStatus.PENDING,
      });
      prisma.swapRequest.update.mockResolvedValue({ id: 'req-1', status: SwapStatus.ACCEPTED });
      prisma.notification.create.mockResolvedValue({ id: 'notif-1' });

      const result = await service.acceptRequest('user-2', 'req-1');

      expect(result).toEqual({ id: 'req-1', status: SwapStatus.ACCEPTED });
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            type: NotificationType.SWAP_ACCEPTED,
          }),
        }),
      );
    });
  });

  describe('rejectRequest', () => {
    it('rejects pending request as receiver', async () => {
      prisma.swapRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        requesterId: 'user-1',
        receiverId: 'user-2',
        status: SwapStatus.PENDING,
      });
      prisma.swapRequest.update.mockResolvedValue({ id: 'req-1', status: SwapStatus.REJECTED });
      prisma.notification.create.mockResolvedValue({ id: 'notif-1' });

      const result = await service.rejectRequest('user-2', 'req-1', 'Busy');

      expect(result).toEqual({ id: 'req-1', status: SwapStatus.REJECTED });
      expect(prisma.swapRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: SwapStatus.REJECTED,
            rejectionReason: 'Busy',
          }),
        }),
      );
    });
  });

  describe('cancelRequest', () => {
    it('cancels pending request as requester', async () => {
      prisma.swapRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        requesterId: 'user-1',
        receiverId: 'user-2',
        status: SwapStatus.PENDING,
      });
      prisma.swapRequest.update.mockResolvedValue({ id: 'req-1', status: SwapStatus.CANCELLED });
      prisma.notification.create.mockResolvedValue({ id: 'notif-1' });

      const result = await service.cancelRequest('user-1', 'req-1');

      expect(result).toEqual({ id: 'req-1', status: SwapStatus.CANCELLED });
      expect(prisma.notification.create).toHaveBeenCalled();
    });

    it('throws if request is not pending or accepted', async () => {
      prisma.swapRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        requesterId: 'user-1',
        receiverId: 'user-2',
        status: SwapStatus.REJECTED,
      });

      await expect(service.cancelRequest('user-1', 'req-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('getStats', () => {
    it('returns acceptance rate stats', async () => {
      prisma.swapRequest.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(2);

      const result = await service.getStats('user-1');

      expect(result).toEqual({
        sentTotal: 3,
        receivedTotal: 2,
        accepted: 4,
        rejected: 2,
        acceptanceRate: 67,
      });
    });
  });

  describe('expirePendingRequests', () => {
    it('marks expired pending requests', async () => {
      prisma.swapRequest.updateMany.mockResolvedValue({ count: 2 });

      await service.expirePendingRequests();

      expect(prisma.swapRequest.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: SwapStatus.PENDING,
            expiresAt: { lt: expect.any(Date) },
          },
          data: { status: SwapStatus.EXPIRED },
        }),
      );
    });
  });
});
