import { Test, TestingModule } from '@nestjs/testing';
import { BlurtingController } from './blurting.controller';

describe('BlurtingController', () => {
  let controller: BlurtingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlurtingController],
    }).compile();

    controller = module.get<BlurtingController>(BlurtingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
