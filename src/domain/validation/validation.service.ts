import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import crypto from 'crypto';
import queryString from 'query-string';
import { ProductPurchase } from 'src/interfaces/productPurchase';

@Injectable()
export class ValidationService {
  constructor() {}

  private GOOGLE_AD_KEY_URL =
    'https://gstatic.com/admob/reward/verifier-keys.json';

  async validatePurchase(productId: string, token: string) {
    const productPurchaseResponse = await axios.get(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.Blurting.blurting/purchases/products/${productId}/tokens/${token}`,
    );
    const productPurchase: ProductPurchase = productPurchaseResponse.data;
    if (productPurchase.purchaseState === 1) {
      throw new BadRequestException('취소된 구매입니다.');
    }
    if (productPurchase.purchaseState === 2) {
      throw new BadRequestException('대기중인 구매입니다.');
    }

    if (productPurchase.consumptionState === 0) {
      throw new BadRequestException('이미 소비된 구매입니다.');
    }

    try {
      await axios.post(
        `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.Blurting.blurting/purchases/products/${productId}/tokens/${token}:consume`,
      );
    } catch (err) {
      throw new BadRequestException('소비에 실패했습니다.');
    }

    // TODO: give reward
  }
  async getGoogleKeyMap(): Promise<Map<string, string>> {
    const res = await axios.get(this.GOOGLE_AD_KEY_URL);
    const { keys } = res.data;
    if (!keys) throw new InternalServerErrorException('Google AdMob Key Error');
    const keyMap = new Map();
    keys.forEach((key) => {
      keyMap.set(key.keyId, crypto.createPublicKey(key.pem));
    });
    return keys;
  }

  async verify(queryUrl: string, debug: boolean) {
    const { signature, key_id } = queryString.parse(queryUrl);

    if (
      !signature ||
      typeof signature !== 'string' ||
      !key_id ||
      typeof key_id !== 'string'
    ) {
      throw new BadRequestException('Invalid signature');
    }

    if (debug) {
      console.debug('Signature and KeyId ---');
      console.debug(signature, key_id);
    }

    const [, queryParamsString] = queryUrl.split('?');
    if (!queryParamsString) {
      throw new BadRequestException('Invalid query params');
    }

    if (debug) {
      console.debug('Query param string ---');
      console.debug(queryParamsString);
    }

    const contentToVerify = queryParamsString.substring(
      0,
      queryParamsString.indexOf('signature') - 1,
    );

    if (debug) {
      console.debug('Content to verify ---');
      console.debug(contentToVerify);
    }
    const keyMap = await this.getGoogleKeyMap();

    if (keyMap.get(key_id)) {
      const publicKey = keyMap.get(key_id);
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(contentToVerify);
      const result = verifier.verify(publicKey, signature, 'base64');
      if (result) return true;
      else throw new BadRequestException('Invalid signature');
    } else throw new BadRequestException('Invalid key id');
  }

  async validateAdMob(queryUrl: string) {
    const debug = false;
    await this.verify(queryUrl, debug);
    // TODO: give reward
  }
}
