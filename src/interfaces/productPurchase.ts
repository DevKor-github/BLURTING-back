export interface ProductPurchase {
  kind: string;
  purchaseTimeMillis: string;
  purchaseState: 0 | 1 | 2; // 구매 | 취소 | 대기
  consumptionState: 0 | 1; // 소비 | 소비되지 않음 -> 소비성 구매
  developerPayload: string;
  orderId: string;
  purchaseType: 0 | 1 | 2; // 테스트 | 프로모션 | 광고
  acknowledgementState: 0 | 1; // 미확인 | 확인 -> 비소비성 구매
  purchaseToken?: string;
  productId?: string;
  quantity: number;
  obfuscatedExternalAccountId: string;
  obfuscatedExternalProfileId: string;
  regionCode: string;
  refundableQuantity: number;
}
