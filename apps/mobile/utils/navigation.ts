import { router, type Href } from 'expo-router'

export const resetToHome = (href: Href = '/') => {
  if (router.canDismiss()) router.dismissAll()
  router.replace(href)
}
