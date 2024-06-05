import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('validation')
@ApiTags('validation')
export class ValidationController {
  constructor() {}

  @Get('/purchase/:productId/:token')
  async purchaseValidation() {
    return 'purchaseValidation';
  }
}
