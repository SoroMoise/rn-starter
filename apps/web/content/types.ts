import type { FeatureGroup, FeatureId } from '@/lib/features'
import type { IconName } from '@/lib/icons'
import type { CoreKey, GuideKey, HubKey, TopicKey } from '@/lib/pageTree'
import type { RouteKey } from '@/lib/routes'

export type Rich = string

export type PageMeta = {
  title: string
  description: string
}

type Gated = { feature?: FeatureId }

export type Block = Gated &
  (
    | { type: 'p'; text: Rich }
    | { type: 'list'; items: Rich[]; ordered?: boolean }
    | { type: 'steps'; items: { title: string; text: Rich }[] }
    | { type: 'callout'; tone: 'tip' | 'note' | 'limit'; title?: string; text: Rich }
    | { type: 'table'; caption?: string; head: string[]; rows: Rich[][] }
    | { type: 'h3'; text: string }
    | { type: 'cta'; text?: string }
  )

export type Section = Gated & {
  id?: string
  title: string
  blocks: Block[]
}

export type QA = Gated & {
  id?: string
  q: string
  a: Rich
}

export type Card = {
  title: string
  text: string
}

export type TopicPage = {
  meta: PageMeta
  breadcrumb: string
  card: Card
  icon: IconName
  eyebrow: string
  h1: string
  lead: Rich
  highlights: string[]
  sections: Section[]
  faq: QA[]
  related: RouteKey[]
}

export type GuidePage = {
  meta: PageMeta
  breadcrumb: string
  card: Card
  h1: string
  lead: Rich
  published: string
  updated: string
  takeaways: Rich[]
  sections: Section[]
  faq: QA[]
  related: RouteKey[]
  howTo?: { name: string; steps: { name: string; text: string }[] }
}

export type HubPage = {
  meta: PageMeta
  breadcrumb: string
  eyebrow: string
  h1: string
  lead: Rich
  sections: Section[]
  faq: QA[]
}

export type FeatureCopy = { title: string; text: Rich }

export type ProPoint = Gated & { icon: IconName; title: string; text: Rich }

export type CommonContent = {
  appDefinition: string
  skipToContent: string
  pageNames: Record<CoreKey, string>
  nav: {
    label: string
    features: string
    pricing: string
    guides: string
    faq: string
    menu: string
  }
  cta: {
    store: string
    storeShort: string
    storeSub: string
    learnMore: string
    readGuide: string
    seeAll: string
  }
  badges: {
    pro: string
    soon: string
    free: string
  }
  footer: {
    product: string
    useCases: string
    resources: string
    contact: string
    rss: string
    rights: string
    trademarks: string
  }
  breadcrumbHome: string
  breadcrumbLabel: string
  aside: {
    title: string
    points: string[]
  }
  onThisPage: string
  related: string
  faqTitle: string
  updated: string
  readingTime: string
  takeaways: string
  finalCta: {
    title: string
    text: string
    note: Rich
  }
  legal: {
    updated: string
    templateNotice: string
  }
  notFound: {
    title: string
    body: string
    cta: string
  }
  ogTagline: string
}

export type HomeContent = {
  meta: PageMeta
  eyebrow: string
  h1: string
  lead: Rich
  reassurance: string[]
  stepsTitle: string
  steps: { title: string; text: Rich }[]
  featuresTitle: string
  featuresLead: Rich
  featureIds: FeatureId[]
  trustEyebrow: string
  trustTitle: string
  trustLead: Rich
  trustPoints: { icon: IconName; title: string; text: Rich }[]
  useCasesTitle: string
  useCasesLead: Rich
  plansTitle: string
  plansLead: Rich
  faqIds: string[]
}

export type FeaturesContent = {
  meta: PageMeta
  eyebrow: string
  h1: string
  lead: Rich
  groups: Record<FeatureGroup, { title: string; lead: Rich }>
  items: Record<FeatureId, FeatureCopy>
  specsTitle: string
  specs: { label: string; value: Rich; feature?: FeatureId }[]
  soonTitle: string
  soonText: Rich
}

export type PricingContent = {
  meta: PageMeta
  eyebrow: string
  h1: string
  lead: Rich
  freeTitle: string
  freeLead: Rich
  freePoints: Rich[]
  proTitle: string
  proLead: Rich
  proPoints: ProPoint[]
  priceNote: Rich
  tableTitle: string
  tableHead: [string, string, string]
  tableRows: { label: Rich; free: Rich; pro: Rich; feature?: FeatureId }[]
  unlockTitle: string
  unlocks: { title: string; text: Rich }[]
  faq: QA[]
}

export type FaqContent = {
  meta: PageMeta
  eyebrow: string
  h1: string
  lead: Rich
  groups: { id: string; title: string; items: QA[] }[]
}

export type AboutContent = {
  meta: PageMeta
  eyebrow: string
  h1: string
  lead: Rich
  sections: Section[]
}

export type LegalSection = {
  title: string
  paragraphs: string[]
  list?: string[]
}

export type LegalDocument = {
  title: string
  description: string
  intro: string[]
  sections: LegalSection[]
}

export type LegalContent = {
  privacy: LegalDocument
  terms: LegalDocument
}

export type SiteContent = {
  common: CommonContent
  home: HomeContent
  features: FeaturesContent
  pricing: PricingContent
  faq: FaqContent
  about: AboutContent
  hubs: Record<HubKey, HubPage>
  topics: Record<TopicKey, TopicPage>
  guides: Record<GuideKey, GuidePage>
  legal: LegalContent
}

export type PageInfo = {
  meta: PageMeta
  h1: string
  label: string
  card: Card
}
