import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ValidationDocs } from 'src/decorators/swagger/validation.decorator';
import { AccessGuard } from '../auth/guard/access.guard';
import { ValidationService } from './validation.service';

@Controller('validation')
@ApiTags('validation')
export class ValidationController {
  constructor(private readonly validationService: ValidationService) {}

  @Get('/purchase/:productId/:token')
  @UseGuards(AccessGuard)
  @ValidationDocs('purchaseValidation')
  async purchaseValidation(
    @Param('productId') productId: string,
    @Param('token') token: string,
  ) {
    this.validationService.validatePurchase(productId, token);
  }

  @Get('/admob')
  @ValidationDocs('admobValidation')
  async admobValidation(@Req() req: Request) {
    this.validationService.validateAdMob(req.url);
  }

  @Get('/apple/:transactionId')
  @UseGuards(AccessGuard)
  @ValidationDocs('appleValidation')
  async appleValidation(@Param('transactionId') transactionId: string) {
    return await this.validationService.takePointFromTransaction(transactionId);
  }
}
