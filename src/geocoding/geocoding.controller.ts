import { Controller, Get, Query } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';

@Controller('geocoding')
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  @Get('/search/district/by-name')
  async getDistrictListByName(@Query('name') name: string) {
    return await this.geocodingService.searchDistrictByName(name);
  }

  @Get('/search/district/by-geo')
  async getDistrictListByGeo(@Query('geo') geo: string) {
    return await this.geocodingService.searchDistrictByGeo(geo);
  }

  @Get('/search/district/adjacent')
  async getAdjacentDistrictListByName(@Query('name') name: string) {
    return await this.geocodingService.getAdjGeoList(name);
  }
}
