import { Language } from '@/types'
import { format, formatDistanceToNow, formatDuration } from 'date-fns'
import { getDateFnsLocale, getIntlLocale } from './date'

export function formatMonthYear(date: Date | number, language: Language = 'en'): string {
  return format(date, 'LLLL yyyy', { locale: getDateFnsLocale(language) })
}

export function formatClockTime(date: Date | number, language: Language = 'en'): string {
  return format(date, 'p', { locale: getDateFnsLocale(language) })
}

export function formatMinutesAsDuration(totalMinutes: number, language: Language = 'en'): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return formatDuration(
    { hours, minutes },
    { locale: getDateFnsLocale(language), format: ['hours', 'minutes'] }
  )
}

export function formatRelativeTime(date: Date | number, language: Language = 'en'): string {
  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: getDateFnsLocale(language),
  })
}

export function formatShortDate(date: Date | number, language: Language = 'en'): string {
  const dateObj = typeof date === 'number' ? new Date(date) : date
  return dateObj.toLocaleDateString(getIntlLocale(language), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(date: Date | number, language: Language = 'en'): string {
  const dateObj = typeof date === 'number' ? new Date(date) : date
  return dateObj.toLocaleString(getIntlLocale(language), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateTimeShort(date: Date | number, language: Language = 'en'): string {
  const dateObj = typeof date === 'number' ? new Date(date) : date
  return dateObj.toLocaleString(getIntlLocale(language), {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function isToday(date: Date | number): boolean {
  const dateObj = typeof date === 'number' ? new Date(date) : date
  const today = new Date()
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  )
}
