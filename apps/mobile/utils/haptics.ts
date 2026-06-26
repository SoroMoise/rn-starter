import {
  impactAsync,
  ImpactFeedbackStyle,
  notificationAsync,
  NotificationFeedbackType,
  selectionAsync,
} from 'expo-haptics'

export const triggerLight = () => {
  impactAsync(ImpactFeedbackStyle.Light).catch(() => {})
}

export const triggerMedium = () => {
  impactAsync(ImpactFeedbackStyle.Medium).catch(() => {})
}

export const triggerHeavy = () => {
  impactAsync(ImpactFeedbackStyle.Heavy).catch(() => {})
}

export const triggerSelection = () => {
  selectionAsync().catch(() => {})
}

export const triggerSuccess = () => {
  notificationAsync(NotificationFeedbackType.Success).catch(() => {})
}

export const triggerWarning = () => {
  notificationAsync(NotificationFeedbackType.Warning).catch(() => {})
}

export const triggerError = () => {
  notificationAsync(NotificationFeedbackType.Error).catch(() => {})
}
