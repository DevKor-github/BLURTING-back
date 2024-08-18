import crypto from 'crypto';
import type {
  JWSTransactionDecodedPayload,
  TransactionInfoResponse,
} from '@apple/app-store-server-library';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios, { type AxiosResponse } from 'axios';
import jwt from 'jsonwebtoken';
import { AppStoreConnectTransactionEntity } from 'src/domain/entities';
import type { ProductPurchase } from 'src/interfaces/productPurchase';
import type { Repository } from 'typeorm';

@Injectable()
export class ValidationService {
  constructor(
    @InjectRepository(AppStoreConnectTransactionEntity)
    private readonly appStoreConnectTransactionRepository: Repository<AppStoreConnectTransactionEntity>,
  ) {}
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
    const queryString: any = await import('query-string');
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
      throw new BadRequestException('Invalid signature');
    }
    throw new BadRequestException('Invalid key id');
  }

  async validateAdMob(queryUrl: string) {
    const debug = false;
    console.log('queryUrl', queryUrl);
    await this.verify(queryUrl, debug);
    // TODO: give reward
  }

  async signAppStoreConnectJwt() {
    const header = {
      alg: 'ES256',
      kid: process.env.APP_STORE_KID,
      type: 'JWT',
    };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: process.env.APP_STORE_ISSURE_ID,
      iat: now,
      exp: now + 60 * 30,
      aud: 'appstoreconnect-v1',
      bid: process.env.APP_STORE_BUNDLE_ID,
    };
    const secret = process.env.APP_STORE_PK;

    return jwt.sign(payload, secret, { algorithm: 'ES256', header });
  }

  decodeAppStoreConnectJwt(token: string) {
    const secret = process.env.APP_STORE_PK;

    return jwt.verify(token, secret, {
      algorithms: ['ES256'],
      complete: false,
    });
  }

  async getTransactionInfo(transactionId: string) {
    const jwt = this.signAppStoreConnectJwt();
    const url = `https://api.storekit.itunes.apple.com/inApps/v1/transactions/${transactionId}`;
    let response: AxiosResponse;
    try {
      response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
    } catch (err) {
      throw new NotFoundException('transaction not found');
    }
    const transactionInfoResponse = response.data as TransactionInfoResponse;
    const info = JSON.parse(
      this.decodeAppStoreConnectJwt(
        transactionInfoResponse.signedTransactionInfo,
      ) as string,
    ) as JWSTransactionDecodedPayload;
    return info;
  }

  async takePointFromTransaction(transactionId: string) {
    const info = await this.getTransactionInfo(transactionId);
    const transaction = await this.appStoreConnectTransactionRepository.findOne(
      {
        where: { transactionId: info.transactionId },
      },
    );
    if (!transaction) {
      const newTransaction = this.appStoreConnectTransactionRepository.create({
        transactionId: info.transactionId,
        price: info.price,
        isDone: true,
      });
      await this.appStoreConnectTransactionRepository.save(newTransaction);
    } else if (transaction.isDone) {
      throw new BadRequestException('already taked point');
    } else {
      transaction.isDone = true;
      await this.appStoreConnectTransactionRepository.save(transaction);
    }
    //TODO: take point
    return 200;
  }
}
