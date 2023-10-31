import { Controller, Get, Query } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

@Controller('geocoding')
@ApiTags('geocoding')
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  @Get('/search/district/by-name')
  @ApiQuery({
    name: 'name',
    description: '검색할 지역 이름',
    type: String,
    example: '성북구',
  })
  @ApiOkResponse({
    description: '검색한 지역 이름에 대한 지역 리스트',
    type: [String],
  })
  async getDistrictListByName(@Query('name') name: string) {
    return await this.geocodingService.searchDistrictByName(name);
  }

  @ApiQuery({
    name: 'geo',
    description: '검색할 지역 위도, 경도',
    type: String,
    example: 'POINT(127.0164 37.4984)',
  })
  @ApiOkResponse({
    description: '검색한 좌표에 대한 지역 리스트',
    type: [String],
  })
  @Get('/search/district/by-geo')
  async getDistrictListByGeo(@Query('geo') geo: string) {
    return await this.geocodingService.searchDistrictByGeo(geo);
  }

  @Get('/search/district/adjacent')
  async getAdjacentDistrictListByName(@Query('name') name: string) {
    return await this.geocodingService.getAdjGeoList(name);
  }
}
