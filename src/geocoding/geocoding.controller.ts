import { Controller, Get, Query } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

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
  @ApiOperation({
    summary: '이름 기반 시군구 검색',
    description: '이름 형식 기반 LIKE 연산, 시군구 리스트 반환',
  })
  async getDistrictListByName(@Query('name') name: string) {
    return await this.geocodingService.searchDistrictByName(name);
  }

  @ApiQuery({
    name: 'geo',
    description: '검색할 지역 위도, 경도',
    type: String,
    example: 'point(127.0164 37.4984)',
  })
  @ApiOperation({
    summary: '좌표 기반 시군구 검색',
    description:
      'Point(경도, 위도) 형식으로 좌표를 입력하면 해당 좌표 주변 시군구 리스트 반환',
  })
  @ApiOkResponse({
    description: '검색한 좌표에 대한 지역 리스트',
    type: [String],
  })
  @Get('/search/district/by-geo')
  async getDistrictListByGeo(@Query('geo') geo: string) {
    return await this.geocodingService.searchDistrictByGeo(geo);
  }

  @ApiOperation({ deprecated: true })
  @Get('/search/district/adjacent')
  async getAdjacentDistrictListByName(@Query('name') name: string) {
    return await this.geocodingService.getAdjGeoList(name);
  }
}
