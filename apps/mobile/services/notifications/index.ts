// The background handler stub is imported at the JS entry point (index.js)
// so any registration side-effects run in every launch context.
export { ALERTS_CHANNEL_ID, ensureNotificationChannels, recreateAlertsChannel } from './channels'
export { parseAlertPayload, type AlertNotificationData } from './payload'
export { notificationService } from './setup'
