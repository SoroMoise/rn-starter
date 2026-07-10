// The background handler stub is imported at the JS entry point (index.js)
// so any registration side-effects run in every launch context.
export { NOTIFICATION_CHANNEL_ID, ensureNotificationChannels } from './channels'
export { notificationService } from './setup'
