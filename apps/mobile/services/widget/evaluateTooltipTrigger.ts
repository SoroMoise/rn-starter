import { crashlyticsService } from '@/services/api/crashlyticsService'

export async function evaluateTooltipTrigger(args: {
  sessionCount: number
  tooltipShown: boolean
  isWidgetAdded: () => Promise<boolean>
}): Promise<boolean> {
  if (args.tooltipShown) return false
  if (args.sessionCount < 3) return false
  try {
    const added = await args.isWidgetAdded()
    if (added) return false
  } catch (err) {
    void crashlyticsService.recordError(err, { source: 'widget_tooltip_is_added' })
    return false
  }
  return true
}
