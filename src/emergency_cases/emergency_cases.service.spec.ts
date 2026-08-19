import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EmergencyCasesService } from './emergency_cases.service';
import { ActivityService } from '../activity/activity.service';

describe('EmergencyCasesService', () => {
  let service: EmergencyCasesService;

  const mockCaseModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    aggregate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmergencyCasesService,
        {
          provide: getModelToken('EmergencyCase'),
          useValue: mockCaseModel,
        },
        { provide: ActivityService, useValue: { record: jest.fn() } },
      ],
    }).compile();

    service = module.get<EmergencyCasesService>(EmergencyCasesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
