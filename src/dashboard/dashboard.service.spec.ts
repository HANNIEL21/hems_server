import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;

  const mockCaseModel = { aggregate: jest.fn() };
  const mockIncidentModel = { aggregate: jest.fn() };
  const mockUserModel = { aggregate: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getModelToken('EmergencyCase'), useValue: mockCaseModel },
        { provide: getModelToken('Incident'), useValue: mockIncidentModel },
        { provide: getModelToken('User'), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  const USER_ID = '64b5f0000000000000000001';

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns admin stats for admin role', async () => {
    mockCaseModel.aggregate.mockResolvedValue([
      {
        total: [{ count: 5 }],
        byStatus: [{ _id: 'pending', count: 2 }],
        byType: [{ _id: 'medical', count: 5 }],
      },
    ]);
    mockIncidentModel.aggregate.mockResolvedValue([
      {
        total: [{ count: 3 }],
        bySeverity: [{ _id: 'high', count: 1 }],
        resolved: [{ count: 1 }],
      },
    ]);
    mockUserModel.aggregate.mockResolvedValue([
      {
        onDuty: [{ count: 10 }],
        byRole: [{ _id: 'staff', count: 4 }],
      },
    ]);

    const result = await service.getStats(USER_ID, 'admin', {});
    expect(result.role).toBe('admin');
    expect(result.totalCases).toBe(5);
    expect(result.openCases).toBe(2);
    expect(result.activeIncidents).toBe(2);
  });

  it('returns user stats for user role', async () => {
    mockCaseModel.aggregate.mockResolvedValue([
      {
        total: [{ count: 7 }],
        byStatus: [{ _id: 'resolved', count: 3 }],
      },
    ]);

    const result = await service.getStats(USER_ID, 'user', {});
    expect(result.role).toBe('user');
    expect(result.totalReports).toBe(7);
    expect(result.resolved).toBe(3);
  });
});