import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { IncidentsService } from './incidents.service';
import { ActivityService } from '../activity/activity.service';

describe('IncidentsService', () => {
  let service: IncidentsService;

  const mockIncidentModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockCaseModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentsService,
        {
          provide: getModelToken('Incident'),
          useValue: mockIncidentModel,
        },
        {
          provide: getModelToken('EmergencyCase'),
          useValue: mockCaseModel,
        },
        { provide: ActivityService, useValue: { record: jest.fn() } },
      ],
    }).compile();

    service = module.get<IncidentsService>(IncidentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw NotFoundException when case missing on create', async () => {
    mockCaseModel.findById.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(null),
    });
    await expect(
      service.create({ case_id: '64b5f0000000000000000000' }, 'actor'),
    ).rejects.toThrow('not found');
  });

  it('should throw NotFoundException when incident missing on update', async () => {
    mockIncidentModel.findByIdAndUpdate.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(null),
    });
    await expect(
      service.update('bad-id', { severity_level: 'high' }, 'actor'),
    ).rejects.toThrow('not found');
  });
});
