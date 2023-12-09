import { Injectable } from '@nestjs/common';
import axios from 'axios';
@Injectable()
export class GeocodingService {
  async queryVworldAPI(page: number = 1, geo?: string, name?: string) {
    try {
      const URL = 'https://api.vworld.kr/req/data';
      const key = process.env.VWORLD_API_KEY;
      const domain = process.env.VWORLD_DOMAIN;

      const operation = 'GetFeature';

      const size = 10;

      const buffer = 20000;

      const requestURL =
        URL +
        '?' +
        `key=${key}` +
        `&domain=${domain}` +
        `&size=${size}` +
        `&request=${operation}` +
        (geo ? `&buffer=${buffer}` : '') +
        `&page=${page}` +
        '&data=LT_C_ADSIGG_INFO' +
        (geo ? `&geomFilter=${geo}` : '') +
        (name ? `&attrFilter=sig_kor_nm:like:${name}` : '') +
        '&geometry=false';

      const response = await axios.get(requestURL);
      return response.data.response;
    } catch (err) {
      //TODO: error alram..
      console.log(err);
    }
  }

  async searchDistrictByName(name: string, page: number = 1) {
    const data = await this.queryVworldAPI(page, undefined, name);
    if (data.status === 'NOT_FOUND' || data.result == undefined) return [];
    return data.result.featureCollection.features.map(
      (feat) => feat.properties.full_nm,
    );
  }

  async searchDistrictByGeo(geo: string, page: number = 1) {
    const data = await this.queryVworldAPI(page, geo);
    console.log(data);
    if (!data.result) return [];
    return data.result.featureCollection.features.map(
      (feat) => feat.properties.full_nm,
    );
  }

  async searchOneDistrictByName(name: string) {
    try {
      const URL = 'https://api.vworld.kr/req/data';
      const key = process.env.VWORLD_API_KEY;
      const domain = process.env.VWORLD_DOMAIN;

      const operation = 'GetFeature';

      const size = 1;

      const requestURL =
        URL +
        '?' +
        `key=${key}` +
        `&domain=${domain}` +
        `&size=${size}` +
        `&request=${operation}` +
        '&data=LT_C_ADSIGG_INFO' +
        `&attrFilter=sig_kor_nm:like:${name}`;

      const response = await axios.get(requestURL);
      return response.data.response;
    } catch (err) {
      //TODO: error alram..
      console.log(err);
    }
  }

  async getAdjGeoList(sigungu: string) {
    try {
      console.log(process.env.VWORLD_API_KEY);
      const district = await this.searchOneDistrictByName(sigungu);
      console.log(district);
      if (district.status === 'NOT_FOUND') return [];

      const geo = `POINT(${district.result.featureCollection.features[0].geometry.coordinates[0][0][0][0]} ${district.result.featureCollection.features[0].geometry.coordinates[0][0][0][1]})`;
      return await this.searchDistrictByGeo(geo);
    } catch (err) {
      //TODO: error alram..
      console.log(err);
    }
  }
}
