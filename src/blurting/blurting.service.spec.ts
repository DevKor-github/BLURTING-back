import { Test, TestingModule } from '@nestjs/testing';
import { BlurtingService } from './blurting.service';

describe('BlurtingService', () => {
  let service: BlurtingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlurtingService],
    }).compile();

    service = module.get<BlurtingService>(BlurtingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
