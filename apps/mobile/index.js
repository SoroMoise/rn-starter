// Registers the FCM background message handler (and its headless task) at the very
// top of the JS bundle, before expo-router evaluates any route. The handler used to
// be imported through app/_layout.tsx, but route modules are lazy and never run in a
// headless launch (data message while the app is swiped away), so the headless task
// "ReactNativeFirebaseMessagingHeadlessTask" was never registered and notifications
// were dropped. Importing it here guarantees registration in every launch context.
import 'expo-router/entry'
import './services/notifications/backgroundHandler'
