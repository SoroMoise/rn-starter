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

export type SiteContent = {
  nav: {
    home: string
    privacy: string
    terms: string
    support: string
  }
  home: {
    title: string
    description: string
    tagline: string
    body: string
    storeCta: string
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
}

export type LegalContent = {
  privacy: LegalDocument
  terms: LegalDocument
}
