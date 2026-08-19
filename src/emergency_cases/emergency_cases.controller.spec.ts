import { Test, TestingModule } from '@nestjs/testing';
import { EmergencyCasesController } from './emergency_cases.controller';
import { EmergencyCasesService } from './emergency_cases.service';

describe('EmergencyCasesController', () => {
  let controller: EmergencyCasesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmergencyCasesController],
      providers: [{ provide: EmergencyCasesService, useValue: {} }],
    }).compile();

    controller = module.get<EmergencyCasesController>(EmergencyCasesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
