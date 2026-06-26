// The FCM background message handler is registered at the JS entry point (index.js)
// so its headless task exists in every launch context, including headless launches
// where route modules never evaluate.
export {
  ensureNotificationChannels,
  RATE_ALERTS_CHANNEL_ID,
  recreateRateAlertsChannel,
} from './channels'
export {
  parseAlertPayload,
  type AlertNotificationData,
  type ThresholdAlertNotificationData,
  type VariationAlertNotificationData,
} from './payload'
export { notificationService } from './setup'
