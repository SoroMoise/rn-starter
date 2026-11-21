import { getContent } from '@/content'
import type { Locale } from '@/lib/i18n'
import { graphFor } from '@/lib/pageGraph'
import { SITE } from '@/lib/site'
import { FinalCta, Sections } from '../content/Blocks'
import { PageHero } from '../layout/PageHero'
import { SiteShell } from '../layout/SiteShell'
import { Icon } from '../ui/Icon'

export function AboutPage({ locale }: { locale: Locale }) {
  const { about, common } = getContent(locale)
  const route = 'about'

  const jsonLd = graphFor({
    locale,
    route,
    pageType: 'AboutPage',
  })

  return (
    <SiteShell locale={locale} route={route} jsonLd={jsonLd}>
      <PageHero
        locale={locale}
        route={route}
        eyebrow={about.eyebrow}
        title={about.h1}
        lead={about.lead}>
        <p>
          <a className="btn btn--secondary" href={`mailto:${SITE.supportEmail}`}>
            <Icon name="mail" size={20} />
            {common.footer.contact} · {SITE.supportEmail}
          </a>
        </p>
      </PageHero>
      <section className="section">
        <div className="container container--prose prose">
          <Sections sections={about.sections} locale={locale} route={route} />
        </div>
      </section>
      <FinalCta locale={locale} route={route} />
    </SiteShell>
  )
}
