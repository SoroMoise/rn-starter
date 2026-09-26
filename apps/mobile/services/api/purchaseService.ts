import { ENTITLEMENT_PREMIUM, REVENUECAT_API_KEY } from '@/constants/purchases'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  PurchasesError,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases'

export type PurchaseFailure =
  | 'cancelled'
  | 'pending'
  | 'already_owned'
  | 'not_allowed'
  | 'store_problem'
  | 'network'
  | 'unknown'

const FAILURE_BY_CODE: Partial<Record<string, PurchaseFailure>> = {
  [PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR]: 'cancelled',
  // RevenueCat rejects a purchase whose payment the store has not settled yet; it never resolves.
  [PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR]: 'pending',
  [PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR]: 'already_owned',
  [PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR]: 'not_allowed',
  [PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR]: 'store_problem',
  [PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR]: 'store_problem',
  [PURCHASES_ERROR_CODE.PRODUCT_REQUEST_TIMED_OUT_ERROR]: 'store_problem',
  [PURCHASES_ERROR_CODE.NETWORK_ERROR]: 'network',
  [PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR]: 'network',
  [PURCHASES_ERROR_CODE.API_ENDPOINT_BLOCKED]: 'network',
}

function classifyError(error: unknown): PurchaseFailure {
  const e = error as Partial<PurchasesError> | undefined
  if (e?.userCancelled === true) return 'cancelled'
  return FAILURE_BY_CODE[String(e?.code ?? '')] ?? 'unknown'
}

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

  // The store page for the subscription actually held; null when there is nothing to manage.
  managementUrl({ customerInfo }: { customerInfo: CustomerInfo }): string | null {
    return customerInfo.managementURL
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

  // A known condition — offline, a closed billing sheet, a store that is down — is a
  // breadcrumb, not a non-fatal: recorded, it would bury the bugs Crashlytics is there to surface.
  reportFailure({ error, source }: { error: unknown; source: string }): PurchaseFailure {
    const reason = classifyError(error)
    if (reason === 'unknown') {
      const code = (error as Partial<PurchasesError> | undefined)?.code
      void crashlyticsService.recordError(error, { source, code: String(code ?? 'none') })
    } else {
      crashlyticsService.log(`${source} failed: ${reason}`)
    }
    return reason
  },
}
