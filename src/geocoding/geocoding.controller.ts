import { Controller, Get, Query } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { geocodingDocs } from 'src/decorators/swagger/auth.decorator';

@Controller('geocoding')
@ApiTags('geocoding')
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  @Get('/search/district/by-name')
  @geocodingDocs('name')
  async getDistrictListByName(@Query('name') name: string) {
    return await this.geocodingService.searchDistrictByName(name);
  }

  @Get('/search/district/by-geo')
  @geocodingDocs('geo')
  async getDistrictListByGeo(@Query('geo') geo: string) {
    return await this.geocodingService.searchDistrictByGeo(geo);
  }

  @ApiOperation({ deprecated: true })
  @Get('/search/district/adjacent')
  async getAdjacentDistrictListByName(@Query('name') name: string) {
    return await this.geocodingService.getAdjGeoList(name);
  }
}
