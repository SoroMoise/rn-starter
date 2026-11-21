import type { TopicKey } from '@/lib/pageTree'
import type { TopicPage } from '../../types'
import { useCaseExample } from './useCaseExample'

export const topics: Record<TopicKey, TopicPage> = {
  useCaseExample,
}
