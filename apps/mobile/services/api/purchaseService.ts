import { ENTITLEMENT_PREMIUM, REVENUECAT_API_KEY } from '@/constants/purchases'
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  PurchasesError,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases'

export const purchaseService = {
  async initialize(): Promise<void> {
    Purchases.configure({ apiKey: REVENUECAT_API_KEY })
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG)
    }
  },

  async getCustomerInfo(): Promise<CustomerInfo> {
    return Purchases.getCustomerInfo()
  },

  isPremiumActive({ customerInfo }: { customerInfo: CustomerInfo }): boolean {
    return !!customerInfo.entitlements.active[ENTITLEMENT_PREMIUM]
  },

  async getOfferings(): Promise<PurchasesOfferings> {
    return Purchases.getOfferings()
  },

  async purchasePackage({ pkg }: { pkg: PurchasesPackage }): Promise<CustomerInfo> {
    const result = await Purchases.purchasePackage(pkg)
    return result.customerInfo
  },

  async restorePurchases(): Promise<CustomerInfo> {
    return Purchases.restorePurchases()
  },

  isUserCancelledError(error: unknown): boolean {
    const e = error as PurchasesError
    return e?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR || e?.userCancelled === true
  },
}
