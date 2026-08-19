import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;

  const mockDashboardService = {
    getStats: jest.fn().mockResolvedValue({ role: 'admin' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: DashboardService, useValue: mockDashboardService },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates to service with user context', async () => {
    const result = await controller.getStats('u1', 'admin', { from: '2026-08-19' });
    expect(mockDashboardService.getStats).toHaveBeenCalledWith(
      'u1',
      'admin',
      { from: '2026-08-19' },
    );
    expect(result).toEqual({ role: 'admin' });
  });
});